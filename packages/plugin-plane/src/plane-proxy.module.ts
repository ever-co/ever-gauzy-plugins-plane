import { DynamicModule, Logger, MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import {
	PLANE_PLUGIN_OPTIONS,
	PlanePluginAsyncOptions,
	PlanePluginOptions
} from './plane-plugin-options.interface';
import { PlaneConfigRegistry } from './plane-config.registry';
import { ApiFetchModule } from './modules/api-fetch/api-fetch.module';
import { AuthModule } from './modules/auth/auth.module';
import { InstancesModule } from './modules/instances/instances.module';
import { UserModule } from './modules/user/user.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { StatesModule } from './modules/states/states.module';
import { IssuesModule } from './modules/issues/issues.module';
import { GlobalHttpModule } from './modules/http.module';
import { IssueLabelsModule } from './modules/issues/issue-labels/issue-labels.module';
import { ProjectModule } from './modules/project/project.module';
import { IssueRelationsModule } from './modules/issue-relations/issue-relations.module';
import { ProjectModuleModule } from './modules/project-module/project-module.module';
import { CommentsModule } from './modules/comments/comments.module';
import { UserFavoritesModule } from './modules/user-favorites/user-favorites.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { IssueViewModule } from './modules/views/view.module';
import { WorkspaceIssueViewModule } from './modules/views/workspace-view.module';
import { IssueLinksModule } from './modules/issue-links/issue-links.module';
import { CyclesModule } from './modules/cycles/cycles.module';
import { ActivityModule } from './modules/activity/activity.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { IntakeIssuesModule } from './modules/issues/intake-issues/intake-issues.module';
import { EmployeePropertiesModule } from './modules/employee-properties/employee-properties.module';
import { MentionModule } from './modules/mention/mention.module';
import { TokenMiddleware } from './modules/api-fetch/token.middleware';
import { WorkspaceMiddleware } from './modules/workspace/workspace.middleware';
import { AuthGuard } from './modules/auth/auth.guard';
import { TimezonesModule } from './modules/timezones/timezones.module';
import { NotificationModule } from './modules/notification/notification.module';
import { WorkspaceSlugModule } from './modules/workspace-slug/workspace-slug.module';
import { WorkspacesModule } from './modules/workspace/workspaces.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { WorkItemsModule } from './modules/work-items/work-items.module';
import { SidebarPreferencesModule } from './modules/sidebar-preferences/sidebar-preferences.module';
import { RecentVisitsModule } from './modules/recent-visits/recent-visits.module';
import { LoggerModule } from './modules/logger';
import { AdvanceAnalyticsModule } from './modules/advance-analytics/advance-analytics.module';
import { WorkspaceAdvanceAnalyticsModule } from './modules/advance-analytics/workspace-advance-analytics.module';
import { PagesModule } from './modules/pages/pages.module';
import { FileAssetsModule } from './modules/file-assets/file-assets.module';
import { StickiesModule } from './modules/stickies/stickies.module';

const FEATURE_MODULES = [
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
	WorkspaceAdvanceAnalyticsModule,
	PagesModule,
	FileAssetsModule,
	StickiesModule
];

@Module({})
export class PlaneProxyModule implements NestModule, OnModuleInit {
	private readonly logger = new Logger(PlaneProxyModule.name);

	constructor() {}

	/**
	 * Register the module with static options.
	 */
	static forRoot(options: PlanePluginOptions): DynamicModule {
		PlaneConfigRegistry.initialize(options);

		return {
			module: PlaneProxyModule,
			global: true,
			imports: [...FEATURE_MODULES],
			providers: [
				{
					provide: PLANE_PLUGIN_OPTIONS,
					useValue: options
				},
				{
					provide: APP_GUARD,
					useClass: AuthGuard
				}
			],
			exports: [PLANE_PLUGIN_OPTIONS]
		};
	}

	/**
	 * Register the module with async options (e.g. from ConfigService or DB).
	 */
	static forRootAsync(asyncOptions: PlanePluginAsyncOptions): DynamicModule {
		return {
			module: PlaneProxyModule,
			global: true,
			imports: [...(asyncOptions.imports || []), ...FEATURE_MODULES],
			providers: [
				{
					provide: PLANE_PLUGIN_OPTIONS,
					useFactory: (...args: any[]) => {
						const options = asyncOptions.useFactory(...args);
						if (options instanceof Promise) {
							return options.then((opts) => {
								PlaneConfigRegistry.initialize(opts);
								return opts;
							});
						}
						PlaneConfigRegistry.initialize(options);
						return options;
					},
					inject: asyncOptions.inject || []
				},
				{
					provide: APP_GUARD,
					useClass: AuthGuard
				}
			],
			exports: [PLANE_PLUGIN_OPTIONS]
		};
	}

	onModuleInit() {
		this.logger.log('PlaneProxyModule initialized');
		this.logger.log(`Gauzy API URL: ${PlaneConfigRegistry.externalBaseApiUrl}`);
	}

	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(cookieParser(), TokenMiddleware, WorkspaceMiddleware)
			.forRoutes('*');
	}
}
