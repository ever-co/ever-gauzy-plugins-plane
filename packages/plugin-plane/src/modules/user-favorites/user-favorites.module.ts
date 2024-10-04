import { RouterModule } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { UserFavoritesService } from './user-favorites.service';
import { UserFavoritesController } from './user-favorites.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/user-favorite', module: UserFavoritesModule },
		]),
	],
	providers: [UserFavoritesService],
	controllers: [UserFavoritesController],
	exports: [UserFavoritesService],
})
export class UserFavoritesModule {}
