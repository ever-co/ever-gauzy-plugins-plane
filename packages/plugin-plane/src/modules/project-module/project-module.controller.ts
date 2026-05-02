import { ApiOperation } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Put
} from '@nestjs/common';
import {
	BaseEntityEnum,
	ICreateIssueLink,
	ID,
	IModule
} from '@ever-gauzy/plugin-integration-plane-models';
import { ProjectModuleService } from './project-module.service';
import { IssueLinksService } from '../issue-links/issue-links.service';
import { getCurrentOrganizationSlug } from '../../config';
import { CreateModuleDTO, UpdateModuleDTO } from './dto';

@Controller()
export class ProjectModuleController {
	constructor(
		private readonly _projectModuleService: ProjectModuleService,
		private readonly _issueLinksService: IssueLinksService
	) {}

	/**
	 * @description - Create module
	 * @param {ICreateModuleInput} input - data for creating new module
	 * @returns - A promise that resolves after module created
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Project Module' })
	@Post()
	async createModule(
		@Body() input: CreateModuleDTO
	): Promise<IModule | IModule[]> {
		return await this._projectModuleService.create(input);
	}

	@Post(':id/issues')
	async addIssuesToModule(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID,
		@Body() input: UpdateModuleDTO
	) {
		return await this._projectModuleService.update(id, projectId, input);
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The ID of the project for whom get modules
	 * @returns - A promise that resolves after got modules
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Project Modules' })
	@Get()
	async getWorkspaceProjectModules(@Param('projectId') projectId: ID) {
		return this._projectModuleService.getAllModulesByProject(projectId);
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The ID of the project for whom get modules
	 * @returns - A promise that resolves after got modules
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Project Podules' })
	@Get(':id')
	async getWorkspaceProjectModule(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	) {
		return this._projectModuleService.getModule(id, projectId);
	}

	/**
	 * @description Get user modules properties
	 * @param {ID} id - Module ID of module for whom get properties
	 * @returns A promise resolved to user properties
	 * @memberof ProjectModuleService
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Project Module User properties' })
	@Get(':id/user-properties')
	async getModuleUserProperties(@Param('id') id: ID) {
		return this._projectModuleService.getModuleUserProperties(id);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Module User properties' })
	@Patch(':id/user-properties')
	async updateModuleUserProperties(@Param('id') id: ID, @Body() input: any) {
		return this._projectModuleService.updateModuleUserProperties(id, input);
	}

	/**
	 * @description Update Project Module
	 * @param {ID} id Project Module ID to be updated
	 * @param {ICreateModuleInput} input Body Request data
	 * @returns A promise resolved to updated Module
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Project Module' })
	@Patch(':id')
	async update(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID,
		@Body() input: UpdateModuleDTO
	) {
		return await this._projectModuleService.update(id, projectId, input);
	}

	/**
	 * @description Delete project module
	 * @param {ID} id - The project module to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete Project Module' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._projectModuleService.delete(id);
	}

	// ───────────── Module Links ─────────────

	/**
	 * @description List all links for a module
	 * @param {ID} id - Module ID
	 * @returns All links attached to the module
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List Module Links' })
	@Get(':id/module-links')
	async listModuleLinks(@Param('id') id: ID) {
		return this._issueLinksService.findAll(
			BaseEntityEnum.OrganizationProjectModule,
			id
		);
	}

	/**
	 * @description Create a link for a module
	 * @param {ID} id - Module ID
	 * @param {ICreateIssueLink} input - Link data (title, url)
	 * @returns The created link
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Module Link' })
	@Post(':id/module-links')
	async createModuleLink(
		@Param('id') id: ID,
		@Body() input: ICreateIssueLink
	) {
		return this._issueLinksService.create(input, id, 'module');
	}

	/**
	 * @description Get a specific module link
	 * @param {ID} id - Module ID
	 * @param {ID} linkId - Link ID
	 * @returns The found link
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Module Link' })
	@Get(':id/module-links/:linkId')
	async getModuleLink(
		@Param('id') id: ID,
		@Param('linkId') linkId: ID
	) {
		return this._issueLinksService.findOne(
			linkId,
			BaseEntityEnum.OrganizationProjectModule,
			id,
			getCurrentOrganizationSlug()
		);
	}

	/**
	 * @description Update a module link
	 * @param {ID} id - Module ID
	 * @param {ID} linkId - Link ID
	 * @param {ICreateIssueLink} input - Updated link data
	 * @returns The updated link
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Module Link' })
	@Put(':id/module-links/:linkId')
	async updateModuleLink(
		@Param('id') id: ID,
		@Param('linkId') linkId: ID,
		@Body() input: ICreateIssueLink
	) {
		return this._issueLinksService.update(
			linkId,
			id,
			getCurrentOrganizationSlug(),
			input,
			BaseEntityEnum.OrganizationProjectModule
		);
	}

	/**
	 * @description Update a module link (partial)
	 * @param {ID} id - Module ID
	 * @param {ID} linkId - Link ID
	 * @param {Partial<ICreateIssueLink>} input - Partial updated link data
	 * @returns The updated link
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Patch Module Link' })
	@Patch(':id/module-links/:linkId')
	async patchModuleLink(
		@Param('id') id: ID,
		@Param('linkId') linkId: ID,
		@Body() input: ICreateIssueLink
	) {
		return this._issueLinksService.update(
			linkId,
			id,
			getCurrentOrganizationSlug(),
			input,
			BaseEntityEnum.OrganizationProjectModule
		);
	}

	/**
	 * @description Delete a module link
	 * @param {ID} linkId - Link ID
	 * @returns Delete result
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete Module Link' })
	@Delete(':id/module-links/:linkId')
	async deleteModuleLink(@Param('linkId') linkId: ID) {
		return this._issueLinksService.delete(linkId);
	}
}
