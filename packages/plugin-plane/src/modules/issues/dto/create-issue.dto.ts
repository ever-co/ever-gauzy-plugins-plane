import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsBoolean,
	IsDate,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID
} from 'class-validator';
import { ID, IIssueCreateInput, TaskPriorityEnum } from '@plane-plugin/models';
import { NonePriorityToUndefined } from '../../../config';

export class CreateIssueDTO implements IIssueCreateInput {
	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	name?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	description_html?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	state_id?: ID;

	@ApiPropertyOptional({ type: () => Date })
	@Type(() => Date)
	@IsOptional()
	@IsDate()
	completed_at?: Date;

	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	estimate_point?: string;

	@ApiPropertyOptional({ type: () => String, enum: TaskPriorityEnum })
	@IsEnum(TaskPriorityEnum)
	@IsOptional()
	@NonePriorityToUndefined()
	priority?: TaskPriorityEnum;

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

	@ApiPropertyOptional({ type: () => Number })
	@IsNumber()
	@IsOptional()
	sequence_id?: number;

	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	project_id?: ID;

	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	parent_id?: ID;

	@ApiPropertyOptional({ type: () => Boolean })
	@IsBoolean()
	@IsOptional()
	is_draft?: boolean;

	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	type_id?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	cycle_id?: string;

	@ApiPropertyOptional({ type: () => Array })
	@IsUUID('4', { each: true })
	@IsOptional()
	assignee_ids: ID[];

	@ApiPropertyOptional({ type: () => Array })
	@IsUUID('4', { each: true })
	@IsOptional()
	label_ids: ID[];

	@ApiPropertyOptional({ type: () => Array })
	@IsUUID('4', { each: true })
	@IsOptional()
	module_ids: ID[];

	@ApiPropertyOptional({ type: () => Array })
	@IsUUID('4', { each: true })
	@IsOptional()
	modules?: ID[];
}
