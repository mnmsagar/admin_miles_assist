import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export type ChartRange = '7D' | '1M' | '3M' | '6M' | '1Y';

export class ChartQueryDto {
  @ApiPropertyOptional({
    enum: ['7D', '1M', '3M', '6M', '1Y'],
    default: '6M',
    description: 'Revenue chart time window',
  })
  @IsOptional()
  @IsIn(['7D', '1M', '3M', '6M', '1Y'])
  range: ChartRange = '6M';
}
