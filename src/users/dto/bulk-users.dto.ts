import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export type BulkAction = 'CHANGE_ROLE' | 'SUSPEND' | 'ACTIVATE';

export class BulkUsersDto {
  @ApiProperty({ type: [String], description: 'User IDs to act on' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds!: string[];

  @ApiProperty({ enum: ['CHANGE_ROLE', 'SUSPEND', 'ACTIVATE'] })
  @IsIn(['CHANGE_ROLE', 'SUSPEND', 'ACTIVATE'])
  action!: BulkAction;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Required when action = CHANGE_ROLE',
  })
  @ValidateIf((o) => o.action === 'CHANGE_ROLE')
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
