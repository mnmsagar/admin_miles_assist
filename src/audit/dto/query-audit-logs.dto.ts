import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryAuditLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by performing admin user ID' })
  @IsOptional()
  @IsUUID()
  adminUserId?: string;

  @ApiPropertyOptional({ description: 'Filter by action (e.g. USER_CREATE, BOOKING_UPDATE)' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type (User, Booking, Transaction, AdminUser, Auth)' })
  @IsOptional()
  @IsString()
  entityType?: string;
}
