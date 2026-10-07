import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsString,
} from 'class-validator';

export type CustomerBulkAction = 'SUSPEND' | 'ACTIVATE';

export class BulkCustomersDto {
  @ApiProperty({ type: [String], description: 'Customer IDs to act on' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({ enum: ['SUSPEND', 'ACTIVATE'] })
  @IsIn(['SUSPEND', 'ACTIVATE'])
  action!: CustomerBulkAction;
}
