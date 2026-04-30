import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	IIssue,
	ITask,
	ReactionEntityEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	getTaskByIdentifierQuery,
	issueTransformer
} from '../../config/serializers/tasks/tasks.serializer';
import { currentUserId } from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { IssuesService } from '../issues/issues.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class WorkItemsService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => IssuesService))
		private readonly _issueService: IssuesService,
		private readonly _subscriptionService: SubscriptionService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	/**
	 * Browse work item by identifier (e.g. "NELLY-7")
	 *
	 * Resolves a human-readable identifier to a full issue with expanded data
	 * matching the Plane Django `IssueDetailIdentifierEndpoint` response shape:
	 * - issue_reactions
	 * - issue_link
	 * - issue_attachment (count)
	 * - parent
	 * - is_subscribed
	 *
	 * @param {string} identifier - The identifier of the work item (e.g. "NELLY-7")
	 * @param {string} [expand] - Optional comma-separated expand fields
	 * @returns {Promise<IIssue>} A promise that resolves to the work item
	 * @throws {BadRequestException} If the identifier format is invalid or issue not found
	 */
	async browseWorkItemByIdentifier(
		identifier: string,
		expand?: string
	): Promise<IIssue> {
		try {
			// Validate identifier format (e.g. "NELLY-7")
			const parts = identifier.split('-');
			if (parts.length < 2 || !parts[parts.length - 1].match(/^\d+$/)) {
				throw new BadRequestException('Invalid issue identifier');
			}

			// Build query to find the task by project code + sequence number
			const relations = [
				'tags',
				'members.user',
				'createdByUser',
				'project.members.employee.user.role',
				'organizationSprint',
				'modules',
				'parent'
			];
			const query = qs.stringify(
				getTaskByIdentifierQuery(identifier, relations)
			);

			const response = await this.apiFetch({
				method: 'GET',
				path: `/tasks`,
				query
			});

			const tasks = response.data?.items;

			if (!tasks || tasks.length === 0) {
				throw new BadRequestException(
					'The required object does not exist.'
				);
			}

			const task: ITask = tasks[0];

			// Fetch expanded data in parallel
			const [reactions, links, subscriptions] = await Promise.all([
				// Issue reactions
				this._issueService.findIssueReactions(
					{
						entityId: task.id!,
						entity: ReactionEntityEnum.Task
					},
					task.projectId!,
					false
				),
				// Issue links
				this._issueService.findIssueLinks(
					task.id!,
					task.projectId!,
					task
				),
				// Subscription check
				this._subscriptionService.findAll({
					entity: BaseEntityEnum.Task,
					entityId: task.id,
					userId: currentUserId() ?? undefined
				})
			]);

			const isSubscribed = subscriptions && subscriptions.length > 0;

			return issueTransformer(task, reactions, links, isSubscribed);
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}
}
