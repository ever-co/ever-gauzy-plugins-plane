import { ApiOperation } from '@nestjs/swagger';
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ID, IView } from '@plane-plugin/models';
import { IssueViewService } from './view.service';
import { CreateViewDTO } from './dto';

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
		@Param('projectId') projectId?: ID,
	): Promise<IView | IView[]> {
		return await this._issueViewService.create(input, projectId);
	}
}
