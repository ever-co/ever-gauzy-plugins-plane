import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDTO } from './dto/create-workspace.dto';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspacesController {
	constructor(private readonly _workspacesService: WorkspacesService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new workspace' })
	@ApiResponse({
		status: 201,
		description: 'Workspace successfully created',
		type: CreateWorkspaceDTO
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid request'
	})
	async create(@Body() input: CreateWorkspaceDTO) {
		return await this._workspacesService.create(input);
	}
}
