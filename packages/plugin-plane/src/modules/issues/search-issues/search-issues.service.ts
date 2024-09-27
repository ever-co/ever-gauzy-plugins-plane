import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IIssue,
	IPagination,
	IParentableIssuesQueruParams,
	ITask,
} from '@plane-plugin/models';
import {
	getTaskQuery,
	parentableIssuesTransformer,
} from '../../../config/serializers/tasks/tasks.response';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';

@Injectable()
export class SearchIssuesService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/tasks';

	async findParentableIssues(
		projectId: ID,
		options: IParentableIssuesQueruParams,
	): Promise<IIssue[]> {
		try {
			const { issue_id, parent, search } = options;

			const query = qs.stringify(getTaskQuery(projectId));

			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query,
				})
			).data;
			let parentableIssues = issues.items;
			if (parent) {
				parentableIssues = parentableIssues.filter(
					(issue) =>
						issue.id !== issue_id &&
						!issue.children?.some((child) => child.id === issue_id),
				);
			}

			if (search) {
				parentableIssues = parentableIssues.filter((issue) =>
					issue.title
						.toLocaleLowerCase()
						.includes(search.toLocaleLowerCase()),
				);
			}

			return parentableIssuesTransformer(parentableIssues);
		} catch (error) {
			console.log(error);
			throw new BadRequestException('Parent could not be found');
		}
	}
}
