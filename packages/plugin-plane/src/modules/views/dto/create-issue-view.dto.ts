import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
} from 'class-validator';
import {
	ICreateViewInput,
	IDisplayProperties,
	IViewPropsDisplayFilters,
	IViewPropsFilters,
} from '@plane-plugin/models';

export class CreateViewDTO implements ICreateViewInput {
	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	@IsString()
	name: string;

	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({ type: () => Number })
	@IsOptional()
	@IsNumber()
	access?: number;

	@ApiPropertyOptional({ type: () => Object })
	@IsOptional()
	@IsObject()
	filters?: IViewPropsFilters;

	@ApiPropertyOptional({ type: () => Object })
	@IsOptional()
	@IsObject()
	display_filters?: IViewPropsDisplayFilters;

	@ApiPropertyOptional({ type: () => Object })
	@IsOptional()
	@IsObject()
	display_properties?: IDisplayProperties;
}
