import { Module } from '@nestjs/common';
import { IssueLinksService } from './issue-links.service';

@Module({
	providers: [IssueLinksService],
	exports: [IssueLinksService]
})
export class IssueLinksModule {}
