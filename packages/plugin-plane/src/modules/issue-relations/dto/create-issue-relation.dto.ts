import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import {
	ICreateIssueRelationInput,
	ID,
	IssueRelationTypeEnum
} from '@plane-plugin/models';

export class CreateIssueRelationDTO implements ICreateIssueRelationInput {
	@ApiProperty({ type: () => Array })
	@IsArray()
	@IsNotEmpty()
	issues: ID[];

	@ApiProperty({ type: () => String, enum: IssueRelationTypeEnum })
	@IsEnum(IssueRelationTypeEnum)
	@IsNotEmpty()
	relation_type: IssueRelationTypeEnum;
}
