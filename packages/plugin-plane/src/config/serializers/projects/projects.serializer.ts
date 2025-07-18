import {
	ICreateProjectInput,
	ID,
	IOrganizationProject,
	IOrganizationProjectCreateInput,
	IProject,
	IProjectMember,
	IUpdateProjectInput
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import {
	currentEmployeeId,
	currentTenantId,
	getCurrentOrganizationSlug
} from '../../credentials';
import { isNotEmpty } from '../../utils';

type MemberInput = IProjectMember | ID;

interface MemberId {
	employeeId: ID;
}

export function extractMemberIds(members?: MemberInput[]): MemberId[] {
	if (!members || members.length === 0) return [];

	return members.map((member): MemberId => {
		const employeeId =
			typeof member === 'string' ? member : member.member_id;
		return { employeeId };
	});
}

export function getProjectsResponse(
	projects: IOrganizationProject[],
	favoriteIds?: ID[],
	memberReturnType: 'ids' | 'objects' = 'ids'
): Partial<IProject>[] {
	return projects?.map((project) => {
		// Retrieve current member
		const employeeId = currentEmployeeId();
		const currentMember = (project?.members ?? []).find(
			(member) => member.employeeId === employeeId
		);

		let members: any[] = [];

		if (memberReturnType === 'objects') {
			members = Array.isArray(project?.members)
				? project.members.map((member) => ({
						member__display_name: member.employee.fullName,
						member__id: member.employeeId,
						member__avatar_url: member.employee.user.imageUrl
					}))
				: [];
		} else {
			// Safely handle the presence of `project.members` by using a fallback to an empty array.
			members = Array.isArray(project?.members)
				? project.members.map((member) => member.employeeId)
				: []; // If `project.members` is undefined, set `members` to an empty array
		}

		const isFavorite = favoriteIds?.includes(project.id);

		// Ensure safe access to `project.members` to find the first manager
		const manager = Array.isArray(project?.members)
			? project.members.find((member) => member.isManager)
			: null;

		return {
			id: project?.id,
			is_favorite: isFavorite, // To be implemented after Auth,
			total_members: project?.membersCount,
			total_cycles: project?.organizationSprints?.length || 0,
			total_issues: project?.tasks?.length || 0,
			total_modules: project?.modules?.length || 0,
			is_member:
				!!currentMember && members.includes(currentMember?.employeeId),
			sort_order: 66373.5, // Research and know what it is exactly
			member_role: members.includes(currentMember?.employeeId)
				? currentMember?.isManager
					? 20
					: 15
				: 0,
			anchor: null, // Research and know what it is exactly
			members,
			state_id: null,
			priority: null, // To add for external API
			start_date: project?.startDate,
			target_date: project?.endDate,
			created_at: project?.createdAt,
			updated_at: project?.updatedAt,
			deleted_at: project?.deletedAt,
			name: project?.name,
			description: project?.description,
			description_text: null, // To add for external API
			description_html: null, // To add for external API
			network: project?.public ? 2 : 0,
			identifier:
				project?.code || project?.name?.slice(0, 4).toUpperCase(),
			emoji: null, // To add for external API
			icon_prop: null, // To add for external API
			module_view: true, // To add for external API
			cycle_view: true, // To add for external API
			issue_views_view: true, // To add for external API
			page_view: true, // To add for external API
			inbox_view: true, // To add for external API
			is_time_tracking_enabled: true, // To add for external API
			is_issue_type_enabled: true, // To add for external API
			cover_image: project?.imageUrl,
			archive_in: project?.archiveTasksIn,
			close_in: project?.closeTasksIn,
			logo_props: {
				emoji: {
					value: '127891'
				},
				in_use: 'emoji'
			},
			archived_at: project?.archivedAt,
			created_by: currentEmployeeId(), // To add for external API
			updated_by: currentEmployeeId(), // To add for external API
			workspace: project?.organizationId,
			default_assignee: project?.defaultAssigneeId,
			project_lead: manager ? manager.employeeId : null, // Use the first manager's ID if found, else null
			estimate: null, // To add for external API
			default_state: null // To add for external API
		};
	});
}

/**
 * Transforms project creation or update input into the format required
 * for creating an organization project.
 *
 * Extracts member and manager IDs, applies default values when necessary,
 * and maps input fields to the expected project creation shape.
 *
 * @param {ICreateProjectInput | IUpdateProjectInput} input - The raw input for creating or updating a project.
 * @returns {IOrganizationProjectCreateInput} - The transformed input suitable for project creation in the organization context.
 */
export function createProjectInputTransformer(
	input: ICreateProjectInput | IUpdateProjectInput
): IOrganizationProjectCreateInput {
	let memberIds = [];
	let managerIds = [];

	if (input.members) {
		memberIds = extractMemberIds(input.members);
	}

	if (input.project_lead) {
		managerIds = [input.project_lead];
	}

	const data: IOrganizationProjectCreateInput = {
		name: input.name,
		code: input.identifier,
		description: input.description,
		startDate: input.start_date,
		endDate: input.target_date,
		imageUrl: input.cover_image,
		public: input.network === 0 ? false : true,
		defaultAssigneeId: input.default_assignee,
		memberIds: memberIds.length > 0 ? memberIds : [currentEmployeeId()],
		managerIds: managerIds.length > 0 ? managerIds : [currentEmployeeId()],
		tenantId: currentTenantId(),
		organizationId: getCurrentOrganizationSlug()
	};

	if ('archived_at' in input) {
		if (isNotEmpty(input.archived_at)) {
			data.archivedAt = input.archived_at;
			data.isArchived = true;
		} else {
			data.archivedAt = null;
			data.isArchived = false;
		}
	}

	return data;
}

export function assignMembersToProjectTransformer(
	projectMembers: (IProjectMember | ID)[]
): ID[] {
	const memberIds = projectMembers.map((member) =>
		typeof member === 'string' ? member : member.member_id
	);
	return memberIds;
}

export const projectRelations = [
	'organization',
	'members',
	'members.employee.user.role',
	'tasks.members',
	'modules',
	'tags',
	'tenant',
	'statuses',
	'modules',
	'organizationSprints'
];

/**
 * Helper function to build query object
 */
export const getProjectsQuery = (
	relations?: string[]
): Record<string, string> => {
	const baseQuery = {
		...baseGetItemsWhereQuery()
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
	relations?: string[]
): Record<string, string> => {
	const query = {
		organizationId: getCurrentOrganizationSlug(),
		tenantId: currentTenantId()
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
	identifier: string
): Record<string, string> => ({
	...getProjectsQuery(),
	'where[code]': identifier
});
