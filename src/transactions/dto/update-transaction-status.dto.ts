import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTransactionStatusDto {
  @ApiProperty({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;

  @ApiPropertyOptional({ description: 'Optional note recorded on the event log' })
  @IsOptional()
  @IsString()
  note?: string;
}
