import { ApiOperation } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ID, IFavoriteData } from '@plane-plugin/models';
import { UserFavoritesService } from './user-favorites.service';
import { CreateFavoriteDTO } from './dto';

@Controller()
export class UserFavoritesController {
	constructor(private readonly _favoriteService: UserFavoritesService) {}

	/**
	 * @description Find employee favorites
	 * @returns  A promise resolved to transformed favorites
	 * @memberof UserFavoritesController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get User Favorites' })
	@Get()
	async findEmployeeFavorites() {
		return await this._favoriteService.findEmployeeFavorites();
	}

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

	/**
	 * @description Delete element from favorites
	 * @param {ID} id - The ID of favorite to be deleted
	 * @returns - A promise resolved after favorite deleted
	 * @memberof UserFavoritesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete element from favorites' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._favoriteService.delete(id);
	}
}
