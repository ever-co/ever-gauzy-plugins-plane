import {
	BadGatewayException,
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import qs from 'qs';
import {
	IAssignMembersToProject,
	ICreateProjectInput,
	ID,
	IGetProjectMembersResponse,
	IOrganizationProject,
	IPagination,
	IProject,
	IUpdateProjectInput,
} from '@plane-plugin/models';
import {
	assignMembersToProjectTransformer,
	createProjectInputTransformer,
	getProjectsQuery,
	getProjectsResponse,
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class ProjectService extends ApiFetchService {
	constructor(
		private readonly _workspaceService: WorkspaceService,
		private readonly _serverFetchService: ApiFetchService,
	) {
		super(_serverFetchService['_httpService']);
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get all projects for a workspace
	 * @returns - A promise that resolves after getting all projects for a workspace
	 * @memberof ProjectService
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
	 * @description - Get remode API project
	 * @private
	 * @param {ID} id - The project ID
	 * @returns - A promise that resolved after getting project
	 * @memberof ProjectService
	 */
	async getRemoteProject(id: ID): Promise<IOrganizationProject> {
		const query = qs.stringify(getProjectsQuery);
		return (
			await this.apiFetch({
				method: 'GET',
				path: `/organization-projects/${id}`,
				query,
			})
		).data;
	}

	/**
	 * @description - Get workspace project by ID
	 * @param {ID} id - The UUID primary key of the project to be fetched
	 * @returns - A promise that resolves after getting the project
	 * @memberof ProjectService
	 */
	async getProject(id: ID): Promise<IProject> {
		try {
			const project: IOrganizationProject =
				await this.getRemoteProject(id);

			if (!project) {
				throw new BadRequestException('Project not found');
			}

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
	 * @memberof ProjectService
	 */
	async getProjectMembers(id: ID): Promise<IGetProjectMembersResponse[]> {
		const project = await this.getProject(id);
		const members = project.members;
		return members.map((member) => ({
			id: member.id,
			member: member.member_id,
			role: member.role,
			project: project.id,
		}));
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication (Reason : retrive the workspace ID from request session)
	 *--------------------------------------------------------------*/
	/**
	 * @description - Create new Project in workspace
	 * @param {CreateProjectDTO} input - input data with which to create project
	 * @returns - A promise that resolves after created project
	 * @memberof ProjectService
	 */
	async createOrganizationProject(
		input: ICreateProjectInput,
	): Promise<IProject> {
		const body = createProjectInputTransformer(input);
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
	 * @description Update project
	 * @param {ID} id The project ID
	 * @param {IUpdateProjectInput} input Data to be updated
	 * @returns A promise that resolves after project updated
	 * @memberof ProjectService
	 */
	async update(id: ID, input: IUpdateProjectInput): Promise<IProject> {
		try {
			// Extract members from the input if provided
			const { members, ...restInput } = input;

			// Retrieve the project details from a remote source
			const project = await this.getRemoteProject(id);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// Transform the input using the transformer function
			const transformedInput = createProjectInputTransformer(restInput);

			// Destructure the project object to exclude 'members' and construct `projectWithoutMembers`
			const { members: existingMembers = [], ...projectWithoutMembers } =
				project;

			// Assign existing members if new members are not provided
			const memberIds = members
				? assignMembersToProjectTransformer(members)
				: existingMembers.map((m) => m.employeeId);

			// Create the final body for the PUT request by merging objects
			const body = {
				...projectWithoutMembers,
				...transformedInput,
				memberIds,
			};

			const updatedProject = (
				await this.apiFetch({
					method: 'PUT',
					path: `/organization-projects/${id}`,
					body: { ...project, ...body },
				})
			).data;

			// Transform the response to match the expected IProject format
			return getProjectsResponse([updatedProject])[0] as IProject;
		} catch (error) {
			console.log(error);
			throw new BadGatewayException(error);
		}
	}

	/**
	 * @description - Add other members to project
	 * @param {ID} id - The project ID
	 * @param {IProjectMember[]} members - New Members to be added
	 * @returns A promise resoved after members assigned to projec
	 * @memberof ProjectService
	 */
	async assignMembersToProject(
		id: ID,
		input: IAssignMembersToProject,
	): Promise<IProject> {
		try {
			const { members } = input;
			const project = await this.getRemoteProject(id);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// Extract existing members and prepare `projectWithoutMembers`
			const { members: existingMembers = [], ...projectWithoutMembers } =
				project;

			// Create a Set to eliminate duplicates and include new member IDs
			const memberIds = [
				...new Set([
					...assignMembersToProjectTransformer(members),
					...existingMembers.map((m) => m.employeeId),
				]),
			];

			const updatedProject = (
				await this.apiFetch({
					method: 'PUT',
					path: `/organization-projects/${id}`,
					body: { ...projectWithoutMembers, memberIds },
				})
			).data;

			return getProjectsResponse([updatedProject])[0];
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	async getWorkspaceProjectMemberMe(id: ID): Promise<any> {
		try {
			const project = await this.getProject(id);
			const memberInfos = await this._workspaceService.getMembersMe('');

			return {
				id: memberInfos.id,
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
					id: memberInfos.member,
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
