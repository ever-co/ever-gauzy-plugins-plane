import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ICreateCommentInput } from '@ever-gauzy/plugin-integration-plane-models';

export class CreateIssueCommentDTO implements ICreateCommentInput {
	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	comment_html!: string;
}
