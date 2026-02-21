import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ID } from '@plane-plugin/models';

export class UpdatePageDTO {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	description_html?: string;

	@IsOptional()
	description_json?: any;

	/** 0 = public, 1 = private */
	@IsOptional()
	@IsNumber()
	access?: number;

	@IsOptional()
	@IsBoolean()
	is_locked?: boolean;

	@IsOptional()
	@IsString()
	archived_at?: string | null;

	@IsOptional()
	@IsString()
	color?: string;

	@IsOptional()
	@IsUUID()
	parent?: ID | null;

	@IsOptional()
	@IsNumber()
	sort_order?: number;
}
