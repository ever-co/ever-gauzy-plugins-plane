import { ApiOperation } from '@nestjs/swagger';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IFavoriteData } from '@plane-plugin/models';
import { UserFavoritesService } from './user-favorites.service';
import { CreateFavoriteDTO } from './dto';

@Controller()
export class UserFavoritesController {
	constructor(private readonly _favoriteService: UserFavoritesService) {}

	/**
	 * @description Add element as favorite
	 * @param {ICreateFavoriteInput} input - Body Request data for creating favorites
	 * @returns A promise resolved to created favorite
	 * @memberof UserFavoritesController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Add to Favorites' })
	@Post()
	async create(@Body() input: CreateFavoriteDTO): Promise<IFavoriteData> {
		return await this._favoriteService.create(input);
	}
}
