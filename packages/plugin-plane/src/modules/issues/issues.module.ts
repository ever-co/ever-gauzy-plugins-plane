import { forwardRef, Module } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { StatesModule } from '../states/states.module';
import { SearchIssuesModule } from './search-issues/search-issues.module';
import { CommentsModule } from '../comments/comments.module';
import { ProjectModule } from '../project/project.module';
import { ReactionsModule } from '../reactions/reactions.module';
import { IssueRelationsModule } from '../issue-relations/issue-relations.module';
import { IssueLinksModule } from '../issue-links/issue-links.module';
import { IssueLabelsModule } from './issue-labels/issue-labels.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { MentionModule } from '../mention/mention.module';

@Module({
	imports: [
		StatesModule,
		IssueLabelsModule,
		SearchIssuesModule,
		CommentsModule,
		ReactionsModule,
		IssueLinksModule,
		SubscriptionModule,
		MentionModule,
		forwardRef(() => IssueRelationsModule),
		forwardRef(() => ProjectModule)
	],
	providers: [IssuesService],
	controllers: [IssuesController],
	exports: [IssuesService]
})
export class IssuesModule {}
