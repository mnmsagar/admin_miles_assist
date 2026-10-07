import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, AdminRole } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: AdminRole, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({ enum: AccountStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
