import { ApiOperation } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ID, IModule } from '@plane-plugin/models';
import { ProjectModuleService } from './project-module.service';
import { CreateModuleDTO } from './dto';

@Controller()
export class ProjectModuleController {
	constructor(private readonly _projectModuleService: ProjectModuleService) {}

	/**
	 * @description - Create module
	 * @param {ICreateModuleInput} payload - data for creating new module
	 * @returns - A promise that resolves after module created
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create module' })
	@Post()
	async createModule(
		@Body() payload: CreateModuleDTO,
	): Promise<IModule | IModule[]> {
		return await this._projectModuleService.create(payload);
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The ID of the project for whom get modules
	 * @returns - A promise that resolves after got modules
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project modules' })
	@Get()
	async getWorkspaceProjectModules(@Param('projectId') projectId: ID) {
		return this._projectModuleService.getAllModulesByProject(projectId);
	}
}
