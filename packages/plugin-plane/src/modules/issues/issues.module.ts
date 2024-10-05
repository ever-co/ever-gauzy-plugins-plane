import { forwardRef, Module } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { StatesModule } from '../states/states.module';
import { SearchIssuesModule } from './search-issues/search-issues.module';
import { CommentsModule } from '../comments/comments.module';
import { ProjectModule } from '../project/project.module';
import { ReactionsModule } from '../reactions/reactions.module';

@Module({
	imports: [
		StatesModule,
		SearchIssuesModule,
		CommentsModule,
		ReactionsModule,
		forwardRef(() => ProjectModule),
	],
	providers: [IssuesService],
	controllers: [IssuesController],
	exports: [IssuesService],
})
export class IssuesModule {}
