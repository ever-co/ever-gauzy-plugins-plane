import {
	ICreateProjectInput,
	IOrganizationProject,
	IOrganizationProjectCreateInput,
	IProject,
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { defaultOrganizationId, defaultTestTenantId } from '../../credentials';

export function getProjectsResponse(
	projects: IOrganizationProject[],
): Partial<IProject>[] {
	return projects?.map((project) => {
		const members = project.members
			? project.members.map((member) => ({
					id: member.employee.user.id,
					member_id: member.id,
					member__display_name: member.employee.user.fullName,
					member__avatar: member.employee.user.imageUrl,
				}))
			: [];
		return {
			id: project.id,
			is_favorite: false, // To be add on external API,
			total_members: project.membersCount,
			total_cycles: project.organizationSprints?.length,
			total_issues: project.tasks?.length,
			total_modules: 0, // Must add modules feature on external API
			is_member: true, // Research and know what it is excatly
			sort_order: 66373.5, // Research and know what it is excatly
			member_role: 20, // Seems it should be a project creator/owner/etc. role associated to that user.
			anchor: null, // Research and know what it is excatly,
			members,
			state_id: null, // Research and know what it is excatly,
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
			identifier: project.code, // To add for external API
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
			archive_in: 0, // Research and know what it is excatly,
			close_in: 0, // Research and know what it is excatly,

			// Research and know what it is excatly,
			logo_props: {
				emoji: {
					value: '127891',
				},
				in_use: 'emoji',
			},
			archived_at: null, // To add for external API
			created_by: 'b7165202-4fcb-4351-b6c6-a2ce299ea10b', // To add for external API
			updated_by: 'b7165202-4fcb-4351-b6c6-a2ce299ea10b', // To add for external API
			workspace: project.tenantId,
			default_assignee: null, // To add for external API
			project_lead: null, // To add for external API
			estimate: null, // To add for external API
			default_state: null, // To add for external API
		};
	});
}

export function createProjectInputTransformer(
	input: ICreateProjectInput,
): IOrganizationProjectCreateInput {
	return {
		name: input.name,
		description: input.description,
		startDate: input.start_date,
		endDate: input.target_date,
		tenantId: defaultTestTenantId,
		organizationId: defaultOrganizationId,
	};
}

export const projectRelations = [
	'organization',
	'members',
	'members.employee',
	'members.employee.user',
	'tags',
	'teams',
];

export const getProjectsQuery: Record<string, string> = {
	...baseGetItemsWhereQuery,
};

projectRelations.forEach((relation, i) => {
	getProjectsQuery[`relations[${i}]`] = relation;
});
