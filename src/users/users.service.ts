import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { BulkUsersDto } from './dto/bulk-users.dto';
import { toUserDto } from './users.mapper';
import {
  buildPage,
  resolveOrderBy,
  dateRangeFilter,
} from '../common/pagination/paginate';
import { nextDisplayId } from '../common/utils/display-id';

const SORTABLE = ['fullName', 'email', 'role', 'status', 'joinedAt', 'lastActiveAt'];

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get saltRounds(): number {
    return Number(this.config.get('BCRYPT_SALT_ROUNDS') ?? 10);
  }

  async findAll(query: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {};

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

    const orderBy = resolveOrderBy(
      query.sortBy,
      query.sortOrder,
      SORTABLE,
      'joinedAt',
    );

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPage(rows.map(toUserDto), total, query.page, query.limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        transactions: { orderBy: { occurredAt: 'desc' }, take: 5 },
        bookings: { orderBy: { scheduledAt: 'desc' }, take: 5 },
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const displayId = await this.generateDisplayId();
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    const user = await this.prisma.user.create({
      data: {
        displayId,
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: dto.role,
        status: dto.status,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        mailingAddress: dto.mailingAddress,
        avatarUrl: dto.avatarUrl,
        twoFactorEnabled: dto.twoFactorEnabled,
      },
    });
    return toUserDto(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
    return toUserDto(user);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
    return { id, deleted: true };
  }

  async bulk(dto: BulkUsersDto) {
    const data: Prisma.UserUpdateManyMutationInput = {};
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
    const result = await this.prisma.user.updateMany({
      where: { id: { in: dto.userIds } },
      data,
    });
    return { updated: result.count, action: dto.action };
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.user.count({ where: { id } });
    if (!count) throw new NotFoundException(`User ${id} not found`);
  }

  private async generateDisplayId(): Promise<string> {
    const last = await this.prisma.user.findFirst({
      orderBy: { displayId: 'desc' },
      select: { displayId: true },
    });
    return nextDisplayId('USR', last ? [last.displayId] : []);
  }
}
