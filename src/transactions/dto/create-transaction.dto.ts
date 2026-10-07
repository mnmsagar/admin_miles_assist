import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Owning user id' })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ example: 150.0, description: 'Negative allowed for refunds' })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @ApiPropertyOptional({ enum: TransactionStatus, default: TransactionStatus.PENDING })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ example: 'Credit Card (Visa ending in 4582)' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 4.9 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  gatewayFee?: number;

  @ApiPropertyOptional({ example: 145.1 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  subtotal?: number;

  @ApiPropertyOptional({ example: 150.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  grandTotal?: number;

  @ApiPropertyOptional({ description: 'When the transaction occurred (ISO)' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
