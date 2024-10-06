import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
} from '@nestjs/common';
import qs from 'qs';
import {
	ICreatedIssueRelation,
	ID,
	IIssueRelationResponse,
	IssueRelationTypeEnum,
	ITaskLinkedIssue,
} from '@plane-plugin/models';
import {
	createdIssueRelationTranformer,
	createIssueRelationInputTranformer,
	defaultOrganizationId,
	getIssueRelationType,
	getTaskRelationQuery,
	issueTransformer,
} from '../../config';
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
	 * @description Create issue relations.
	 * @param {ID} taskToId - Issue ID for whom to create main relations.
	 * @param {ID[]} issues - Linked issue IDs to create inversed relations.
	 * @param {IssueRelationTypeEnum} relation_type - The relation type.
	 * @returns A promise resolved to created and transformed main relations.
	 * @memberof IssueRelationsService
	 */
	async create(
		taskToId: ID,
		issues: ID[],
		relation_type: IssueRelationTypeEnum,
	): Promise<ICreatedIssueRelation[]> {
		try {
			// Prepare relations to create
			const relationsToCreate = issues.map((issue) => ({
				mainRelation: createIssueRelationInputTranformer(
					relation_type,
					taskToId,
					issue,
				),
				inverseRelation: createIssueRelationInputTranformer(
					relation_type === IssueRelationTypeEnum.BLOCKED_BY
						? IssueRelationTypeEnum.BLOCKING
						: relation_type === IssueRelationTypeEnum.BLOCKING
							? IssueRelationTypeEnum.BLOCKED_BY
							: relation_type,
					issue,
					taskToId,
				),
			}));

			// Création des relations en parallèle
			const createdRelations = await Promise.all(
				relationsToCreate.map(
					async ({ mainRelation, inverseRelation }) => {
						// Create the main relation
						const relation: ITaskLinkedIssue = (
							await this.apiFetch({
								method: 'POST',
								path: this.path,
								body: {
									...mainRelation,
									organizationId: defaultOrganizationId,
								},
							})
						).data;

						// Create inversed relation
						await this.apiFetch({
							method: 'POST',
							path: this.path,
							body: {
								...inverseRelation,
								organizationId: defaultOrganizationId,
							},
						});

						// Transform the main relation
						return createdIssueRelationTranformer(relation);
					},
				),
			);

			return createdRelations;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Find one Issue relation includind TaskFrom and TaskTo relations
	 * @param {ID} id - Task Linked Issue ID
	 * @returns A promise resolved to found Task Linked Issue
	 * @memberof IssueRelationsService
	 */
	async findOne(id: ID): Promise<ITaskLinkedIssue> {
		const query = qs.stringify(getTaskRelationQuery());
		return (
			await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}`,
				query,
			})
		).data;
	}

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
