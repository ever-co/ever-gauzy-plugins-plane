import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { ApiFetchModule } from './api-fetch/api-fetch.module';
import { AuthModule } from './auth/auth.module';
import { InstancesModule } from './instances/instances.module';
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
import { IntakeIssuesModule } from './issues/intake-issues/intake-issues.module';
import { EmployeePropertiesModule } from './employee-properties/employee-properties.module';
import { MentionModule } from './mention/mention.module';
import { TokenMiddleware } from './api-fetch/token.middleware';
import { WorkspaceMiddleware } from './workspace/workspace.middleware';
import { AuthGuard } from './auth/auth.guard';
import { TimezonesModule } from './timezones/timezones.module';
import { NotificationModule } from './notification/notification.module';
import { WorkspaceSlugModule } from './workspace-slug/workspace-slug.module';
import { WorkspacesModule } from './workspace/workspaces.module';
import { InvitationModule } from './invitation/invitation.module';
import { WorkItemsModule } from './work-items/work-items.module';
import { SidebarPreferencesModule } from './sidebar-preferences/sidebar-preferences.module';
import { RecentVisitsModule } from './recent-visits/recent-visits.module';
import { LoggerModule } from './logger';
import {
    AdvanceAnalyticsModule,
    AdvanceAnalyticsStatsModule,
    AdvanceAnalyticsChartsModule
} from './advance-analytics/advance-analytics.module';
import { PagesModule } from './pages/pages.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		}),
		LoggerModule,
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
		InvitationModule,
		WorkspaceIssueViewModule,
		IssueLinksModule,
		CyclesModule,
		ActivityModule,
		DashboardModule,
		SubscriptionModule,
		IntakeIssuesModule,
		EmployeePropertiesModule,
		MentionModule,
		TimezonesModule,
		NotificationModule,
		WorkspaceSlugModule,
		WorkspacesModule,
		WorkItemsModule,
		SidebarPreferencesModule,
		RecentVisitsModule,
		AdvanceAnalyticsModule,
		AdvanceAnalyticsStatsModule,
		AdvanceAnalyticsChartsModule,
		PagesModule
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AuthGuard
		}
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(cookieParser(), TokenMiddleware, WorkspaceMiddleware)
			.forRoutes('*');
	}
}
