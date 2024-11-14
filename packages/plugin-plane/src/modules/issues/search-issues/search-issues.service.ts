import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IIssue,
	IIssueTagetFilterValueEnum,
	IPagination,
	IParentableIssuesQueryParams,
	ITask,
} from '@plane-plugin/models';
import { getTaskQuery, parentableIssuesTransformer } from '../../../config';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';

@Injectable()
export class SearchIssuesService extends ApiFetchService {
	private readonly path = '/tasks';

	/**
	 * @description Get issues by options
	 * @param {ID} projectId issues find filters
	 * @param {IParentableIssuesQueruParams} options Options finders
	 * @returns A promise that resolves to found issues
	 * @memberof SearchIssuesService
	 */
	async findIssuesByOptions(
		projectId: ID,
		options: IParentableIssuesQueryParams,
	): Promise<IIssue[]> {
		try {
			const {
				issue_id,
				parent,
				sub_issue,
				issue_relation,
				target_date,
				search,
			} = options;

			const query = qs.stringify(getTaskQuery(projectId));

			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query,
				})
			).data;

			const linkedIssuesIds = issues.items.reduce((acc, issue) => {
				// Add all taskFromId of current issue in the accumulator
				if (issue.id === issue_id) {
					issue.linkedIssues?.forEach((linked) => {
						acc.add(linked.taskFromId);
					});
				}
				return acc;
			}, new Set<ID>());

			// Filter issues based on the type ('parentable' or 'childable') and search criteria
			const filteredIssues = issues.items.filter((issue) => {
				// Common conditions (excluding self and matching the search text)
				const isNotSelf = issue.id !== issue_id;
				const matchesSearch =
					!search ||
					issue.title.toLowerCase().includes(search.toLowerCase());

				// If searching for children (`sub_issue`), only include issues with no parent
				if (sub_issue) {
					return (
						isNotSelf && matchesSearch && issue.parentId === null
					);
				}

				// If searching for parent (`parent`), exclude tasks that are already children or the current issue itself
				if (parent) {
					const isNotChild = !issue.children?.some(
						(child) => child.id === issue_id,
					);
					return (
						isNotSelf &&
						matchesSearch &&
						isNotChild &&
						issue.parentId !== issue_id
					);
				}

				// Filter issues that should be in relation with current. Exclude those who are already linked
				if (issue_relation) {
					const isAlreadyLinked = linkedIssuesIds.has(issue.id);
					return isNotSelf && matchesSearch && !isAlreadyLinked;
				}

				// Filter issues with Target date `undefined`. This is used when search to add issues in calendar layout
				if (target_date === IIssueTagetFilterValueEnum.NONE) {
					return !issue.dueDate;
				}

				return false;
			});

			return parentableIssuesTransformer(filteredIssues);
		} catch (error) {
			console.log(error);
			throw new BadRequestException('Parent could not be found');
		}
	}
}
