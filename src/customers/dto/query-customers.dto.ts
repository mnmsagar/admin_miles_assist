import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryCustomersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: AccountStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
