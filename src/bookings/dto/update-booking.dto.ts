import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBookingDto } from './create-booking.dto';

// userId stays fixed after creation; everything else is editable
// (reschedule = change scheduledAt, cancel = set status CANCELLED).
export class UpdateBookingDto extends PartialType(
  OmitType(CreateBookingDto, ['userId'] as const),
) {}
