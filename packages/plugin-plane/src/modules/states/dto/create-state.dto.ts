import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ICreateStateInput } from '@plane-plugin/models';

export class CreateStateDto implements ICreateStateInput {
	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	description: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	group: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	color: string;
}
