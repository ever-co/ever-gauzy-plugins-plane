import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ICreateReactionInput } from '@ever-gauzy/plugin-integration-plane-models';

export class CreateIssueReactionDTO implements ICreateReactionInput {
	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	reaction!: string;
}
