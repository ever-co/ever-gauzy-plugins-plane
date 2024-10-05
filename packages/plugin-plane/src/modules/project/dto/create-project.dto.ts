import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsDate,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
} from 'class-validator';
import { ICreateProjectInput, ID } from '@plane-plugin/models';

export class CreateProjectDTO implements ICreateProjectInput {
	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	cover_image?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	description?: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	identifier: string;

	@ApiPropertyOptional({ type: () => Object })
	@IsObject()
	@IsOptional()
	logo_props?: any;

	@ApiPropertyOptional({ type: () => Array })
	@IsArray()
	@IsOptional()
	members?: any;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({ type: () => Number })
	@IsNumber()
	@IsNotEmpty()
	network: number;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	priority?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	project_lead?: ID;

	@ApiPropertyOptional({ type: () => Date })
	@Type(() => Date)
	@IsOptional()
	@IsDate()
	start_date?: Date;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	state_id?: ID;

	@ApiPropertyOptional({ type: () => Date })
	@Type(() => Date)
	@IsOptional()
	@IsDate()
	target_date?: Date;
}
