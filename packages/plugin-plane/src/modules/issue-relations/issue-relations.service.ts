import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable
} from '@nestjs/common';
import qs from 'qs';
import {
	ICreatedIssueRelation,
	ID,
	IDeleteRelationInput,
	IIssueRelationResponse,
	IPagination,
	IssueRelationTypeEnum,
	ITaskLinkedIssue
} from '@plane-plugin/models';
import {
	createdIssueRelationTranformer,
	createIssueRelationInputTranformer,
	defaultOrganizationId,
	findByOptionsQuery,
	getIssueRelationType,
	getTaskRelatedIssueRelation,
	getTaskRelationQuery,
	issueTransformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { IssuesService } from '../issues/issues.service';

@Injectable()
export class IssueRelationsService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => IssuesService))
		private readonly _issueService: IssuesService,
		private readonly _serverFetchService: ApiFetchService
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
		relation_type: IssueRelationTypeEnum
	): Promise<ICreatedIssueRelation[]> {
		try {
			// Prepare relations to create
			const relationsToCreate = issues.map((issue) => ({
				mainRelation: createIssueRelationInputTranformer(
					relation_type,
					taskToId,
					issue
				),
				inverseRelation: createIssueRelationInputTranformer(
					relation_type === IssueRelationTypeEnum.BLOCKED_BY
						? IssueRelationTypeEnum.BLOCKING
						: relation_type === IssueRelationTypeEnum.BLOCKING
							? IssueRelationTypeEnum.BLOCKED_BY
							: relation_type,
					issue,
					taskToId
				)
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
									organizationId: defaultOrganizationId()
								}
							})
						).data;

						const issueTo =
							await this._issueService.getExternalIssue(
								relation.taskFromId
							);

						// Create inversed relation
						await this.apiFetch({
							method: 'POST',
							path: this.path,
							body: {
								...inverseRelation,
								organizationId: defaultOrganizationId()
							}
						});

						// Transform the main relation
						return createdIssueRelationTranformer(
							relation,
							issueTo
						);
					}
				)
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
				query
			})
		).data;
	}

	/**
	 * Fetches all task linked issues related to a specific issue ID, with an option to include soft-deleted entries.
	 *
	 * @param {ID} issueId - The ID of the issue for which to retrieve linked tasks.
	 * @param {boolean} [withDeleted] - Optional parameter to include soft-deleted task linked issues in the result. Default is false.
	 * @returns {Promise<ITaskLinkedIssue[]>} - A promise that resolves to an array of task linked issues associated with the given issue ID.
	 * @throws {BadRequestException} - Throws an error if the request fails or an issue occurs during the fetch.
	 */
	async findAllByIssueId(
		issueId: ID,
		withDeleted?: boolean
	): Promise<ITaskLinkedIssue[]> {
		try {
			const query = qs.stringify(
				findByOptionsQuery({ taskToId: issueId }, withDeleted)
			);

			const issueRelations: IPagination<ITaskLinkedIssue> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query: query
				})
			).data;

			return issueRelations.items;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
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
				relates_to: []
			};
			const issue = await this._issueService.getExternalIssue(issueId, [
				'linkedIssues.taskFrom'
			]);
			if (!issue) {
				throw new BadRequestException('Issue could not be found');
			}
			const linkedIssues = issue.linkedIssues;

			linkedIssues
				.filter(
					(relatedIssue) => !relatedIssue.taskFrom.isScreeningTask
				)
				.forEach((linkedIssue) => {
					const relation_type = getIssueRelationType(
						linkedIssue.action
					);
					if (relation_type) {
						if (linkedIssue.taskFrom) {
							relatedIssues[relation_type].push(
								issueTransformer(linkedIssue.taskFrom)
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

	/**
	 * @description Delete main and inverse relations
	 * @param {ID} id - Main Issue ID for delete the main relation
	 * @param {IDeleteRelationInput} input - Body Request data for related issue and relation type
	 * @returns - Delete Result
	 * @memberof IssueRelationsService
	 */
	async delete(id: ID, input: IDeleteRelationInput): Promise<any> {
		try {
			const { related_issue, relation_type } = input;

			// Determine the inverse relation type
			const inverseRelationType =
				relation_type === IssueRelationTypeEnum.BLOCKED_BY
					? IssueRelationTypeEnum.BLOCKING
					: relation_type === IssueRelationTypeEnum.BLOCKING
						? IssueRelationTypeEnum.BLOCKED_BY
						: relation_type;

			// Build queries to fetch main and inverse relations
			const mainQuery = qs.stringify(
				findByOptionsQuery({
					taskToId: id,
					taskFromId: related_issue,
					action: getTaskRelatedIssueRelation(relation_type)
				})
			);

			const inverseQuery = qs.stringify(
				findByOptionsQuery({
					taskToId: related_issue,
					taskFromId: id,
					action: getTaskRelatedIssueRelation(inverseRelationType)
				})
			);

			// Fetch both relations in parallel
			const [mainRelation, inverseRelation] = await Promise.all([
				this.apiFetch({
					method: 'GET',
					path: `${this.path}/pagination`,
					query: mainQuery
				}),
				this.apiFetch({
					method: 'GET',
					path: `${this.path}/pagination`,
					query: inverseQuery
				})
			]);

			// Get the main and inverse relation objects
			const mainRelationToDelete = (
				mainRelation.data as IPagination<ITaskLinkedIssue>
			).items[0];
			const inverseRelationToDelete = (
				inverseRelation.data as IPagination<ITaskLinkedIssue>
			).items[0];

			// If one of the relations is not found, abort the deletion process
			if (!mainRelationToDelete || !inverseRelationToDelete) {
				throw new Error('Relations to delete were not found.');
			}

			// Delete the main relation
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${mainRelationToDelete.id}/soft`
			});

			try {
				// Attempt to delete the inverse relation
				await this.apiFetch({
					method: 'DELETE',
					path: `${this.path}/${inverseRelationToDelete.id}/soft`
				});
			} catch (inverseError) {
				console.error(
					'Failed to delete the inverse relation. Attempting to restore the main relation.'
				);

				// Rollback: recreate the main relation if the inverse deletion fails
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body: {
						taskToId: mainRelationToDelete.taskToId,
						taskFromId: mainRelationToDelete.taskFromId,
						action: mainRelationToDelete.action,
						organizationId: defaultOrganizationId()
					}
				});

				// Throw an error after rollback to indicate the process was incomplete
				throw new BadRequestException(
					'Failed to delete the inverse relation. Rollback performed for the main relation.'
				);
			}

			return { success: true };
		} catch (error) {
			console.error('Failed to delete relations:', error);
			throw new BadRequestException('One or more deletions failed.');
		}
	}
}
