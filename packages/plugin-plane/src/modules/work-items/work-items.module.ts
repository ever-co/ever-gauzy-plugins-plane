import { Module, forwardRef } from '@nestjs/common';
import { WorkItemsService } from './work-items.service';
import { WorkItemsController } from './work-items.controller';
import { IssuesModule } from '../issues/issues.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
	imports: [forwardRef(() => IssuesModule), SubscriptionModule],
	providers: [WorkItemsService],
	controllers: [WorkItemsController],
	exports: [WorkItemsService]
})
export class WorkItemsModule {}
