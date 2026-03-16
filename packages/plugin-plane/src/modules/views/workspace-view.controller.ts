import { ApiOperation } from '@nestjs/swagger';
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
import { ID, IView } from '@ever-gauzy/plugin-integration-plane-models';
import { IssueViewService } from './view.service';
import { CreateViewDTO, UpdateViewDTO } from './dto';

@Controller()
export class WorkspaceIssueViewController {
	constructor(private readonly _issueViewService: IssueViewService) {}

	/**
	 * @description - Create Issue View
	 * @param {ICreateViewInput} input - Body Request data for creating issue view
	 * @returns {(Promise<IView | IView[]>)} A promise resolved to created and transformed Issue View
	 * @memberof WorkspaceIssueViewController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create View' })
	@Post()
	async create(@Body() input: CreateViewDTO): Promise<IView | IView[]> {
		return await this._issueViewService.create(input);
	}

	/**
	 * @description - Update Issue view
	 * @param {ID} id - Issue View ID to be updated
	 * @param {IUpdateViewInput} input - Body Request data for updating
	 * @returns {(Promise<IView | IView[]>)} - A promise that resolved to updated and transformed Issue view
	 * @memberof WorkspaceIssueViewController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update View' })
	@Patch(':id')
	async update(
		@Param('id') id: ID,
		@Body() input: UpdateViewDTO
	): Promise<IView | IView[]> {
		return await this._issueViewService.update(id, input);
	}

	/**
	 * @description - Find issue views
	 * @returns - A promise resolved to found and transformed views
	 * @memberof WorkspaceIssueViewController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Views' })
	@Get()
	async findAll() {
		return this._issueViewService.findAll();
	}

	/**
	 * @description - Find View By ID
	 * @param {ID} [id] - View ID to find
	 * @returns {(Promise<IView | IView[]>)} A promise resolved to found and tranformed Issue View
	 * @memberof WorkspaceIssueViewController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get View' })
	@Get(':id')
	async findOne(@Param('id') id: ID): Promise<IView | IView[]> {
		return this._issueViewService.findOne(id);
	}

	/**
	 * @description Delete View
	 * @param {ID} id - The View ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof WorkspaceIssueViewController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete View' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._issueViewService.delete(id);
	}
}
