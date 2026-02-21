import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post
} from '@nestjs/common';
import { ID, IPage } from '@plane-plugin/models';
import { PagesService } from './pages.service';
import { CreatePageDTO, UpdatePageDTO } from './dto';

@ApiTags('Pages')
@Controller('projects/:projectId')
export class PagesController {
	constructor(private readonly _pagesService: PagesService) {}

	/**
	 * GET /projects/:projectId/pages/
	 * List all pages for a project.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List pages' })
	@Get('pages')
	async findAll(@Param('projectId') projectId: ID): Promise<IPage[]> {
		return this._pagesService.findAll(projectId);
	}

	/**
	 * GET /projects/:projectId/archived-pages/
	 * List archived pages for a project.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List archived pages' })
	@Get('archived-pages')
	async findArchived(@Param('projectId') projectId: ID): Promise<IPage[]> {
		return this._pagesService.findArchived(projectId);
	}

	/**
	 * GET /projects/:projectId/favorite-pages/
	 * List favorite pages for a project.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List favorite pages' })
	@Get('favorite-pages')
	async fetchFavorites(@Param('projectId') projectId: ID): Promise<IPage[]> {
		return this._pagesService.fetchFavorites(projectId);
	}

	/**
	 * POST /projects/:projectId/favorite-pages/:pageId/
	 * Add page to favorites.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Add page to favorites' })
	@Post('favorite-pages/:pageId')
	async addToFavorites(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.addToFavorites(pageId);
	}

	/**
	 * DELETE /projects/:projectId/favorite-pages/:pageId/
	 * Remove page from favorites.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Remove page from favorites' })
	@Delete('favorite-pages/:pageId')
	async removeFromFavorites(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.removeFromFavorites(pageId);
	}

	/**
	 * POST /projects/:projectId/pages/
	 * Create a page.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create page' })
	@Post('pages')
	async create(@Body() input: CreatePageDTO): Promise<IPage> {
		return this._pagesService.create(input);
	}

	/**
	 * GET /projects/:projectId/pages/:pageId/
	 * Get a single page.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get page' })
	@Get('pages/:pageId')
	async findOne(@Param('pageId') pageId: ID): Promise<IPage> {
		return this._pagesService.findOne(pageId);
	}

	/**
	 * PATCH /projects/:projectId/pages/:pageId/
	 * Update a page.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update page' })
	@Patch('pages/:pageId')
	async update(
		@Param('pageId') pageId: ID,
		@Body() input: UpdatePageDTO
	): Promise<void> {
		return this._pagesService.update(pageId, input);
	}

	/**
	 * DELETE /projects/:projectId/pages/:pageId/
	 * Delete a page.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete page' })
	@Delete('pages/:pageId')
	async delete(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.delete(pageId);
	}

	// ─── Actions ─────────────────────────────────────────────────────────────

	/**
	 * POST /pages/:pageId/archive/
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Archive page' })
	@Post('pages/:pageId/archive')
	async archive(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.archive(pageId);
	}

	/**
	 * DELETE /pages/:pageId/archive/
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Unarchive page' })
	@Delete('pages/:pageId/archive')
	async unarchive(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.unarchive(pageId);
	}

	/**
	 * POST /pages/:pageId/lock/
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Lock page' })
	@Post('pages/:pageId/lock')
	async lock(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.lock(pageId);
	}

	/**
	 * DELETE /pages/:pageId/lock/
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Unlock page' })
	@Delete('pages/:pageId/lock')
	async unlock(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.unlock(pageId);
	}

	/**
	 * POST /pages/:pageId/duplicate/
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Duplicate page' })
	@Post('pages/:pageId/duplicate')
	async duplicate(@Param('pageId') pageId: ID): Promise<IPage> {
		return this._pagesService.duplicate(pageId);
	}

	/**
	 * POST /pages/:pageId/access/
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Update page access' })
	@Post('pages/:pageId/access')
	async updateAccess(
		@Param('pageId') pageId: ID,
		@Body() input: { access: string }
	): Promise<void> {
		return this._pagesService.updateAccess(pageId, input.access);
	}

	/**
	 * POST /pages/:pageId/move/
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Move page to another project' })
	@Post('pages/:pageId/move')
	async move(
		@Param('pageId') pageId: ID,
		@Body() input: { new_project_id: ID }
	): Promise<void> {
		return this._pagesService.move(pageId, input.new_project_id);
	}

	// ─── Description / Binary (Live App) ───────────────────────────────

	/**
	 * GET /pages/:pageId/description/
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get page description binary' })
	@Get('pages/:pageId/description')
	async getDescriptionBinary(@Param('pageId') id: ID): Promise<any> {
		return this._pagesService.getDescriptionBinary(id);
	}

	/**
	 * PATCH /pages/:pageId/description/
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update page description' })
	@Patch('pages/:pageId/description')
	async updateDescription(
		@Param('pageId') id: ID,
		@Body() payload: any
	): Promise<any> {
		return this._pagesService.updateDescription(id, payload);
	}

	/**
	 * GET /pages/:pageId/mentions/
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get page mentions' })
	@Get('pages/:pageId/mentions')
	async fetchUserMentions(@Param('projectId') projectId: ID): Promise<any[]> {
		return this._pagesService.fetchUserMentions(projectId);
	}

	// ─── Versions ────────────────────────────────────────────────────────────

	/**
	 * GET /pages/:pageId/versions/
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get page versions' })
	@Get('pages/:pageId/versions')
	async fetchAllVersions(@Param('pageId') id: ID): Promise<any[]> {
		return this._pagesService.fetchAllVersions(id);
	}

	/**
	 * GET /pages/:pageId/versions/:vId/
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get page version by ID' })
	@Get('pages/:pageId/versions/:vId')
	async fetchVersionById(@Param('vId') vId: ID): Promise<any> {
		return this._pagesService.fetchVersionById(vId);
	}

	/**
	 * POST /pages/:pageId/versions/:vId/restore/
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Restore page version' })
	@Post('pages/:pageId/versions/:vId/restore')
	async restoreVersion(
		@Param('pageId') id: ID,
		@Param('vId') vId: ID
	): Promise<void> {
		return this._pagesService.restoreVersion(id, vId);
	}
}
