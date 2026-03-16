import {
    ID,
    IOrganizationProject,
    IProjectDeployBoardResponse,
    IProjectDeployBoardsCreateInput,
    ISharedEntity,
    IShareRule
} from '@ever-gauzy/plugin-integration-plane-models';

/**
 * Transform the shared entity response to the Plane deploy board format
 * @param sharedEntity - The shared entity from the API
 * @param project - The project details
 * @param workspaceSlug - The workspace slug
 * @param workspaceName - The workspace name
 * @param workspaceId - The workspace ID
 * @returns The formatted project deploy board response
 */
export function transformSharedEntityToDeployBoardResponse(
	sharedEntity: ISharedEntity,
	project: IOrganizationProject,
	workspaceSlug: string,
	workspaceName: string,
	workspaceId: ID
): IProjectDeployBoardResponse {
	const sharedOptions = sharedEntity.sharedOptions as
		| IProjectDeployBoardsCreateInput
		| undefined;

	return {
		id: sharedEntity.id as ID,
		deleted_at: null,
		project_details: {
			id: project.id as ID,
			identifier: project.code || '',
			name: project.name || '',
			cover_image: project.imageUrl,
			cover_image_url: project.imageUrl,
			logo_props: {
				emoji: {
					url: project.icon,
					value: project.icon
				},
				in_use: project.icon ? 'emoji' : 'icon'
			},
			description: project.description
		},
		workspace_detail: {
			id: workspaceId,
			name: workspaceName,
			slug: workspaceSlug,
			logo_url: undefined
		},
		created_at: sharedEntity.createdAt as Date,
		updated_at: sharedEntity.updatedAt as Date,
		entity_identifier: sharedEntity.entityId,
		entity_name: 'project',
		anchor: sharedEntity.token,
		is_comments_enabled: sharedOptions?.is_comments_enabled ?? true,
		is_reactions_enabled: sharedOptions?.is_reactions_enabled ?? true,
		is_votes_enabled: sharedOptions?.is_votes_enabled ?? true,
		is_activity_enabled: sharedOptions?.is_activity_enabled ?? true,
		is_disabled: sharedOptions?.is_disabled ?? false,
		view_props: sharedOptions?.view_props ?? {
			list: true,
			kanban: true,
			calendar: true,
			gantt: true,
			spreadsheet: true
		},
		created_by: sharedEntity.createdByUserId,
		updated_by: sharedEntity.updatedByUserId,
		workspace: workspaceId,
		project: project.id as ID,
		intake: null
	};
}

/**
 * Defines the share rules for a project deploy board.
 * This specifies which fields and relations are publicly accessible when publishing a project.
 */
export const PROJECT_DEPLOY_BOARDS_SHARE_RULES: IShareRule = {
	fields: ['name'], // Only the project name is shared at the root level
	relations: {
		// Tasks with all their properties and sub-relations
		tasks: {
			fields: [
				'title',
				'number',
				'prefix',
				'description',
				'status',
				'priority',
				'size',
				'issueType',
				'startDate',
				'dueDate',
				'resolvedAt',
				'estimate',
				'version'
			],
			relations: {
				// Task status (state)
				taskStatus: {
					fields: [
						'name',
						'value',
						'description',
						'icon',
						'color',
						'order',
						'isTodo',
						'isInProgress',
						'isDone'
					]
				},
				// Task priority
				taskPriority: {
					fields: ['name', 'value', 'description', 'icon', 'color']
				},
				// Task size
				taskSize: {
					fields: ['name', 'value', 'description', 'icon', 'color']
				},
				// Task type
				taskType: {
					fields: ['name', 'value', 'description', 'icon', 'color']
				},
				// Assigned members
				members: {
					fields: ['id'],
					relations: {
						user: {
							fields: [
								'firstName',
								'lastName',
								'imageUrl',
								'email'
							]
						}
					}
				},
				// Linked issues (relations between tasks)
				linkedIssues: {
					fields: ['action', 'taskFromId', 'taskToId'],
					relations: {
						taskTo: {
							fields: ['title', 'number', 'prefix', 'status']
						}
					}
				},
				// Modules
				modules: {
					fields: [
						'name',
						'description',
						'status',
						'startDate',
						'endDate'
					]
				},
				// Sprint
				organizationSprint: {
					fields: ['name', 'goal', 'startDate', 'endDate', 'status']
				},
				// Tags
				tags: {
					fields: ['name', 'color', 'icon', 'description']
				},
				// Sub-tasks (children)
				children: {
					fields: ['title', 'number', 'prefix', 'status', 'priority']
				},
				// Parent task
				parent: {
					fields: ['title', 'number', 'prefix']
				}
			}
		}
	}
};
