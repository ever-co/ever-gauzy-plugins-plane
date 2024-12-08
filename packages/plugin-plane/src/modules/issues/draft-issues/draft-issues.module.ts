import { Module } from '@nestjs/common';
import { DraftIssuesService } from './draft-issues.service';
import { IssuesModule } from '../issues.module';

@Module({
	imports: [IssuesModule],
	providers: [DraftIssuesService],
	exports: [DraftIssuesService]
})
export class DraftIssuesModule {}
