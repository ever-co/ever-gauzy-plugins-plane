import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsArray,
	IsBoolean,
	IsDate,
	IsEnum,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { CycleStatusEnum, ICycle, ID } from '@ever-gauzy/plugin-integration-plane-models';

export class CycleDTO implements ICycle {
	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsUUID()
	id?: ID;

	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsString()
	name: string;

	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsString()
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
	end_date?: Date;

	@ApiPropertyOptional({ enum: CycleStatusEnum })
	@IsEnum(CycleStatusEnum)
	@IsOptional()
	status: CycleStatusEnum;

	@ApiPropertyOptional({ type: () => Number })
	@IsOptional()
	@IsNumber()
	version?: number;

	@ApiPropertyOptional({ type: () => Number })
	@IsOptional()
	@IsNumber()
	sort_order?: number;

	@ApiPropertyOptional({ type: () => Object })
	@IsOptional()
	@IsObject()
	progress_snapshot?: Record<string, any>;

	@ApiPropertyOptional({ type: () => Boolean })
	@IsOptional()
	@IsBoolean()
	is_favorite?: boolean;

	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsUUID()
	owned_by_id?: ID;

	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsUUID()
	created_by?: ID;

	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsUUID()
	workspace_id?: ID;

	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsUUID()
	project_id?: ID;

	@ApiPropertyOptional({ type: () => Array })
	@IsOptional()
	@IsArray()
	assignee_ids?: ID[];
}
