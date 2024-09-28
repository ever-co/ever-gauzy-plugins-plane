import { IEmployee, ITenant, IWorkspaceUserInfo } from '@plane-plugin/models';

const organizationRelations = ['employees', 'employees.user', 'tenant'];

export const getOrganizationQuery: Record<string, string> = {};

organizationRelations.forEach((relation, i) => {
	getOrganizationQuery[`relations[${i}]`] = relation;
});

export function organizationMembersTransformer(
	members: IEmployee[],
	tenant: ITenant,
): IWorkspaceUserInfo[] {
	return members.map((member) => ({
		id: member.userId,
		member: {
			id: member.id,
			first_name: member.user.firstName,
			last_name: member.user.lastName,
			avatar: member.user.imageUrl,
			is_bot: false,
			email: member.user.email,
			display_name:
				member.fullName ||
				`${member.user.firstName} ${member.user.lastName}`,
		},
		workspace: {
			id: tenant.id,
			name: tenant.name,
			slug: tenant.name.toLowerCase(),
		},
		created_at: member.createdAt,
		updated_at: member.updatedAt,
		deleted_at: member.deletedAt,
		role: 20,
		company_role: '', // TODO: Know how it works
		view_props: {
			filters: {
				state: null,
				labels: null,
				priority: null,
				assignees: null,
				created_by: null,
				start_date: null,
				subscriber: null,
				state_group: null,
				target_date: null,
			},
			display_filters: {
				type: null,
				layout: 'list',
				group_by: null,
				order_by: '-created_at',
				sub_issue: true,
				show_empty_groups: true,
				calendar_date_range: '',
			},
			display_properties: {
				key: true,
				link: true,
				state: true,
				labels: true,
				assignee: true,
				due_date: true,
				estimate: true,
				priority: true,
				created_on: true,
				start_date: true,
				updated_on: true,
				sub_issue_count: true,
				attachment_count: true,
			},
		},
		default_props: {
			filters: {
				state: null,
				labels: null,
				priority: null,
				assignees: null,
				created_by: null,
				start_date: null,
				subscriber: null,
				state_group: null,
				target_date: null,
			},
			display_filters: {
				type: null,
				layout: 'list',
				group_by: null,
				order_by: '-created_at',
				sub_issue: true,
				show_empty_groups: true,
				calendar_date_range: '',
			},
			display_properties: {
				key: true,
				link: true,
				state: true,
				labels: true,
				assignee: true,
				due_date: true,
				estimate: true,
				priority: true,
				created_on: true,
				start_date: true,
				updated_on: true,
				sub_issue_count: true,
				attachment_count: true,
			},
		},
		issue_props: {
			created: true,
			assigned: true,
			all_issues: true,
			subscribed: true,
		},
		is_active: member.isActive,
	}));
}
