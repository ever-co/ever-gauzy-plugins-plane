import { Module } from '@nestjs/common';
import { WorkItemsService } from './work-items.service';
import { WorkItemsController } from './work-items.controller';

@Module({
	providers: [WorkItemsService],
	controllers: [WorkItemsController],
	exports: [WorkItemsService]
})
export class WorkItemsModule {}
