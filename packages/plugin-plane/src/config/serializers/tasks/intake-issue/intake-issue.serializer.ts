import { v4 as uuidv4 } from 'uuid';
import {
	ID,
	IEmployee,
	IIntakeIssue,
	IIntakeIssueCreateInput,
	IntakeIssueStatusEnum,
	IScreeningTask,
	IScreeningTaskCreateInput,
	IScreeningTaskUpdateInput,
	IState,
	ITask,
	ScreeningTaskStatusEnum,
	TaskRelatedIssuesRelationEnum,
	TaskStatusEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	createIssueInputTransformer,
	issueTransformer
} from '../tasks.serializer';
import { baseGetItemsWhereQuery } from '../../query-params.serializers';
import { getCurrentOrganizationSlug } from '../../../credentials';
import { extractEmployeeMentionIds } from '../../../utils';
import { deterministicUuid } from '../../../utils/deterministic-id.utils';

/**
 * ever-gauzy fork: the id of a project's intake "Triage" state.
 *
 * Plane shows intake work items in a special triage state until they are accepted. In Gauzy, intake items are screening
 * tasks and "waiting for triage" is the screening task's status (Pending, or Snoozed), not a task status, so the triage
 * state has no Gauzy row: it gets a stable id derived from the project.
 *
 * @param projectId - The project.
 */
export function intakeStateId(projectId: ID): ID {
	return deterministicUuid('intake-state', projectId);
}

/**
 * ever-gauzy fork: a project's intake "Triage" state (`GET /projects/:projectId/intake-state/`).
 *
 * @param projectId - The project.
 */
export function intakeStateTransformer(projectId: ID): IState {
	return {
		id: intakeStateId(projectId),
		name: 'Triage',
		group: 'triage',
		color: '#4E5355',
		default: false,
		description:
			'Intake work items waiting for screening (Ever Gauzy screening tasks that are pending or snoozed)',
		sequence: 0,
		project_id: projectId,
		workspace_id: getCurrentOrganizationSlug()
	};
}

/**
 * Whether a screening task is still waiting for triage.
 */
const isAwaitingTriage = (status?: ScreeningTaskStatusEnum): boolean =>
	status === ScreeningTaskStatusEnum.PENDING ||
	status === ScreeningTaskStatusEnum.SNOOZED;
const statusMap: Record<ScreeningTaskStatusEnum, IntakeIssueStatusEnum> = {
	[ScreeningTaskStatusEnum.ACCEPTED]: IntakeIssueStatusEnum.ACCEPTED,
	[ScreeningTaskStatusEnum.DECLINED]: IntakeIssueStatusEnum.DECLINED,
	[ScreeningTaskStatusEnum.DUPLICATED]: IntakeIssueStatusEnum.DUPLICATED,
	[ScreeningTaskStatusEnum.SNOOZED]: IntakeIssueStatusEnum.SNOOZED,
	[ScreeningTaskStatusEnum.PENDING]: IntakeIssueStatusEnum.PENDING
};

// Generate the reverse map dynamically
const reverseStatusMap = Object.fromEntries(
	Object.entries(statusMap).map(([key, value]) => [value, key])
) as Record<IntakeIssueStatusEnum, ScreeningTaskStatusEnum>;

/**
 * Converts a status from ScreeningTaskStatusEnum to IntakeIssueStatusEnum
 */
export function screeningStatusToIntakeStatusMap(
	screeningStatus: ScreeningTaskStatusEnum
): IntakeIssueStatusEnum {
	return statusMap[screeningStatus];
}

/**
 * Converts a status from IntakeIssueStatusEnum to ScreeningTaskStatusEnum
 */
export function intakeStatusToScreeningStatusMap(
	intakeStatus: IntakeIssueStatusEnum
): ScreeningTaskStatusEnum {
	return reverseStatusMap[intakeStatus];
}

/**
 * Transforms intake issue input into a screening task creation input.
 *
 * @param {IIntakeIssueCreateInput} input - The intake issue input to transform.
 * @param {TaskStatusEnum} status - The initial status to set for the task.
 * @param {IEmployee[]} [employees] - An optional list of employees to map mentions to user IDs.
 * @returns {IScreeningTaskCreateInput} The transformed screening task creation input.
 */
