import { IIssueUpdateInput } from '@plane-plugin/models';
import { CreateIssueDTO } from './create-issue.dto';

export class UpdateIssueDTO
	extends CreateIssueDTO
	implements IIssueUpdateInput {}
