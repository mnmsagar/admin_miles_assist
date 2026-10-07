import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export type CustomerBulkAction = 'CHANGE_ROLE' | 'SUSPEND' | 'ACTIVATE';

export class BulkCustomersDto {
  @ApiProperty({ type: [String], description: 'Customer IDs to act on' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({ enum: ['CHANGE_ROLE', 'SUSPEND', 'ACTIVATE'] })
  @IsIn(['CHANGE_ROLE', 'SUSPEND', 'ACTIVATE'])
  action!: CustomerBulkAction;

  @ApiPropertyOptional({
    enum: AdminRole,
    description: 'Required when action = CHANGE_ROLE',
  })
  @ValidateIf((o) => o.action === 'CHANGE_ROLE')
  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;
}
