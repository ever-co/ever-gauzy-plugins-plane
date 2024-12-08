import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { RouterModule } from '@nestjs/core';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/api/dashboard', module: DashboardModule }
		])
	],
	providers: [DashboardService],
	controllers: [DashboardController]
})
export class DashboardModule {}
