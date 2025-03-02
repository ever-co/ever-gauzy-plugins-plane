import { IBasePerTenantAndOrganizationEntityModel, IBaseRelationsEntityModel, ID } from './base-entity.model';
import { IEmployee, IEmployeeEntityInput } from './employee.model';
import { IInvoiceItem } from './invoice-item.model';
import { IRelationalOrganizationProject } from './organization-projects.model';
import {
	IOrganizationSprint,
	IRelationalOrganizationSprint,
	IOrganizationSprintTaskHistory
} from './organization-sprint.model';
import { IOrganizationTeam, IRelationalOrganizationTeam } from './organization-team.model';
import { ITaggable } from './tag.model';
import { ITaskStatus, TaskStatusEnum } from './task-status.model';
import { ITaskPriority, TaskPriorityEnum } from './task-priority.model';
import { ITaskSize, TaskSizeEnum } from './task-size.model';
import { IOrganizationProjectModule } from './organization-project-module.model';
import { IIssueType, TaskTypeEnum } from './issue-type.model';
import { IMentionEmployeeIds } from './mention.model';
import { ITaskLinkedIssue } from './task-linked-issue.model';

export enum TaskParticipantEnum {
	EMPLOYEES = 'employees',
	TEAMS = 'teams'
}

export interface IBaseTaskProperties extends IBasePerTenantAndOrganizationEntityModel {
	title?: string;
	number?: number;
	public?: boolean;
	prefix?: string;
	description?: string;
	status?: TaskStatusEnum;
	priority?: TaskPriorityEnum;
	size?: TaskSizeEnum;
	issueType?: TaskTypeEnum;
	startDate?: Date;
	resolvedAt?: Date;
	dueDate?: Date;
	estimate?: number;
	isDraft?: boolean; // Define if task is still draft (E.g : Task description not completed yet)
	isScreeningTask?: boolean; // Defines if the task still in discussion before to be accepted
	version?: string;
}

// Interface for task associations (related entities)
export interface ITaskAssociations extends ITaggable, IRelationalOrganizationProject, IRelationalOrganizationSprint {
	children?: ITask[];
	members?: IEmployee[];
	invoiceItems?: IInvoiceItem[];
	teams?: IOrganizationTeam[];
	modules?: IOrganizationProjectModule[];
	taskSprints?: IOrganizationSprint[];
	taskSprintHistories?: IOrganizationSprintTaskHistory[];
	linkedIssues?: ITaskLinkedIssue[];
}

export interface ITask extends IBaseTaskProperties, ITaskAssociations {
	parent?: ITask;
	parentId?: ID; // Optional field for specifying the parent task ID
	taskStatus?: ITaskStatus;
	taskStatusId?: ID;
	taskSize?: ITaskSize;
	taskSizeId?: ID;
	taskPriority?: ITaskPriority;
	taskPriorityId?: ID;
	taskType?: IIssueType;
	taskTypeId?: ID;
	rootEpic?: ITask;
}

export interface IGetTaskOptions extends IBasePerTenantAndOrganizationEntityModel {
	projectId?: ID;
	isScreeningTask?: boolean;
}

export interface IGetTaskByEmployeeOptions extends IBaseRelationsEntityModel {
	where?: IGetTaskOptions;
}

export type IGetSprintsOptions = IGetTaskOptions;

export interface ITaskCreateInput extends ITask, IMentionEmployeeIds {}

export interface ITaskUpdateInput extends Partial<Omit<ITaskCreateInput, 'createdAt' | 'updatedAt'>> {
	id?: string;
	taskSprintMoveReason?: string;
}

export interface IGetTaskById {
	includeRootEpic?: boolean;
}

export interface IGetTasksByViewFilters extends IBasePerTenantAndOrganizationEntityModel, ITaskAdvancedFilter {
	statuses?: TaskStatusEnum[];
	priorityIds?: ID[];
	priorities?: TaskPriorityEnum[];
	sizeIds?: ID[];
	sizes?: TaskSizeEnum[];
	types?: string[];
	startDates?: Date[] | string[];
	dueDates?: Date[] | string[];
	creators?: ID[];

	// Relations
	relations?: string[];
}

export interface ITaskDateFilterInput
	extends IBasePerTenantAndOrganizationEntityModel,
		Pick<ITask, 'isScreeningTask' | 'projectId' | 'organizationSprintId' | 'createdByUserId'>,
		IEmployeeEntityInput,
		IRelationalOrganizationTeam,
		IBaseRelationsEntityModel {
	startDateFrom?: Date;
	startDateTo?: Date;
	dueDateFrom?: Date;
	dueDateTo?: Date;
}

export interface ITaskAdvancedFilter extends IBaseRelationsEntityModel {
	projects?: ID[];
	teams?: ID[];
	modules?: ID[];
	sprints?: ID[];
	members?: ID[];
	tags?: ID[];
	statusIds?: ID[];
	statuses?: TaskStatusEnum[];
	priorityIds?: ID[];
	priorities?: TaskPriorityEnum[];
	sizeIds?: ID[];
	parentIds?: ID[];
	createdByUserIds?: ID[];
	dailyPlans?: ID[];
	sizes?: TaskSizeEnum[];
	types?: string[];
	startDates?: Date[] | string[];
	dueDates?: Date[] | string[];

	// Relations
	relations?: string[];
}

export interface IAdvancedTaskFiltering {
	filters?: ITaskAdvancedFilter;
}
