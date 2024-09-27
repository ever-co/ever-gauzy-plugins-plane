import { Module } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { StatesModule } from '../states/states.module';
import { SearchIssuesModule } from './search-issues/search-issues.module';

@Module({
	imports: [StatesModule, SearchIssuesModule],
	providers: [IssuesService],
	controllers: [IssuesController],
	exports: [IssuesService],
})
export class IssuesModule {}
