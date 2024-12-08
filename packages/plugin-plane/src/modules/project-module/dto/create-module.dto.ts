import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsArray,
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import {
	ICreateModuleInput,
	ID,
	ProjectModuleStatusEnum
} from '@plane-plugin/models';

export class CreateModuleDTO implements ICreateModuleInput {
	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	description?: string;

	@ApiPropertyOptional({ type: () => Date })
	@Type(() => Date)
	@IsOptional()
	@IsDate()
	start_date?: Date;

	@ApiPropertyOptional({ type: () => Date })
	@Type(() => Date)
	@IsOptional()
	@IsDate()
	target_date?: Date;

	@ApiPropertyOptional({ type: () => String })
	@IsEnum(ProjectModuleStatusEnum)
	@IsOptional()
	status?: ProjectModuleStatusEnum;

	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	lead_id?: ID;

	@ApiPropertyOptional({ type: () => Array })
	@IsArray()
	@IsOptional()
	member_ids?: ID[];

	@ApiProperty({ type: () => String })
	@IsUUID()
	@IsNotEmpty()
	project_id: ID;
}
