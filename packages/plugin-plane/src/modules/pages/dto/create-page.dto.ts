import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ID } from '@plane-plugin/models';

export class CreatePageDTO {
	@IsString()
	name: string;

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
	@IsString()
	color?: string;

	@IsOptional()
	@IsUUID()
	parent?: ID | null;

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	projects?: ID[];

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	labels?: ID[];

	@IsOptional()
	@IsNumber()
	sort_order?: number;
}
