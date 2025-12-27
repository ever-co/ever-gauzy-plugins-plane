import { IShareRule } from '@plane-plugin/models';

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
