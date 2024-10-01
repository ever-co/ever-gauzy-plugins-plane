import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IIssue,
	IPagination,
	IParentableIssuesQueryParams,
	ITask,
} from '@plane-plugin/models';
import { getTaskQuery, parentableIssuesTransformer } from '../../../config';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';

@Injectable()
export class SearchIssuesService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/tasks';

	/**
	 * @description Get issues by options
	 * @param {ID} projectId issues find filters
	 * @param {IParentableIssuesQueruParams} options Options finders
	 * @returns A promise that resolves to found issues
	 * @memberof SearchIssuesService
	 */
	async findParentableIssues(
		projectId: ID,
		options: IParentableIssuesQueryParams,
	): Promise<IIssue[]> {
		try {
			const { issue_id, parent, sub_issue, search } = options;

			const query = qs.stringify(getTaskQuery(projectId));

			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query,
				})
			).data;

			// Filter issues based on the type ('parentable' or 'childable') and search criteria
			const filteredIssues = issues.items.filter((issue) => {
				// Common conditions (excluding self and matching the search text)
				const isNotSelf = issue.id !== issue_id;
				const matchesSearch =
					!search ||
					issue.title.toLowerCase().includes(search.toLowerCase());

				// Check exclusion of the current issue and relationship conflicts
				const isNotConflicting =
					!issue.children?.some((child) => child.id === issue_id) &&
					issue.parentId !== issue_id;

				// If `parent` or `sub_issue` is specified, ensure the criteria match
				return (
					isNotSelf &&
					matchesSearch &&
					isNotConflicting &&
					(parent || sub_issue)
				);
			});

			return parentableIssuesTransformer(filteredIssues);
		} catch (error) {
			console.log(error);
			throw new BadRequestException('Parent could not be found');
		}
	}
}
