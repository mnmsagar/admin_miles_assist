import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import {
  buildPage,
  resolveOrderBy,
  dateRangeFilter,
} from '../common/pagination/paginate';
import { nextDisplayId } from '../common/utils/display-id';

const SORTABLE = ['scheduledAt', 'amount', 'status', 'serviceType', 'createdAt'];

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBookingsDto) {
    const where: Prisma.BookingWhereInput = {};

    if (query.search) {
      where.OR = [
        { displayId: { contains: query.search, mode: 'insensitive' } },
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.serviceType) where.serviceType = query.serviceType;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;

    const scheduled = dateRangeFilter(query.dateFrom, query.dateTo);
    if (scheduled) where.scheduledAt = scheduled;

    const orderBy = resolveOrderBy(
      query.sortBy,
      query.sortOrder,
      SORTABLE,
      'scheduledAt',
    );

    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
        include: {
          user: { select: { id: true, fullName: true, email: true, displayId: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return buildPage(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, displayId: true },
        },
        transaction: {
          select: { id: true, displayId: true, amount: true, status: true },
        },
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);

    const completedCount = await this.prisma.booking.count({
      where: { userId: booking.userId, status: 'COMPLETED' },
    });

    return { ...booking, customerCompletedBookings: completedCount };
  }

  async create(dto: CreateBookingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const displayId = await this.generateDisplayId();

    return this.prisma.booking.create({
      data: {
        displayId,
        userId: dto.userId,
        serviceType: dto.serviceType,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes,
        amount: dto.amount,
        status: dto.status,
        location: dto.location,
        meetingTimeSlot: dto.meetingTimeSlot,
        clientNotes: dto.clientNotes,
        paymentStatus: dto.paymentStatus,
        events: {
          create: {
            label: 'Booking Created',
            description: 'Client reservation created',
          },
        },
      },
      include: { events: true },
    });
  }

  async update(id: string, dto: UpdateBookingDto) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Booking ${id} not found`);

    const eventLabel =
      dto.status && dto.status !== existing.status
        ? `Status Set to ${dto.status}`
        : dto.scheduledAt
          ? 'Booking Rescheduled'
          : 'Booking Updated';

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        events: { create: { label: eventLabel } },
      },
      include: { events: { orderBy: { occurredAt: 'desc' } } },
    });
  }

  private async generateDisplayId(): Promise<string> {
    const last = await this.prisma.booking.findFirst({
      orderBy: { displayId: 'desc' },
      select: { displayId: true },
    });
    return nextDisplayId('BKG', last ? [last.displayId] : []);
  }
}
