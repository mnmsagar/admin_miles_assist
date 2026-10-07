import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ChartRange } from './chart-query.dto';

export type DashboardTab = 'overview' | 'analytics' | 'reports' | 'settings';

const TABS: DashboardTab[] = ['overview', 'analytics', 'reports', 'settings'];

export class DashboardQueryDto {
  @ApiPropertyOptional({
    enum: TABS,
    default: 'overview',
    description: 'Which dashboard tab to load',
  })
  @IsOptional()
  @IsIn(TABS)
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
