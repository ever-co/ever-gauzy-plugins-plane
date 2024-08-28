import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ICreateIssueLabelInput } from '@plane-plugin/models';

export class CreateIssueLabelDTO implements ICreateIssueLabelInput {
	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	color: string;
}
