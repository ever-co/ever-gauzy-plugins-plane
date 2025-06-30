import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';

@ApiTags('Workspace Slug')
@Controller()
export class WorkspaceSlugController {
	constructor() {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Check Workspace Slug' })
	@Get()
	@Public()
	async checkWorkspaceSlug() {
		return { status: true };
	}
}
