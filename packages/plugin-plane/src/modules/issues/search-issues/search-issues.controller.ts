import { ApiOperation } from '@nestjs/swagger';
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Query,
} from '@nestjs/common';
import { ID, IParentableIssuesQueryParams } from '@plane-plugin/models';
import { SearchIssuesService } from './search-issues.service';

@Controller()
export class SearchIssuesController {
	constructor(private readonly _searchIssuesService: SearchIssuesService) {}

	/**
	 * @description Get issues by options
	 * @param {ID} projectId issues find filters
	 * @param {IParentableIssuesQueryParams} options Options finders
	 * @returns A promise that resolves to found issues
	 * @memberof SearchIssuesService
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Search issues' })
	@Get()
	async findIssuesByOptions(
		@Param('projectId') projectId: ID,
		@Query() options: IParentableIssuesQueryParams,
	) {
		return await this._searchIssuesService.findIssuesByOptions(
			projectId,
			options,
		);
	}
}
