import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { BulkUsersDto } from './dto/bulk-users.dto';
import {
  buildPage,
  resolveOrderBy,
  dateRangeFilter,
} from '../common/pagination/paginate';
import { nextDisplayId } from '../common/utils/display-id';
import { startOfMonth } from '../common/utils/stats';

const SORTABLE = ['fullName', 'email', 'role', 'status', 'joinedAt', 'lastActiveAt'];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Stat cards for the Users screen: total, active, new this month. */
  async getStats() {
    const monthStart = startOfMonth(new Date());
    const [totalUsers, activeUsers, newThisMonth] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { joinedAt: { gte: monthStart } } }),
    ]);
    return { totalUsers, activeUsers, newThisMonth };
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

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, 'joinedAt');

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPage(rows, total, query.page, query.limit);
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
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const displayId = await this.generateDisplayId();

    return this.prisma.user.create({
      data: {
        displayId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        mailingAddress: dto.mailingAddress,
        role: dto.role,
        status: dto.status,
        avatarUrl: dto.avatarUrl,
        twoFactorEnabled: dto.twoFactorEnabled,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
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
      where: { id: { in: dto.ids } },
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
