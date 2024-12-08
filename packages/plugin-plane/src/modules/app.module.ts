import { Module } from '@nestjs/common';
import { InstancesModule } from './instances/instances.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ApiFetchModule } from './api-fetch/api-fetch.module';
import { UserModule } from './user/user.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { StatesModule } from './states/states.module';
import { IssuesModule } from './issues/issues.module';
import { GlobalHttpModule } from './http.module';
import { IssueLabelsModule } from './issues/issue-labels/issue-labels.module';
import { ProjectModule } from './project/project.module';
import { IssueRelationsModule } from './issue-relations/issue-relations.module';
import { ProjectModuleModule } from './project-module/project-module.module';
import { CommentsModule } from './comments/comments.module';
import { UserFavoritesModule } from './user-favorites/user-favorites.module';
import { ReactionsModule } from './reactions/reactions.module';
import { IssueViewModule } from './views/view.module';
import { WorkspaceIssueViewModule } from './views/workspace-view.module';
import { IssueLinksModule } from './issue-links/issue-links.module';
import { CyclesModule } from './cycles/cycles.module';
import { ActivityModule } from './activity/activity.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		GlobalHttpModule,
		ApiFetchModule,
		AuthModule,
		InstancesModule,
		UserModule,
		WorkspaceModule,
		StatesModule,
		IssuesModule,
		IssueLabelsModule,
		ProjectModule,
		IssueRelationsModule,
		ProjectModuleModule,
		CommentsModule,
		UserFavoritesModule,
		ReactionsModule,
		IssueViewModule,
		WorkspaceIssueViewModule,
		IssueLinksModule,
		CyclesModule,
		ActivityModule,
		DashboardModule,
		SubscriptionModule
	]
})
export class AppModule {}
