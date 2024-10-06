import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { IDeleteRelationInput } from '@plane-plugin/models';
import { CreateIssueRelationDTO } from './create-issue-relation.dto';

export class DeleteIssueRelationDTO
	extends PickType(CreateIssueRelationDTO, ['relation_type'])
	implements IDeleteRelationInput
{
	@ApiProperty({ type: () => String })
	@IsUUID()
	@IsNotEmpty()
	related_issue: string;
}
