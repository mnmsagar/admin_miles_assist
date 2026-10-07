import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import {
  buildPage,
  dateRangeFilter,
  resolveOrderBy,
} from '../common/pagination/paginate';

export interface CreateAuditEntry {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const SORTABLE = ['createdAt', 'action', 'entityType'];

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record an admin operation in the database.
   */
  async log(entry: CreateAuditEntry) {
    try {
      return await this.prisma.adminActivityLog.create({
        data: {
          adminUserId: entry.adminUserId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          description: entry.description,
          details: entry.details,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to record audit log: ${(err as Error).message}`, (err as Error).stack);
      return null;
    }
  }

  /**
   * Query admin activity logs with pagination, search, and filters.
   */
  async findAll(query: QueryAuditLogsDto) {
    const where: Prisma.AdminActivityLogWhereInput = {};

    if (query.adminUserId) where.adminUserId = query.adminUserId;
    if (query.action) where.action = { equals: query.action, mode: 'insensitive' };
    if (query.entityType) where.entityType = { equals: query.entityType, mode: 'insensitive' };

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { entityId: { contains: query.search, mode: 'insensitive' } },
        { adminUser: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { adminUser: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const created = dateRangeFilter(query.dateFrom, query.dateTo);
    if (created) where.createdAt = created;

    const orderBy = resolveOrderBy(
      query.sortBy,
      query.sortOrder,
      SORTABLE,
      'createdAt',
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.adminActivityLog.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
        include: {
          adminUser: {
            select: {
              id: true,
              displayId: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.adminActivityLog.count({ where }),
    ]);

    return buildPage(data, total, query.page, query.limit);
  }
}
