import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { getProjectsResponse } from '../../config';
import { IOrganizationProject, IPagination } from '@plane-plugin/models';

@Injectable()
export class WorkspaceService {
	constructor(private readonly _serverFetchService: ApiFetchService) {}
	async getDashboard(workspace_name: string, dashboard_type: string) {
		console.log({ workspace_name, dashboard_type });
		return {
			dashboard: {
				id: '9495b115-1faa-4677-9051-0206353a21d4',
				created_at: '2024-06-25T12:24:39.030331Z',
				updated_at: '2024-06-25T12:24:39.030345Z',
				deleted_at: null,
				name: '',
				description_html: '<p></p>',
				identifier: null,
				is_default: true,
				type_identifier: 'home',
				logo_props: {},
				created_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
				updated_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
				owned_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
			},
			widgets: [
				{
					id: '2aeac7af-6040-488c-8f5c-6ebac65ca4b7',
					key: 'recent_collaborators',
					is_visible: true,
					widget_filters: {},
				},
				{
					id: '59f310e4-0473-4fb9-ad2d-d709edcc44e2',
					key: 'recent_projects',
					is_visible: true,
					widget_filters: {},
				},
				{
					id: '6bbda6d1-73cc-4e95-82e2-6f4677cc4993',
					key: 'recent_activity',
					is_visible: true,
					widget_filters: {},
				},
				{
					id: '99748079-63ff-413a-95e2-3d1a706512dd',
					key: 'issues_by_priority',
					is_visible: true,
					widget_filters: {
						duration: 'none',
					},
				},
				{
					id: '15eebb02-7be0-472d-a621-5a886e39f10e',
					key: 'issues_by_state_groups',
					is_visible: true,
					widget_filters: {
						duration: 'none',
					},
				},
				{
					id: 'b07deb33-9e8d-42aa-9515-134c26e5d7df',
					key: 'created_issues',
					is_visible: true,
					widget_filters: {
						tab: 'pending',
						duration: 'none',
					},
				},
				{
					id: 'fd3307a4-11e3-4013-ab65-d1f9bcfcaad4',
					key: 'assigned_issues',
					is_visible: true,
					widget_filters: {
						tab: 'pending',
						duration: 'none',
					},
				},
				{
					id: 'b2c401a3-ce8a-42e5-853f-55302b0b5502',
					key: 'overview_stats',
					is_visible: true,
					widget_filters: {},
				},
			],
		};
	}

	async getMembersMe(workspace_name: string) {
		console.log({ workspace_name });
		return {
			id: 'd9657344-06a1-4965-8d3e-b98fd984e58a',
			created_at: '2024-08-13T11:47:19.039549Z',
			updated_at: '2024-08-13T11:47:19.039558Z',
			deleted_at: null,
			role: 20,
			company_role: '',
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
			is_active: true,
			created_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
			updated_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
			workspace: 'f8468b87-c371-4a78-9d68-5d09abc221d2',
			member: '61498b95-ca39-4464-93b3-acb8b14dee3e',
		};
	}

	async getProjects() {
		try {
			const projects: IPagination<IOrganizationProject> = (
				await this._serverFetchService.apiFetch({
					method: 'GET',
					path: '/organization-projects?where[organizationId]=7d486bd0-6437-44e2-923b-bad910d57c69&where[tenantId]=f8468b87-c371-4a78-9d68-5d09abc221d2&join[alias]=organization_project&join[leftJoin][tags]=organization_project.tags&relations[0]=organizationContact&relations[1]=organization&relations[2]=members&relations[3]=members.user&relations[4]=tags&relations[5]=teams',
				})
			).data;
			return getProjectsResponse(projects.items);
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException(error);
		}
	}
}
