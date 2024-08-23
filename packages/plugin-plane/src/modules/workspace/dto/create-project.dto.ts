import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsDate,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
} from 'class-validator';
import { ICreateProjectInput, ID } from '@plane-plugin/models';

export class CreateProjectDTO implements ICreateProjectInput {
	@ApiProperty({ type: () => String })
	@IsOptional()
	cover_image: string;

	@ApiProperty({ type: () => String })
	@IsOptional()
	description: string;

	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	identifier: string;

	@ApiProperty({ type: () => Object })
	@IsObject()
	@IsOptional()
	logo_props: any;

	@ApiProperty({ type: () => Array })
	@IsArray()
	@IsOptional()
	members: any;

	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	name: string;

	@ApiProperty({ type: () => Number })
	@IsNumber()
	@IsNotEmpty()
	network: number;

	@ApiProperty({ type: () => String })
	@IsOptional()
	priority: string;

	@ApiProperty({ type: () => String })
	@IsOptional()
	project_lead: ID;

	@ApiProperty({ type: () => Date })
	@Type(() => Date)
	@IsOptional()
	@IsDate()
	start_date: Date;

	@ApiProperty({ type: () => String })
	@IsOptional()
	state_id: ID;

	@ApiProperty({ type: () => Date })
	@Type(() => Date)
	@IsOptional()
	@IsDate()
	target_date: Date;
}
