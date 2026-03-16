import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ID } from '@ever-gauzy/plugin-integration-plane-models';

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

	@IsOptional()
	@IsString()
	description_binary?: string;

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
