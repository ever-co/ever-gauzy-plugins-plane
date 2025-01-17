import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { WidgetService } from './widget.service';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/api/dashboard', module: DashboardModule }
		])
	],
	providers: [DashboardService, WidgetService],
	controllers: [DashboardController],
	exports: [DashboardService, WidgetService]
})
export class DashboardModule {}
