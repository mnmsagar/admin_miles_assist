import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings (paginated, filterable, sortable)' })
  findAll(@Query() query: QueryBookingsDto) {
    return this.bookingsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Booking stat cards (total/active/completed/cancelled + change)' })
  getStats() {
    return this.bookingsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking with events + customer summary' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiOperation({ summary: 'Create a booking' })
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Patch(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiOperation({ summary: 'Update / reschedule / cancel a booking' })
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }
}
