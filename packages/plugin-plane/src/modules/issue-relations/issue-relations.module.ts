import { forwardRef, Module } from '@nestjs/common';
import { IssuesModule } from '../issues/issues.module';
import { IssueRelationsService } from './issue-relations.service';

@Module({
	imports: [forwardRef(() => IssuesModule)],
	providers: [IssueRelationsService],
	exports: [IssueRelationsService]
})
export class IssueRelationsModule {}
