import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ICreateStateInput } from '@ever-gauzy/plugin-integration-plane-models';

export class CreateStateDto implements ICreateStateInput {
	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	name!: string;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	description?: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	group!: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	color!: string;
}
