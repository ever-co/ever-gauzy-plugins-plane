import { Injectable, InternalServerErrorException } from '@nestjs/common';
import qs from 'qs';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	getProjectsResponse,
	getProjectsQuery,
	createProjectInputTransformer,
	getStatesQuery,
	getStatesTransformer,
} from '../../config';
import {
	ICreateProjectInput,
	ID,
	IGetProjectMembersResponse,
	IOrganizationProject,
	IPagination,
	IProject,
	IState,
	ITaskStatus,
} from '@plane-plugin/models';

@Injectable()
export class WorkspaceService extends ApiFetchService {
	/**--------------------------------------------------------------
     * This function handlers should be updated after implementing authentication
     *--------------------------------------------------------------/
	/**
	 * @description - Get dashboard widgets for given workspace
	 * @param {string} workspace_name - slug for workspace name
	 * @param {string} dashboard_type - query that define which widget filter should be fetched
	 * @returns - A promise that resolves when dashboard widgets are fetched
	 * @memberof WorkspaceService
	 */
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

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication and User features
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get member (from connected user) info for a workspace
	 * @param {string} workspace_name - slug for workspace name
	 * @returns - A promise that resolves after getting member informations
	 * @memberof WorkspaceController
	 */
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

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get all projects for a workspace
	 * @returns - A promise that resolves after getting all projects for a workspace
	 * @memberof WorkspaceController
	 */
	async getProjects(): Promise<Partial<IProject>[]> {
		const query = qs.stringify(getProjectsQuery);
		try {
			const projects: IPagination<IOrganizationProject> = (
				await this.apiFetch({
					method: 'GET',
					path: `/organization-projects`,
					query,
				})
			).data;
			return getProjectsResponse(projects.items);
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException(error);
		}
	}

	/**
	 * @description - Get workspace project by ID
	 * @param {ID} id - The UUID primary key of the project to be fetched
	 * @returns - A promise that resolves after getting the project
	 * @memberof WorkspaceController
	 */
	async getProject(id: ID): Promise<IProject> {
		const query = qs.stringify(getProjectsQuery);
		try {
			const project: IOrganizationProject = (
				await this.apiFetch({
					method: 'GET',
					path: `/organization-projects/${id}`,
					query,
				})
			).data;
			return getProjectsResponse([project])[0] as IProject;
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException(error);
		}
	}

	/**
	 * @description - Get project members
	 * @param {ID} id - The UUID primary key of the project for whom to get members
	 * @returns - A promise that resolves after getting the project members
	 * @memberof WorkspaceController
	 */
	async getProjectMembers(id: ID): Promise<IGetProjectMembersResponse[]> {
		const project = await this.getProject(id);
		const members = project.members;
		return members.map((member) => ({
			id: member.member_id,
			member: member.id,
			role: 20, // Must be changed
			project: project.id,
		}));
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication and User features
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get user properties workspace project
	 * @param {ID} id - The UUID primary key of the project for whom get properties
	 * @returns - A promise that resolves after getting the user properties
	 * @memberof WorkspaceController
	 */
	async getProjectUserProperties(id: ID) {
		return {
			id: '8777de06-fab5-4888-8a8d-d860f91eba2d',
			created_at: '2024-08-20T14:27:11.217949Z',
			updated_at: '2024-08-23T06:33:05.401050Z',
			deleted_at: null,
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
				layout: 'kanban',
				calendar: {
					layout: 'month',
					show_weekends: false,
				},
				group_by: 'state',
				order_by: '-created_at',
				sub_issue: true,
				sub_group_by: null,
				show_empty_groups: true,
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
			created_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
			updated_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
			project: id,
			workspace: 'f8468b87-c371-4a78-9d68-5d09abc221d2',
			user: '61498b95-ca39-4464-93b3-acb8b14dee3e',
		};
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication (Reason : retrive the workspace ID from request session)
	 *--------------------------------------------------------------*/
	/**
	 * @description - Create new Project in workspace
	 * @param {CreateProjectDTO} payload - input data with which to create project
	 * @returns - A promise that resolves after created project
	 * @memberof WorkspaceController
	 */
	async createOrganizationProject(
		payload: ICreateProjectInput,
	): Promise<IProject> {
		const body = createProjectInputTransformer(payload);
		try {
			const project: IOrganizationProject = (
				await this.apiFetch({
					method: 'POST',
					path: '/organization-projects',
					body,
				})
			).data;

			return getProjectsResponse([project])[0] as IProject;
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException(error);
		}
	}

	/**
	 * @description - Get all states related to project
	 * @param {ID} id - The UUID primary key of the project for whom to get states
	 * @returns - A promise that resolves after getting all states
	 * @memberof WorkspaceController
	 */
	async getWorkspaceProjectStates(id: ID): Promise<IState[]> {
		const query = qs.stringify(getStatesQuery(id));
		try {
			const states: IPagination<ITaskStatus> = (
				await this.apiFetch({
					method: 'GET',
					path: `/task-statuses`,
					query,
				})
			).data;
			return getStatesTransformer(states.items);
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException(error);
		}
	}

	async getWorkspaceProjectMemberMe(id: ID): Promise<any> {
		try {
			const project = await this.getProject(id);
			const memberInfos = await this.getMembersMe('');

			return {
				id: 'f6d11360-882d-44c1-a55c-dd3d5d8fe5d4',
				workspace: {
					name: 'Cardano',
					slug: 'cardano',
					id: project.workspace,
				},
				project: {
					id: project.id,
					identifier: project.identifier,
					name: project.name,
					cover_image: project.cover_image,
					logo_props: project.logo_props,
					desciption: project.description,
				},
				member: {
					id: memberInfos.id,
					first_name: 'Salva',
					last_name: 'Cardano',
					avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJrkjUa3xiRgBrYPZSQ53906R4CPFcwCnQIE4SarJjw4IRZDQ=s96-c',
					is_bot: false,
					display_name: 'salva.cardano1',
				},
				created_at: memberInfos.created_at,
				updated_at: memberInfos.updated_at,
				deleted_at: memberInfos.deleted_at,
				comment: null,
				role: memberInfos.role,
				view_props: {
					filters: memberInfos.view_props.filters,
					display_filters: memberInfos.view_props.display_filters,
				},
				default_props: {
					filters: memberInfos.default_props.filters,
					display_filters: memberInfos.default_props.display_filters,
				},
				preferences: {
					pages: {
						block_display: true,
					},
				},
				sort_order: 65535.0,
				is_active: memberInfos.is_active,
				created_by: memberInfos.created_by,
				updated_by: memberInfos.updated_by,
			};
		} catch (error) {
			throw new InternalServerErrorException(error);
		}
	}
}
