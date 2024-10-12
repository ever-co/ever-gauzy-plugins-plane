import { Module } from '@nestjs/common';
import { IssueViewService } from './view.service';
import { IssueViewController } from './view.controller';

@Module({
	providers: [IssueViewService],
	controllers: [IssueViewController],
	exports: [IssueViewService],
})
export class IssueViewModule {}
