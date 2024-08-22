import { IOrganizationProject, IProject } from '@plane-plugin/models';

export function getProjectsResponse(
	projects: IOrganizationProject[],
): Partial<IProject>[] {
	return projects.map((project) => {
		const members = project.members.map((member) => ({
			id: member.id,
			member_id: member.user.id,
			member__display_name: member.fullName,
			member__avatar: member.user.imageUrl,
		}));
		return {
			id: project.id,
			is_favorite: false, // To be add on external API,
			total_members: project.membersCount,
			total_cycles: project.organizationSprints?.length,
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
			network: project.public ? 2 : 1 || 0,
			identifier: 'PLUGI', // To add for external API
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
			created_by: '61498b95-ca39-4464-93b3-acb8b14dee3e', // To add for external API
			updated_by: '61498b95-ca39-4464-93b3-acb8b14dee3e', // To add for external API
			workspace: project.tenantId,
			default_assignee: null, // To add for external API
			project_lead: null, // To add for external API
			estimate: null, // To add for external API
			default_state: null, // To add for external API
		};
	});
}
