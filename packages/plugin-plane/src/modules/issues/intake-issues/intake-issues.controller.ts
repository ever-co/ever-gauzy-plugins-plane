import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ID, IIntakeIssueCreateInput } from '@plane-plugin/models';
import { IntakeIssuesService } from './intake-issues.service';

@ApiTags('Inbox issues')
@Controller()
export class IntakeIssuesController {
	constructor(private readonly _intakeIssuesService: IntakeIssuesService) {}

	/**
	 * Creates a new intake issue by transforming the input and interacting with external services.
	 *
	 * @param {IIntakeIssueCreateInput} input - The input data to create an intake issue.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Create Inbox Issue' })
	@Post()
	async create(
		@Body() input: IIntakeIssueCreateInput,
		@Param('projectId') projectId: ID
	) {
		return await this._intakeIssuesService.create(input, projectId);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Inbox issues by project' })
	@Get()
	async findAll(@Param('projectId') projectId: ID) {
		return await this._intakeIssuesService.finAll(projectId);
	}
}
