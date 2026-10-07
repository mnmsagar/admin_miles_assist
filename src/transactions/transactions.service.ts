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

const SORTABLE = ['occurredAt', 'amount', 'status', 'type', 'createdAt'];

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTransactionsDto) {
    const where: Prisma.TransactionWhereInput = {};

    if (query.search) {
      where.OR = [
        { displayId: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
        { customer: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { email: { contains: query.search, mode: 'insensitive' } } },
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
          customer: {
            select: { id: true, fullName: true, email: true, displayId: true },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return buildPage(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const txn = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, displayId: true },
        },
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`);

    // Related ledger entries: other transactions for the same customer
    const ledger = await this.prisma.transaction.findMany({
      where: { customerId: txn.customerId, id: { not: txn.id } },
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
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

    const displayId = await this.generateDisplayId();
    const reference = formatDisplayId('REF', Math.floor(Math.random() * 100000000));

    return this.prisma.transaction.create({
      data: {
        displayId,
        reference,
        customerId: dto.customerId,
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
