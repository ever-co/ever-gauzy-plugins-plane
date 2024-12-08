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
import { ID, IView } from '@plane-plugin/models';
import { IssueViewService } from './view.service';
import { CreateViewDTO, UpdateViewDTO } from './dto';

@ApiTags('Issue Views')
@Controller()
export class IssueViewController {
	constructor(private readonly _issueViewService: IssueViewService) {}

	/**
	 * @description - Create Issue View
	 * @param {ICreateViewInput} input - Body Request data for creating issue view
	 * @param {ID} [projectId] - Optional Project ID if issue view should belong to a specific project
	 * @returns {(Promise<IView | IView[]>)} A promise resolved to created and transformed Issue View
	 * @memberof IssueViewController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create View' })
	@Post()
	async create(
		@Body() input: CreateViewDTO,
		@Param('projectId') projectId?: ID
	): Promise<IView | IView[]> {
		return await this._issueViewService.create(input, projectId);
	}

	/**
	 * @description - Update Issue view
	 * @param {ID} id - Issue View ID to be updated
	 * @param {IUpdateViewInput} input - Body Request data for updating
	 * @param {ID} [projectId] - Optional Project ID
	 * @returns {(Promise<IView | IView[]>)} - A promise that resolved to updated and transformed Issue view
	 * @memberof IssueViewController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update View' })
	@Patch(':id')
	async update(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID,
		@Body() input: UpdateViewDTO
	): Promise<IView | IView[]> {
		return await this._issueViewService.update(id, input, projectId);
	}

	/**
	 * @description - Find issue views
	 * @param {ID} [projectId] - Optional Project ID for filtering by project
	 * @returns - A promise resolved to found and transformed views
	 * @memberof IssueViewController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Views' })
	@Get()
	async findAll(@Param('projectId') projectId: ID) {
		return this._issueViewService.findAll(projectId);
	}

	/**
	 * @description - Find View By ID
	 * @param {ID} [id] - View ID to find
	 * @returns {(Promise<IView | IView[]>)} A promise resolved to found and tranformed Issue View
	 * @memberof IssueViewController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get View' })
	@Get(':id')
	async findOne(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	): Promise<IView | IView[]> {
		return this._issueViewService.findOne(id, projectId);
	}

	/**
	 * @description Delete View
	 * @param {ID} id - The View ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof IssueViewController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete View' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._issueViewService.delete(id);
	}
}
