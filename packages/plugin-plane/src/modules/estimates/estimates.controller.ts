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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
	ID,
	IEstimateCreateInput,
	IEstimatePointInput
} from '@ever-gauzy/plugin-integration-plane-models';
import { EstimatesService } from './estimates.service';

/**
 * ever-gauzy fork: `/projects/:projectId/estimates` — a project's estimate is its Ever Gauzy task sizes.
 */
@ApiTags('Estimates routes')
@Controller()
export class EstimatesController {
	constructor(private readonly _estimatesService: EstimatesService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Get the project's estimates (its task sizes)" })
	@Get()
	async getProjectEstimates(@Param('projectId') projectId: ID) {
		return await this._estimatesService.getProjectEstimates(projectId);
	}

	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Create an estimate: add its points as project task sizes'
	})
	@Post()
	async createEstimate(
		@Param('projectId') projectId: ID,
		@Body() input: IEstimateCreateInput
	) {
		return await this._estimatesService.createEstimate(projectId, input);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get an estimate' })
	@Get(':estimateId')
	async getEstimate(
		@Param('projectId') projectId: ID,
		@Param('estimateId') estimateId: ID
	) {
		return await this._estimatesService.getEstimate(projectId, estimateId);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Delete an estimate (refused: task sizes always exist)'
	})
	@Delete(':estimateId')
	async deleteEstimate(
		@Param('projectId') projectId: ID,
		@Param('estimateId') estimateId: ID
	) {
		return await this._estimatesService.deleteEstimate(
			projectId,
			estimateId
		);
	}

	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Add an estimate point (a project task size)' })
	@Post(':estimateId/estimate-points')
	async createEstimatePoint(
		@Param('projectId') projectId: ID,
		@Param('estimateId') estimateId: ID,
		@Body() input: IEstimatePointInput
	) {
		return await this._estimatesService.createEstimatePoint(
			projectId,
			estimateId,
			input
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Rename an estimate point (a project task size)' })
	@Patch(':estimateId/estimate-points/:pointId')
	async updateEstimatePoint(
		@Param('projectId') projectId: ID,
		@Param('estimateId') estimateId: ID,
		@Param('pointId') pointId: ID,
		@Body() input: IEstimatePointInput
	) {
		return await this._estimatesService.updateEstimatePoint(
			projectId,
			estimateId,
			pointId,
			input
		);
	}
}
