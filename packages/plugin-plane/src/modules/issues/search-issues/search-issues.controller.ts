import { ApiOperation } from '@nestjs/swagger';
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Query,
} from '@nestjs/common';
import { ID, IParentableIssuesQueruParams } from '@plane-plugin/models';
import { SearchIssuesService } from './search-issues.service';

@Controller()
export class SearchIssuesController {
	constructor(private readonly _searchIssuesService: SearchIssuesService) {}

	/**
	 * @description Get issues by options
	 * @param {ID} projectId issues find filters
	 * @param {IParentableIssuesQueruParams} options Options finders
	 * @returns A promise that resolves to found issues
	 * @memberof SearchIssuesService
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Search issues' })
	@Get()
	async findParentableIssues(
		@Param('projectId') projectId: ID,
		@Query() options: IParentableIssuesQueruParams,
	) {
		return await this._searchIssuesService.findParentableIssues(
			projectId,
			options,
		);
	}
}
