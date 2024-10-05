import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
} from '@nestjs/common';
import { ID, IIssueRelationResponse } from '@plane-plugin/models';
import { getIssueRelationType, issueTransformer } from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { IssuesService } from '../issues/issues.service';

@Injectable()
export class IssueRelationsService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => IssuesService))
		private readonly _issueService: IssuesService,
		private readonly _serverFetchService: ApiFetchService,
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/task-linked-issue';

	/**
	 * @description Find issue relation (Issues associates)
	 * @param {ID} issueId - Issue ID
	 * @returns A promise resolved to fetched and transformed issue relations
	 * @memberof IssueRelationsService
	 */
	async findRelationsByIssueId(issueId: ID): Promise<IIssueRelationResponse> {
		try {
			const relatedIssues: IIssueRelationResponse = {
				blocked_by: [],
				blocking: [],
				duplicate: [],
				relates_to: [],
			};
			const issue = await this._issueService.getExternalIssue(issueId);
			if (!issue) {
				throw new BadRequestException('Issue could not be found');
			}
			const linkedIssues = issue.linkedIssues;

			linkedIssues.forEach((linkedIssue) => {
				const relation_type = getIssueRelationType(linkedIssue.action);
				if (relation_type) {
					if (linkedIssue.taskFrom) {
						relatedIssues[relation_type].push(
							issueTransformer(linkedIssue.taskFrom),
						);
					}
				}
			});

			return relatedIssues;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
