import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { IssueLabelsService } from './issue-labels.service';
import { IssueLabelsController } from './issue-labels.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/issue-labels', module: IssueLabelsModule },
		]),
	],
	providers: [IssueLabelsService],
	controllers: [IssueLabelsController],
	exports: [IssueLabelsService],
})
export class IssueLabelsModule {}
