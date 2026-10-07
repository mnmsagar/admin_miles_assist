import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { BulkCustomersDto } from './dto/bulk-customers.dto';
import {
  buildPage,
  resolveOrderBy,
  dateRangeFilter,
} from '../common/pagination/paginate';
import { nextDisplayId } from '../common/utils/display-id';

const SORTABLE = ['fullName', 'email', 'role', 'status', 'joinedAt', 'lastActiveAt'];

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCustomersDto) {
    const where: Prisma.CustomerWhereInput = {};

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
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return buildPage(rows, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        transactions: { orderBy: { occurredAt: 'desc' }, take: 5 },
        bookings: { orderBy: { scheduledAt: 'desc' }, take: 5 },
      },
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const displayId = await this.generateDisplayId();

    return this.prisma.customer.create({
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

  async update(id: string, dto: UpdateCustomerDto) {
    await this.ensureExists(id);
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.customer.delete({ where: { id } });
    return { id, deleted: true };
  }

  async bulk(dto: BulkCustomersDto) {
    const data: Prisma.CustomerUpdateManyMutationInput = {};
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
    const result = await this.prisma.customer.updateMany({
      where: { id: { in: dto.ids } },
      data,
    });
    return { updated: result.count, action: dto.action };
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.customer.count({ where: { id } });
    if (!count) throw new NotFoundException(`Customer ${id} not found`);
  }

  private async generateDisplayId(): Promise<string> {
    const last = await this.prisma.customer.findFirst({
      orderBy: { displayId: 'desc' },
      select: { displayId: true },
    });
    return nextDisplayId('USR', last ? [last.displayId] : []);
  }
}
