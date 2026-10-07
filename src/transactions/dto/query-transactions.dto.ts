import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryTransactionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Minimum amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountMin?: number;

  @ApiPropertyOptional({ description: 'Maximum amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountMax?: number;
}
