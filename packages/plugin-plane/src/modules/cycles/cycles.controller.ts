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
import {
	ICycle,
	ICycleAnalytics,
	ICycleIssuesResponse,
	ICycleProgress,
	ID
} from '@plane-plugin/models';
import { CyclesService } from './cycles.service';
import { CreateCycleDTO, CycleDTO, UpdateCycleDTO } from './dto';

@ApiTags('Cycles')
@Controller()
export class CyclesController {
	constructor(private readonly _cycleService: CyclesService) {}

	/**
	 * Creates a new cycle (sprint) based on the provided input.
	 *
	 * @param {CreateCycleDTO} input - The data transfer object containing the cycle details to create.
	 * @returns {Promise<ICycle | ICycle[]>} - The newly created cycle or a list of cycles after the creation.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Cycle' })
	@Post()
	async create(@Body() input: CreateCycleDTO): Promise<ICycle | ICycle[]> {
		return await this._cycleService.create(input);
	}

	/**
	 * Checks for overlaps with existing cycles before creating a new cycle.
	 *
	 * @param input The start and end dates for the new cycle to be created.
	 * @returns The status and optional error according to overlaps existing
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Check Data Overlaps' })
	@Post('/date-check')
	async checkDatesOverlap(
		@Body() input: Pick<CycleDTO, 'start_date' | 'end_date'>
	) {
		return await this._cycleService.checkDatesOverlap(input);
	}

	/**
	 * Adds a list of issues to a sprint by updating each issue with the given cycle ID.
	 *
	 * @param {ID} id - The ID of the sprint (cycle) to which the issues will be added.
	 * @param {ID[]} input - An array of issue IDs that need to be associated with the sprint.
	 * @returns {Promise<{ message: string }>} A success message upon completion.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Add Issue to Cycle' })
	@Post('/:id/cycle-issues')
	async addIssuesToSprint(
		@Param('id') id: ID,
		@Body() input: { issues: ID[] }
	): Promise<{ message: string }> {
		return await this._cycleService.addIssuesToSprint(id, input);
	}

	/**
	 * Removes an issue from a sprint by updating the issue with the given cycle ID to null.
	 *
	 * @param {ID} issueId - The ID of the issue to be removed from the sprint.
	 * @returns A promise that resolves to the updated issue.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Remove Issue from Cycle' })
	@Delete('/:id/cycle-issues/:issueId')
	async removeIssueFromSprint(@Param('issueId') issueId: ID) {
		return await this._cycleService.removeIssueFromSprint(issueId);
	}

	/**
	 * Updates an existing cycle (sprint) based on the provided ID and input data.
	 *
	 * @param {ID} id - The unique identifier of the cycle to update.
	 * @param {UpdateCycleDTO} input - The data transfer object containing the updated cycle details.
	 * @returns {Promise<ICycle | ICycle[]>} - The updated cycle or a list of updated cycles after the update.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Cycle' })
	@Patch(':id')
	async update(
		@Param('id') id: ID,
		@Body() input: UpdateCycleDTO
	): Promise<ICycle | ICycle[]> {
		return await this._cycleService.update(id, input);
	}

	/**
	 * Retrieves all cycles (sprints) for a given project.
	 *
	 * @param {ID} projectId - The unique identifier of the project to filter cycles.
	 * @returns {Promise<ICycle | ICycle[]>} - A promise that resolves to a list of cycles for the specified project.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Cycles' })
	@Get()
	async findAll(
		@Param('projectId') projectId: ID
	): Promise<ICycle | ICycle[]> {
		return this._cycleService.findAll(projectId);
	}

	/**
	 * Retrieves a specific cycle (sprint) by its ID and optionally filters by project ID.
	 *
	 * @param {ID} id - The unique identifier of the cycle to retrieve.
	 * @param {ID} projectId - (Optional) The unique identifier of the project to filter the cycle.
	 * @returns {Promise<ICycle | ICycle[]>} - A promise that resolves to the requested cycle or a list of cycles.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Cycle' })
	@Get(':id')
	async findOne(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	): Promise<ICycle | ICycle[]> {
		return this._cycleService.findOne(id, projectId);
	}

	/**
	 * Retrieves all tasks that were ever part of a sprint
	 *
	 * @param {ID} id - The ID of the sprint (cycle).
	 * @param {ID} projectId - The ID of the project to which the sprint belongs.
	 * @returns {Promise<ICycleIssuesResponse>} - A transformed response containing all unique sprint issues.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Cycle Issues' })
	@Get(':id/cycle-issues')
	async findCycleIssues(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	): Promise<ICycleIssuesResponse> {
		return this._cycleService.findCycleIssues(id, projectId);
	}

	/**
	 * Retrieves analytics data for a specific cycle within a project.
	 *
	 * This function fetches the cycle/sprint data along with its associated tasks and task histories.
	 * It analyzes tasks to provide statistics about task completion, assignments, and labels.
	 *
	 * @param {ID} id - The ID of the cycle to analyze
	 * @param {ID} projectId - The ID of the project containing the cycle
	 * @returns {Promise<any>} A promise that resolves to the cycle analytics data.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Cycle Issues' })
	@Get(':id/analytics')
	async findCycleAnalytics(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	): Promise<ICycleAnalytics> {
		return this._cycleService.findCycleAnalytics(id, projectId);
	}

	/**
	 * Retrieves the progress of a specific cycle within a project, including task counts
	 * and estimation points for various statuses (e.g., backlog, started, completed).
	 *
	 * @param {ID} id - The unique identifier of the cycle to retrieve progress for.
	 * @param {ID} projectId - The unique identifier of the project the cycle belongs to.
	 * @returns {Promise<ICycleProgress>} - A promise that resolves to an object containing
	 *   detailed cycle progress, including task counts and estimation points.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Cycle Issues' })
	@Get(':id/progress')
	async getCycleProgress(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	): Promise<ICycleProgress> {
		return this._cycleService.getCycleProgress(id, projectId);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Cycle User properties' })
	@Get(':id/user-properties')
	async findCycleUserProperties(@Param('id') id: ID): Promise<any> {
		return this._cycleService.findCycleUserProperties(id);
	}

	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Update Cycle User properties' })
	@Patch(':id/user-properties')
	async updateModuleUserProperties(@Param('id') id: ID, @Body() input: any) {
		return this._cycleService.updateCycleUserProperties(id, input);
	}

	/** Deletes a specific cycle (sprint) by its ID.
	 *
	 * @param {ID} id - The unique identifier of the cycle to delete.
	 * @returns - A promise that resolves when the cycle is successfully deleted.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete Cycle' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._cycleService.delete(id);
	}
}
