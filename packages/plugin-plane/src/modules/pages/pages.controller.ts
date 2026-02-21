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
@Controller('projects/:projectId/pages')
export class PagesController {
	constructor(private readonly _pagesService: PagesService) {}

	/**
	 * GET /workspaces/:workspaceSlug/projects/:projectId/pages/
	 * List all pages for a project.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List pages' })
	@Get()
	async findAll(@Param('projectId') projectId: ID): Promise<IPage[]> {
		return this._pagesService.findAll(projectId);
	}

	/**
	 * POST /workspaces/:workspaceSlug/projects/:projectId/pages/
	 * Create a page.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create page' })
	@Post()
	async create(@Body() input: CreatePageDTO): Promise<IPage> {
		return this._pagesService.create(input);
	}

	/**
	 * GET /workspaces/:workspaceSlug/projects/:projectId/pages/:pageId/
	 * Get a single page.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get page' })
	@Get(':pageId')
	async findOne(@Param('pageId') pageId: ID): Promise<IPage> {
		return this._pagesService.findOne(pageId);
	}

	/**
	 * PATCH /workspaces/:workspaceSlug/projects/:projectId/pages/:pageId/
	 * Update a page.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update page' })
	@Patch(':pageId')
	async update(
		@Param('pageId') pageId: ID,
		@Body() input: UpdatePageDTO
	): Promise<void> {
		return this._pagesService.update(pageId, input);
	}

	/**
	 * DELETE /workspaces/:workspaceSlug/projects/:projectId/pages/:pageId/
	 * Delete a page.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete page' })
	@Delete(':pageId')
	async delete(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.delete(pageId);
	}

	// ─── Actions ─────────────────────────────────────────────────────────────

	/**
	 * POST /pages/:pageId/archive/
	 * Archive a page.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Archive page' })
	@Post(':pageId/archive')
	async archive(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.archive(pageId);
	}

	/**
	 * DELETE /pages/:pageId/archive/
	 * Unarchive a page.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Unarchive page' })
	@Delete(':pageId/archive')
	async unarchive(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.unarchive(pageId);
	}

	/**
	 * POST /pages/:pageId/lock/
	 * Lock a page.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Lock page' })
	@Post(':pageId/lock')
	async lock(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.lock(pageId);
	}

	/**
	 * DELETE /pages/:pageId/lock/
	 * Unlock a page.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Unlock page' })
	@Delete(':pageId/lock')
	async unlock(@Param('pageId') pageId: ID): Promise<void> {
		return this._pagesService.unlock(pageId);
	}

	/**
	 * POST /pages/:pageId/duplicate/
	 * Duplicate a page.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Duplicate page' })
	@Post(':pageId/duplicate')
	async duplicate(@Param('pageId') pageId: ID): Promise<IPage> {
		return this._pagesService.duplicate(pageId);
	}
}
