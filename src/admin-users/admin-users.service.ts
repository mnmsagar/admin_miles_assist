import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { BulkAdminUsersDto } from './dto/bulk-admin-users.dto';
import { toAdminUserDto } from './admin-users.mapper';
import {
  buildPage,
  resolveOrderBy,
  dateRangeFilter,
} from '../common/pagination/paginate';
import { nextDisplayId } from '../common/utils/display-id';

const SORTABLE = ['fullName', 'email', 'role', 'status', 'joinedAt', 'lastActiveAt'];

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get saltRounds(): number {
    return Number(this.config.get('BCRYPT_SALT_ROUNDS') ?? 10);
  }

  async findAll(query: QueryAdminUsersDto) {
    const where: Prisma.AdminUserWhereInput = {};

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;

    const joined = dateRangeFilter(query.dateFrom, query.dateTo);
    if (joined) where.joinedAt = joined;

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, 'joinedAt');

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.adminUser.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.adminUser.count({ where }),
    ]);

    return buildPage(rows.map(toAdminUserDto), total, query.page, query.limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Admin user ${id} not found`);
    return toAdminUserDto(user);
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const displayId = await this.generateDisplayId();
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    const user = await this.prisma.adminUser.create({
      data: {
        displayId,
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: dto.role,
        status: dto.status,
        phone: dto.phone,
        avatarUrl: dto.avatarUrl,
        twoFactorEnabled: dto.twoFactorEnabled,
      },
    });
    return toAdminUserDto(user);
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    await this.ensureExists(id);
    const user = await this.prisma.adminUser.update({ where: { id }, data: { ...dto } });
    return toAdminUserDto(user);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.adminUser.delete({ where: { id } });
    return { id, deleted: true };
  }

  async bulk(dto: BulkAdminUsersDto) {
    const data: Prisma.AdminUserUpdateManyMutationInput = {};
    switch (dto.action) {
      case 'CHANGE_ROLE':
        data.role = dto.role;
        break;
      case 'SUSPEND':
        data.status = 'SUSPENDED';
        break;
      case 'ACTIVATE':
        data.status = 'ACTIVE';
        break;
    }
    const result = await this.prisma.adminUser.updateMany({
      where: { id: { in: dto.ids } },
      data,
    });
    return { updated: result.count, action: dto.action };
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.adminUser.count({ where: { id } });
    if (!count) throw new NotFoundException(`Admin user ${id} not found`);
  }

  private async generateDisplayId(): Promise<string> {
    const last = await this.prisma.adminUser.findFirst({
      orderBy: { displayId: 'desc' },
      select: { displayId: true },
    });
    return nextDisplayId('ADM', last ? [last.displayId] : []);
  }
}
