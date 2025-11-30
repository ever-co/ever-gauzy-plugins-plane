import { Module } from '@nestjs/common';
import { RecentVisitsController } from './recent-visits.controller';
import { RecentVisitsService } from './recent-visits.service';

@Module({
	providers: [RecentVisitsService],
	controllers: [RecentVisitsController],
	exports: [RecentVisitsService]
})
export class RecentVisitsModule {}
