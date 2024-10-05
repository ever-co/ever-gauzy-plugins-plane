import { Module } from '@nestjs/common';
import { IssueLabelsService } from './issue-labels.service';
import { IssueLabelsController } from './issue-labels.controller';

@Module({
	providers: [IssueLabelsService],
	controllers: [IssueLabelsController],
	exports: [IssueLabelsService],
})
export class IssueLabelsModule {}
