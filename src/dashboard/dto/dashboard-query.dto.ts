import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ChartRange } from './chart-query.dto';

export type DashboardTab = 'overview' | 'analytics';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    enum: ['overview', 'analytics'],
    default: 'overview',
    description: 'Which dashboard tab to load',
  })
  @IsOptional()
  @IsIn(['overview', 'analytics'])
  tab: DashboardTab = 'overview';

  @ApiPropertyOptional({
    enum: ['7D', '1M', '3M', '6M', '1Y'],
    default: '6M',
    description: 'Revenue chart range (overview tab)',
  })
  @IsOptional()
  @IsIn(['7D', '1M', '3M', '6M', '1Y'])
  range: ChartRange = '6M';
}
