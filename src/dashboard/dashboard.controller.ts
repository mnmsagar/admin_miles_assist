import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ChartQueryDto } from './dto/chart-query.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard data by tab (?tab=overview|analytics)' })
  getTab(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getTab(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'KPI cards with vs-last-month comparison' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('charts')
  @ApiOperation({ summary: 'Revenue time-series for the given range' })
  getCharts(@Query() query: ChartQueryDto) {
    return this.dashboardService.getCharts(query);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'System alerts' })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('health')
  @ApiOperation({ summary: 'System health snapshot' })
  getHealth() {
    return this.dashboardService.getHealth();
  }
}
