import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IIntakeIssueCreateInput } from '@plane-plugin/models';
import { IntakeIssuesService } from './intake-issues.service';

@ApiTags('Inbox issues')
@Controller()
export class IntakeIssuesController {
	constructor(private readonly _intakeIssuesService: IntakeIssuesService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Create workspace projects' })
	@Post()
	async create(@Body() input: IIntakeIssueCreateInput) {
		return await this._intakeIssuesService.create(input);
	}

	@Get()
	findAll() {
		return {};
	}
}
