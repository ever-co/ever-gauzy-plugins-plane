import {
	ICreateProjectInput,
	ID,
	IOrganizationProject,
	IOrganizationProjectCreateInput,
	IProject,
	IProjectMember,
	IUpdateProjectInput,
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import {
	defaultEmployeeId,
	defaultOrganizationId,
	defaultTestTenantId,
} from '../../credentials';
import { roleTransformer } from '../workspace-organization';

export function getProjectsResponse(
	projects: IOrganizationProject[],
	favoriteIds?: ID[],
): Partial<IProject>[] {
	return projects?.map((project) => {
		// Safely handle the presence of `project.members` by using a fallback to an empty array.
		const members = Array.isArray(project?.members)
			? project.members.map((member) => ({
					id: member.employee.user.id,
					member_id: member.employeeId,
					member__display_name:
						member.employee.user.fullName ||
						member.employee.fullName ||
						`${member.employee.user.firstName} ${member.employee.user.lastName}`,
					member__avatar: member.employee.user.imageUrl,
					role: roleTransformer(member.employee.user.role),
				}))
			: []; // If `project.members` is undefined, set `members` to an empty array

		const isFavorite = favoriteIds?.includes(project.id);

		// Ensure safe access to `project.members` to find the first manager
		const manager = Array.isArray(project.members)
			? project.members.find((member) => member.isManager)
			: null;

		return {
			id: project.id,
			is_favorite: isFavorite, // To be implemented after Auth,
			total_members: project.membersCount,
			total_cycles: project.organizationSprints?.length || 0,
			total_issues: project.tasks?.length || 0,
			total_modules: project.modules?.length || 0,
			is_member: true, // Research and know what it is exactly
			sort_order: 66373.5, // Research and know what it is exactly
			member_role: 20, // Seems it should be a project creator/owner/etc. role associated to that user.
			anchor: null, // Research and know what it is exactly
			members,
			state_id: null, // Research and know what it is exactly,
			priority: null, // To add for external API
			start_date: project.startDate,
			target_date: project.endDate,
			created_at: project.createdAt,
			updated_at: project.updatedAt,
			deleted_at: project.deletedAt,
			name: project.name,
			description: project.description,
			description_text: null, // To add for external API
			description_html: null, // To add for external API
			network: project.public ? 2 : 0,
			identifier: project.code || project.name?.slice(0, 4).toUpperCase(),
			emoji: null, // To add for external API
			icon_prop: null, // To add for external API
			module_view: true, // To add for external API
			cycle_view: true, // To add for external API
			issue_views_view: true, // To add for external API
			page_view: true, // To add for external API
			inbox_view: false, // To add for external API
			is_time_tracking_enabled: false, // To add for external API
			is_issue_type_enabled: false, // To add for external API
			cover_image: project.imageUrl,
			archive_in: project.archiveTasksIn,
			close_in: project.closeTasksIn,
			logo_props: {
				emoji: {
					value: '127891',
				},
				in_use: 'emoji',
			},
			archived_at: project.archivedAt,
			created_by: defaultEmployeeId(), // To add for external API
			updated_by: defaultEmployeeId(), // To add for external API
			workspace: project.tenantId,
			default_assignee: project.defaultAssigneeId,
			project_lead: manager ? manager.employeeId : null, // Use the first manager's ID if found, else null
			estimate: null, // To add for external API
			default_state: null, // To add for external API
		};
	});
}

export function createProjectInputTransformer(
	input: ICreateProjectInput | IUpdateProjectInput,
): IOrganizationProjectCreateInput {
	let memberIds = [];
	let managerIds = [];

	if (input.members) {
		memberIds = input.members.map((member) => ({
			employeeId: member.member_id,
		}));
	}

	if (input.project_lead) {
		managerIds = [input.project_lead];
	}

	return {
		name: input.name,
		code: input.identifier,
		description: input.description,
		startDate: input.start_date,
		endDate: input.target_date,
		imageUrl: input.cover_image,
		public: input.network === 0 ? false : true,
		defaultAssigneeId: input.default_assignee,
		memberIds,
		managerIds,
		tenantId: defaultTestTenantId(),
		organizationId: defaultOrganizationId(),
	};
}

export function assignMembersToProjectTransformer(
	projectMembers: IProjectMember[],
): ID[] {
	const memberIds = projectMembers.map((member) => member.member_id);
	return memberIds;
}

export const projectRelations = [
	'organization',
	'members',
	'members.employee.user.role',
	'tasks.members',
	'modules',
	'tags',
	'teams',
	'tenant',
	'statuses',
	'modules',
	'organizationSprints',
];

/**
 * Helper function to build query object
 */
export const getProjectsQuery = (
	relations?: string[],
): Record<string, string> => {
	const baseQuery = {
		...baseGetItemsWhereQuery(),
	};

	// Add relations to the baseQuery
	if (relations) {
		relations.forEach((relation, i) => {
			baseQuery[`relations[${i}]`] = relation;
		});
	} else {
		projectRelations.forEach((relation, i) => {
			baseQuery[`relations[${i}]`] = relation;
		});
	}

	return baseQuery;
};

export const findEmployeeProjectsQuery = (
	relations?: string[],
): Record<string, string> => {
	const query = {
		organizationId: defaultOrganizationId(),
		tenantId: defaultTestTenantId(),
	};

	// Add relations to the baseQuery
	relations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
};

/**
 * Get query with identifier for a project
 */
export const getProjectByIdentifiersQuery = (
	identifier: string,
): Record<string, string> => ({
	...getProjectsQuery(),
	'where[code]': identifier,
});
