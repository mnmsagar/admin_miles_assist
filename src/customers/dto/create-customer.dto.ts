import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, AdminRole } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Sarah Johnson' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: 'sarah.johnson@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+1 555-0123' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1992-03-14' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '123 Business Rd, New York, NY' })
  @IsOptional()
  @IsString()
  mailingAddress?: string;

  @ApiPropertyOptional({ enum: AdminRole, default: AdminRole.VIEWER })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({ enum: AccountStatus, default: AccountStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}
