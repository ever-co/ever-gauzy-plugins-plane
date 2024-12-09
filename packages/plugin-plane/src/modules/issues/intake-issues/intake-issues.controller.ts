import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query
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

	/**
	 * Retrieves all intake issues associated with a specific project.
	 *
	 * @param {ID} projectId - The ID of the project to filter the intake issues by.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Inbox issues by project' })
	@Get()
	async findAll(
		@Param('projectId') projectId: ID,
		@Query('status') status: string
	) {
		return await this._intakeIssuesService.findAll(projectId, status);
	}

	/**
	 * Retrieves a single intake issue associated with a given task ID.
	 *
	 * @param {ID} taskId - The ID of the task for which the intake issue is to be retrieved.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Inbox issues by project' })
	@Get(':id')
	async findOneByTaskId(@Param('id') taskId: ID) {
		return await this._intakeIssuesService.findOneByTaskId(taskId);
	}

	/**
	 * Updates an intake issue and its associated issue data.
	 *
	 * @param {ID} issueId - The ID of the intake issue to be updated.
	 * @param {IIntakeIssueCreateInput} input - The updated data for the intake issue, including optional issue details.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Inbox issue' })
	@Patch(':id')
	async update(
		@Body() input: IIntakeIssueCreateInput,
		@Param('id') issueId: ID
	) {
		return await this._intakeIssuesService.update(issueId, input);
	}
}
