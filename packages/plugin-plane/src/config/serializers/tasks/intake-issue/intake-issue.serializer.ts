import {
	ID,
	IEmployee,
	IIntakeIssue,
	IIntakeIssueCreateInput,
	IntakeIssueStatusEnum,
	IScreeningTask,
	IScreeningTaskCreateInput,
	ScreeningTaskStatusEnum,
	TaskRelatedIssuesRelationEnum,
	TaskStatusEnum
} from '@plane-plugin/models';
import {
	createIssueInputTransformer,
	issueTransformer
} from '../tasks.serializer';
import { defaultOrganizationId } from '../../../credentials';
import { extractEmployeeMentionIds } from '../../../utils';
import { baseGetItemsWhereQuery } from '../../query-params.serializers';

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
		input.issue.description_html
	);

	// Map employee IDs to user IDs
	const mentionedUserIds = employees
		?.filter(({ id }) => mentionedEmployeeIds.includes(id)) // Filter only employees who are mentioned
		.map((employee) => employee.userId) // Map to corresponding user IDs
		.filter((userId): userId is ID => !!userId); // Ensure user IDs are valid (non-null/undefined)

	return {
		task: createIssueInputTransformer(
			{ ...input.issue, project_id: projectId },
			status
		),
		taskId: input.issue.id ?? '1',
		organizationId: defaultOrganizationId(),
		mentionUserIds: mentionedUserIds ?? [],
		onHoldUntil: input.snoozed_till
	};
}

/**
 * Transforms screening tasks into intake issues.
 *
 * @param {IScreeningTask | IScreeningTask[]} screeningTasks - A single screening task or an array of screening tasks to transform.
 * @returns {IIntakeIssue | IIntakeIssue[]} The transformed intake issue(s).
 */
export function intakeIssueTranformer(
	screeningTasks: IScreeningTask | IScreeningTask[]
): IIntakeIssue | IIntakeIssue[] {
	const tranformIntakeIssue = (
		screeningTask: IScreeningTask
	): IIntakeIssue => {
		const duplicatedTaskId = (screeningTask.task.linkedIssues ?? []).find(
			(linkedIssue) =>
				linkedIssue.action === TaskRelatedIssuesRelationEnum.DUPLICATES
		)?.id;
		return {
			id: screeningTask.id,
			status: screeningStatusToIntakeStatusMap(screeningTask.status),
			duplicate_to: duplicatedTaskId ?? null,
			snoozed_till: screeningTask.onHoldUntil ?? null,
			source: 'IN_APP',
			issue: issueTransformer(screeningTask.task),
			created_by: screeningTask.creatorId // Adjust this to return employee ID
		};
	};

	if (Array.isArray(screeningTasks)) {
		return screeningTasks.map(tranformIntakeIssue);
	}

	return tranformIntakeIssue(screeningTasks);
}

export const getIntakeIssueQuery = (): Record<string, any> => {
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	query['relations[0]'] = 'task';

	return query;
};