export function createIntakeIssueInputTransformer(
	input: IIntakeIssueCreateInput,
	status: TaskStatusEnum,
	projectId: ID,
	employees?: IEmployee[]
): IScreeningTaskCreateInput {
	// Extract employee IDs mentioned in the issue description
	const mentionedEmployeeIds = extractEmployeeMentionIds(
		input.issue!.description_html!
	);

	// Map employee IDs to user IDs
	const mentionedUserIds = employees
		?.filter(({ id }) => mentionedEmployeeIds.includes(id!)) // Filter only employees who are mentioned
		.map((employee) => employee.userId!) // Map to corresponding user IDs
		.filter((userId): userId is ID => !!userId); // Ensure user IDs are valid (non-null/undefined)

	return {
		task: createIssueInputTransformer(
			{ ...input.issue, project_id: projectId },
			status
		),
		taskId: input.issue!.id ?? uuidv4(),
		organizationId: getCurrentOrganizationSlug(),
		mentionUserIds: mentionedUserIds ?? [],
		onHoldUntil: input.snoozed_till
	};
}

/**
 * Transforms the input data for updating an intake issue into the format expected
 * by the screening task update API.
 *
 * @param {IIntakeIssueCreateInput} input - The input data for creating or updating an intake issue.
 * @returns {Partial<IScreeningTaskUpdateInput>} The transformed input data formatted for the screening task update API.
 */
export function updateIntakeIssueInputTransformer(
	input: IIntakeIssueCreateInput
): Partial<IScreeningTaskUpdateInput> {
	const keyMapping: Partial<
		Record<keyof IIntakeIssueCreateInput, keyof IScreeningTaskUpdateInput>
	> = {
		status: 'status',
		snoozed_till: 'onHoldUntil'
	};

	// Include only user included fields in the final request
	const tranformedInput: Partial<IScreeningTaskUpdateInput> = Object.entries(
		keyMapping
	).reduce(
		(
			acc: Partial<Omit<IScreeningTaskUpdateInput, 'creator'>>,
			[intakeKey, screeningKey]
		) => {
			if (intakeKey in input) {
				const value = input[intakeKey as keyof IIntakeIssueCreateInput];
				acc[screeningKey] = value;
			}

			acc['status'] = intakeStatusToScreeningStatusMap(input.status!);
			acc['organizationId'] = getCurrentOrganizationSlug();

			return acc;
		},
		{} as Partial<IScreeningTaskUpdateInput>
	);

	return tranformedInput;
}

/**
 * Transforms screening tasks into intake issues.
 *
 * @param {IScreeningTask | IScreeningTask[]} screeningTasks - A single screening task or an array of screening tasks to transform.
 * @param {ITask} task - An optional task to link duplicates to.
 * @returns {IIntakeIssue | IIntakeIssue[]} The transformed intake issue(s).
 */
export function intakeIssueTranformer(
	screeningTasks: IScreeningTask | IScreeningTask[],
	task?: ITask
): IIntakeIssue | IIntakeIssue[] {
	const tranformIntakeIssue = (
		screeningTask: IScreeningTask
	): IIntakeIssue => {
		const duplicatedTask =
			(screeningTask?.task?.linkedIssues ?? []).find(
				(linkedIssue) =>
					linkedIssue.action ===
					TaskRelatedIssuesRelationEnum.DUPLICATES
			) ??
			// ever-gauzy fork: null-safe (hardening)
			(task?.linkedIssues ?? []).find(
				(linkedIssue) =>
					linkedIssue.action ===
					TaskRelatedIssuesRelationEnum.DUPLICATES
			);
		const issue = issueTransformer(screeningTask?.task ?? task);
		// ever-gauzy fork: an item still waiting for triage is shown in the project's intake "Triage" state
		if (isAwaitingTriage(screeningTask?.status) && issue?.project_id) {
			issue.state_id = intakeStateId(issue.project_id);
			issue.state__group = 'triage';
		}
		return {
			id: screeningTask?.id,
			status: screeningStatusToIntakeStatusMap(screeningTask?.status),
			duplicate_to: duplicatedTask?.taskFrom!.id ?? undefined,
			duplicate_issue_detail: duplicatedTask?.taskFrom
				? issueTransformer(duplicatedTask?.taskFrom)
				: undefined,
			snoozed_till: screeningTask?.onHoldUntil ?? undefined,
			source: 'IN_APP',
			issue,
			created_by: screeningTask?.creatorId // Adjust this to return employee ID
		};
	};

	if (Array.isArray(screeningTasks)) {
		return screeningTasks.map(tranformIntakeIssue);
	}

	return tranformIntakeIssue(screeningTasks);
}

export const getIntakeIssueQuery = (taskId?: ID): Record<string, any> => {
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	if (taskId) {
		query['where[taskId]'] = taskId;
	}

	query['relations[0]'] = 'task.linkedIssues.taskFrom';
	query['relations[1]'] = 'task.linkedIssues.taskTo';

	return query;
};
