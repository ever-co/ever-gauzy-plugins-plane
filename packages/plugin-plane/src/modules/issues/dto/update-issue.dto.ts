import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ID, IIssueUpdateInput } from '@plane-plugin/models';
import { CreateIssueDTO } from './create-issue.dto';

export class UpdateIssueDTO
	extends CreateIssueDTO
	implements IIssueUpdateInput
{
	@ApiPropertyOptional({ type: () => Array })
	@IsUUID('4', { each: true })
	@IsOptional()
	sub_issue_ids?: ID[];
}
