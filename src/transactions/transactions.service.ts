import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import {
  buildPage,
  resolveOrderBy,
  dateRangeFilter,
} from '../common/pagination/paginate';
import { nextDisplayId, formatDisplayId } from '../common/utils/display-id';
import { round2 } from '../common/utils/stats';
import { toCsv } from '../common/utils/csv';

const SORTABLE = ['occurredAt', 'amount', 'status', 'type', 'createdAt'];

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Stat cards for the Transactions screen. */
  async getStats() {
    const [agg, completed] = await this.prisma.$transaction([
      this.prisma.transaction.aggregate({
        _count: true,
        _sum: { grandTotal: true },
        _avg: { grandTotal: true },
      }),
      this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
    ]);

    const totalTransactions = agg._count;
    const totalVolume = agg._sum.grandTotal ? Number(agg._sum.grandTotal) : 0;
    const avgTransaction = agg._avg.grandTotal ? Number(agg._avg.grandTotal) : 0;
    const successRate =
      totalTransactions > 0
        ? Math.round((completed / totalTransactions) * 1000) / 10
        : 0;

    return {
      totalTransactions,
      totalVolume: round2(totalVolume),
      avgTransaction: round2(avgTransaction),
      successRate, // percentage, 1 decimal
    };
  }

  /** Builds the shared filter used by both list and CSV export. */
  private buildWhere(query: QueryTransactionsDto): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {};

    if (query.search) {
      where.OR = [
        { displayId: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    if (query.amountMin != null || query.amountMax != null) {
      where.amount = {};
      if (query.amountMin != null) where.amount.gte = query.amountMin;
      if (query.amountMax != null) where.amount.lte = query.amountMax;
    }

    const occurred = dateRangeFilter(query.dateFrom, query.dateTo);
    if (occurred) where.occurredAt = occurred;

    return where;
  }

  async findAll(query: QueryTransactionsDto) {
    const where = this.buildWhere(query);
    const orderBy = resolveOrderBy(
      query.sortBy,
      query.sortOrder,
      SORTABLE,
      'occurredAt',
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, displayId: true },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return buildPage(data, total, query.page, query.limit);
  }

  /** Export all matching transactions (ignores pagination) as a CSV string. */
  async exportCsv(query: QueryTransactionsDto): Promise<string> {
    const where = this.buildWhere(query);
    const orderBy = resolveOrderBy(
      query.sortBy,
      query.sortOrder,
      SORTABLE,
      'occurredAt',
    );

    const rows = await this.prisma.transaction.findMany({
      where,
      orderBy,
      include: {
        user: { select: { fullName: true, email: true, displayId: true } },
      },
    });

    const headers = [
      'Transaction ID',
      'Reference',
      'User',
      'Email',
      'Type',
      'Amount',
      'Status',
      'Payment Method',
      'Date & Time',
    ];
    const data = rows.map((t) => [
      t.displayId,
      t.reference ?? '',
      t.user.fullName,
      t.user.email,
      t.type,
      Number(t.amount).toFixed(2),
      t.status,
      t.paymentMethod ?? '',
      t.occurredAt.toISOString(),
    ]);

    return toCsv(headers, data);
  }

  async findOne(id: string) {
    const txn = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, displayId: true },
        },
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`);

    // Related ledger entries: other transactions for the same user
    const ledger = await this.prisma.transaction.findMany({
      where: { userId: txn.userId, id: { not: txn.id } },
      orderBy: { occurredAt: 'desc' },
      take: 5,
      select: {
        id: true,
        displayId: true,
        paymentMethod: true,
        amount: true,
        status: true,
        settledAt: true,
      },
    });

    return { ...txn, ledger };
  }

  async create(dto: CreateTransactionDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const displayId = await this.generateDisplayId();
    const reference = formatDisplayId('REF', Math.floor(Math.random() * 100000000));

    return this.prisma.transaction.create({
      data: {
        displayId,
        reference,
        userId: dto.userId,
        type: dto.type,
        amount: dto.amount,
        status: dto.status,
        paymentMethod: dto.paymentMethod,
        gatewayFee: dto.gatewayFee,
        subtotal: dto.subtotal,
        grandTotal: dto.grandTotal,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        events: {
          create: {
            label: 'Initiated',
            description: 'Transaction created',
          },
        },
      },
      include: { events: true },
    });
  }

  async updateStatus(id: string, dto: UpdateTransactionStatusDto) {
    const txn = await this.prisma.transaction.findUnique({ where: { id } });
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        status: dto.status,
        settledAt: dto.status === 'COMPLETED' ? new Date() : txn.settledAt,
        events: {
          create: {
            label: `Status changed to ${dto.status}`,
            description: dto.note,
          },
        },
      },
      include: { events: { orderBy: { occurredAt: 'desc' } } },
    });
  }

  private async generateDisplayId(): Promise<string> {
    const last = await this.prisma.transaction.findFirst({
      orderBy: { displayId: 'desc' },
      select: { displayId: true },
    });
    return nextDisplayId('TXN', last ? [last.displayId] : []);
  }
}
