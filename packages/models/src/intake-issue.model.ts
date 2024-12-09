import { ID } from './imports';
import { IIssue } from './issue.model';

export interface IIntakeIssue {
	id?: ID;
	status?: IntakeIssueStatusEnum;
	duplicate_to?: ID;
	snoozed_till?: Date;
	duplicate_issue_detail?: IIssue;
	source?: string;
	issue?: IIssue;
}

export enum IntakeIssueStatusEnum {
	PENDING = -2,
	DECLINED = -1,
	SNOOZED = 0,
	ACCEPTED = 1,
	DUPLICATED = 2
}

export interface IIntakeIssueCreateInput extends Omit<IIntakeIssue, 'id'> {}
