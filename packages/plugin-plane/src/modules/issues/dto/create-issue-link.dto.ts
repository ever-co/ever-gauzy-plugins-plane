import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ICreateIssueLink } from '@ever-gauzy/plugin-integration-plane-models';

export class CreateIssueLinkDTO implements ICreateIssueLink {
	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	title: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	url: string;
}
