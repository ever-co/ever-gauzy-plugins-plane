import { Module } from '@nestjs/common';
import { SearchIssuesService } from './search-issues.service';
import { SearchIssuesController } from './search-issues.controller';

@Module({
	providers: [SearchIssuesService],
	controllers: [SearchIssuesController],
	exports: [SearchIssuesService]
})
export class SearchIssuesModule {}
