import { IBasePerTenantAndOrganizationEntityModel } from './imports';
export interface IIssueLabel {
	parent?: any;
	name: string;
	color: string;
	id?: string;
	project_id?: string;
	workspace_id?: string;
	sort_order?: number;
}

export interface ICreateIssueLabelInput
	extends Pick<IIssueLabel, 'name' | 'color'>,
		IBasePerTenantAndOrganizationEntityModel {}

export interface IUpdateIssueLabelInput extends Partial<ICreateIssueLabelInput> {}
