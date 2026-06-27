import {
	BaseEntityEnum,
	ICreateIssueLink,
	ID,
	IEmployee,
	IIssueLink,
	IOrganizationProject,
	IResourceLink,
	IResourceLinkCreateInput,
	IResourceLinkUpdateInput
} from '@ever-gauzy/plugin-integration-plane-models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { actorDetailsTransformer } from '../user';

/**
 * @description Transform external Resource Link(s) to internal use accepted data
 * @param {(IResourceLink[] | IResourceLink)} links - Link(s) from external API
 * @param {IEmployee} actor - The Employee Picked from User Link Creator
 * @param {IOrganizationProject} project - The project that associated to issue link
 * @returns {(IIssueLink[] | IIssueLink)} A tranformed object or array of objects
 */
export function issueLinkTransformer(
	links: IResourceLink[] | IResourceLink,
	actor?: IEmployee,
	project?: IOrganizationProject
): IIssueLink[] | IIssueLink {
	const transformIssueLink = (link: IResourceLink): IIssueLink => {
		return {
			id: link?.id,
			issue: link?.entity,
			issue_id: link?.entityId,
			created_by_detail: actorDetailsTransformer(actor!),
			created_at: link?.createdAt,
			updated_at: link?.updatedAt,
			deleted_at: link?.deletedAt,
			title: link?.title,
			url: link?.url,
			metadata: link?.metaData as any,
			created_by: link?.employeeId,
			created_by_id: link?.employeeId,
			updated_by: link?.employeeId,
			project: project?.id,
			workspace: link?.organizationId,
			owner: link?.employeeId
		};
	};

	if (Array.isArray(links)) {
		return links.map(transformIssueLink);
	}

	return transformIssueLink(links);
}

/**
 * @description Tranform incoming request body to accepted data for external API
 * @param {ICreateIssueLink} input - Body Request Data
 * @param {ID} issueId - Isuue ID for whom to create link
 * @returns {IResourceLinkCreateInput} Transformed data
 */
export function createIssueLinkInputTransformer(
	input: ICreateIssueLink,
	issueId: ID,
	type: string = 'issue'
): IResourceLinkCreateInput {
	const entityMap: Record<string, BaseEntityEnum> = {
		issue: BaseEntityEnum.Task,
		module: BaseEntityEnum.OrganizationProjectModule
	};
	return {
		entity: entityMap[type] ?? BaseEntityEnum.Organization,
		entityId: issueId,
		title: input.title,
		url: input.url
	};
}

/**
 * @description Transform incoming update body request data to match accepted external API data
 * @param {ICreateIssueLink} input - Bidy Request data
 * @returns {IResourceLinkUpdateInput} A Tranformed object
 */
export function updateIssueLinkInputTransformer(
	input: ICreateIssueLink
): IResourceLinkUpdateInput {
	return input;
}

/**
 * @description Get issue links query params
 * @param {ID} issueId - The Issue ID
 * @returns {Record<string, string>} A object with filter options
 */
export function getIssueLinksQuery(
	type: BaseEntityEnum,
	issueId?: ID,
	organizationId?: ID
): Record<string, string> {
	// Tenant and Organization based query
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery()
	};

	if (issueId) {
		query['where[entityId]'] = issueId;
	}

	if (organizationId) {
		query['where[entityId]'] = organizationId;
	}

	if (type === BaseEntityEnum.Task) {
		query['where[entity]'] = BaseEntityEnum.Task;
	}

	if (type === BaseEntityEnum.Organization) {
		query['where[entity]'] = BaseEntityEnum.Organization;
	}

	return query;
}
