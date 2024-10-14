import { RouterModule } from '@nestjs/core';
import { Global, Module, forwardRef } from '@nestjs/common';
import { UserFavoritesService } from './user-favorites.service';
import { UserFavoritesController } from './user-favorites.controller';
import { ProjectModule } from '../project/project.module';
import { ProjectModuleModule } from '../project-module/project-module.module';
import { IssueViewModule } from '../views/view.module';

@Global()
@Module({
	imports: [
		RouterModule.register([
			{ path: '/user-favorites', module: UserFavoritesModule },
		]),
		forwardRef(() => IssueViewModule),
		forwardRef(() => ProjectModule),
		forwardRef(() => ProjectModuleModule),
	],
	providers: [UserFavoritesService],
	controllers: [UserFavoritesController],
	exports: [UserFavoritesService],
})
export class UserFavoritesModule {}
