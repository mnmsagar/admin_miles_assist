import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChartQueryDto, ChartRange } from './dto/chart-query.dto';
import { pctChange, startOfMonth } from '../common/utils/stats';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** The 4 KPI cards, each with a vs-last-month comparison. */
  async getStats() {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(now, -1);

    const revenueWhere = (from?: Date, to?: Date): Prisma.TransactionWhereInput => ({
      type: 'PAYMENT',
      status: 'COMPLETED',
      ...(from || to ? { occurredAt: { gte: from, lt: to } } : {}),
    });

    const [
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      revenueAllAgg,
      revenueThisAgg,
      revenueLastAgg,
      activeBookings,
      activeBookingsLast,
      pendingTxns,
      pendingTxnsLast,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { joinedAt: { gte: thisMonthStart } } }),
      this.prisma.user.count({
        where: { joinedAt: { gte: lastMonthStart, lt: thisMonthStart } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: revenueWhere(),
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: revenueWhere(thisMonthStart, undefined),
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: revenueWhere(lastMonthStart, thisMonthStart),
      }),
      this.prisma.booking.count({
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
      }),
      this.prisma.booking.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      this.prisma.transaction.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
    ]);

    const num = (v: Prisma.Decimal | null) => (v ? Number(v) : 0);

    return {
      totalUsers: pctChange(totalUsers, totalUsers - usersThisMonth),
      totalRevenue: {
        ...pctChange(num(revenueThisAgg._sum.amount), num(revenueLastAgg._sum.amount)),
        total: num(revenueAllAgg._sum.amount),
      },
      activeBookings: pctChange(activeBookings, activeBookingsLast),
      pendingTransactions: pctChange(pendingTxns, pendingTxnsLast),
      // Secondary stats shown across the UI
      meta: {
        newUsersThisMonth: usersThisMonth,
        newUsersLastMonth: usersLastMonth,
      },
    };
  }

  /** Revenue time-series for the chart (daily for 7D, monthly otherwise). */
  async getCharts(query: ChartQueryDto) {
    const now = new Date();
    const range = query.range;

    if (range === '7D') {
      return this.dailyRevenue(now, 7);
    }
    const months = this.monthsForRange(range);
    return this.monthlyRevenue(now, months);
  }

  private monthsForRange(range: ChartRange): number {
    switch (range) {
      case '1M':
        return 1;
      case '3M':
        return 3;
      case '6M':
        return 6;
      case '1Y':
        return 12;
      default:
        return 6;
    }
  }

  private async dailyRevenue(now: Date, days: number) {
    const points: { label: string; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const agg = await this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'PAYMENT',
          status: 'COMPLETED',
          occurredAt: { gte: day, lt: next },
        },
      });
      points.push({
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: agg._sum.amount ? Number(agg._sum.amount) : 0,
      });
    }
    return { range: '7D', series: points };
  }

  private async monthlyRevenue(now: Date, months: number) {
    const points: { label: string; revenue: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(now, -i);
      const monthEnd = startOfMonth(now, -i + 1);
      const agg = await this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'PAYMENT',
          status: 'COMPLETED',
          occurredAt: { gte: monthStart, lt: monthEnd },
        },
      });
      points.push({
        label: monthStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        revenue: agg._sum.amount ? Number(agg._sum.amount) : 0,
      });
    }
    return { range: `${months}M`, series: points };
  }

  /** System alerts for the dashboard. */
  async getAlerts() {
    const alerts = await this.prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return { data: alerts };
  }

  /** Latest system-health snapshot (seeded telemetry). */
  async getHealth() {
    const snapshot = await this.prisma.systemHealthSnapshot.findFirst({
      orderBy: { capturedAt: 'desc' },
    });
    return (
      snapshot ?? {
        uptimePercent: 0,
        avgResponseTimeMs: 0,
        activeSessions: 0,
        capturedAt: new Date(),
      }
    );
  }
}
