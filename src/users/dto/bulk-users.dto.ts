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

export type UserBulkAction = 'CHANGE_ROLE' | 'SUSPEND' | 'ACTIVATE';

export class BulkUsersDto {
  @ApiProperty({ type: [String], description: 'User IDs to act on' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({ enum: ['CHANGE_ROLE', 'SUSPEND', 'ACTIVATE'] })
  @IsIn(['CHANGE_ROLE', 'SUSPEND', 'ACTIVATE'])
  action!: UserBulkAction;

  @ApiPropertyOptional({
    enum: AdminRole,
    description: 'Required when action = CHANGE_ROLE',
  })
  @ValidateIf((o) => o.action === 'CHANGE_ROLE')
  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;
}
