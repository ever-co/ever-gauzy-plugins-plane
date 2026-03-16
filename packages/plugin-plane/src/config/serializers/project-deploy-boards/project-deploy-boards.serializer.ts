import {
	BaseEntityEnum,
	ID,
	IProjectDeployBoardsCreateInput,
	ISharedEntityCreateInput
} from '@ever-gauzy/plugin-integration-plane-models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { getCurrentOrganizationSlug } from '../../credentials';
import { PROJECT_DEPLOY_BOARDS_SHARE_RULES } from './project-deploy-boards.helper';

/**
 * Get the query for getting shared projects
 * @param projectId - The ID of the project
 * @returns The query for getting shared projects
 */
export function getSharedProjectQuery(projectId: ID): Record<string, any> {
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	query['where[entityId]'] = projectId;
	query['where[entity]'] = BaseEntityEnum.OrganizationProject;

	return query;
}

/**
 * Transform the project deploy boards create input to the shared entity create input
 * @param projectId - The ID of the project
 * @param input - The project deploy boards create input
 * @returns The shared entity create input
 */
export function projectDeployBoardsCreateInputTransformer(
	projectId: ID,
	input: IProjectDeployBoardsCreateInput
): ISharedEntityCreateInput {
	return {
		entity: BaseEntityEnum.OrganizationProject,
		entityId: projectId,
		shareRules: PROJECT_DEPLOY_BOARDS_SHARE_RULES,
		sharedOptions: input,
		organizationId: getCurrentOrganizationSlug()
	};
}
