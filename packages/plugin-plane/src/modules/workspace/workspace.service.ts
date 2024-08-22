import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkspaceService {
	async getDashboard(worspace_name: string, dashboard_type: string) {
		console.log({ worspace_name, dashboard_type });
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
}
