import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
	imports: [
		RouterModule.register([
			{ path: 'activity', module: ActivityModule },
			{ path: 'history', module: ActivityModule },
		]),
	],
	providers: [ActivityService, HistoryService],
	controllers: [ActivityController, HistoryController],
	exports: [ActivityService, HistoryService],
})
export class ActivityModule {}
