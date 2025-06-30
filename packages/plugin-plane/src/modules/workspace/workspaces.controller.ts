import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspacesController {
	constructor(private readonly _workspacesService: WorkspacesService) {}

	@Post()
	async createWorkspapce() {}
}
