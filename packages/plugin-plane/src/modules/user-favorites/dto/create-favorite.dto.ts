import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsUUID,
} from 'class-validator';
import {
	FavoriteEntityTypeEnum,
	ICreateFavoriteInput,
	ID,
	IFavoriteEntityData,
} from '@plane-plugin/models';

export class CreateFavoriteDTO implements ICreateFavoriteInput {
	@ApiProperty({ type: () => String })
	@IsUUID()
	@IsNotEmpty()
	entity_identifier: ID;

	@ApiProperty({ type: () => String, enum: FavoriteEntityTypeEnum })
	@IsEnum(FavoriteEntityTypeEnum)
	@IsNotEmpty()
	entity_type: FavoriteEntityTypeEnum;

	@ApiPropertyOptional({ type: () => Boolean })
	@IsBoolean()
	@IsOptional()
	is_folder: boolean;

	@ApiPropertyOptional()
	@IsUUID()
	@IsOptional()
	parent: any;

	@ApiProperty({ type: () => String })
	@IsUUID()
	@IsNotEmpty()
	project_id: string;

	@ApiProperty({ type: () => Object })
	@IsObject()
	@IsNotEmpty()
	entity_data?: IFavoriteEntityData;
}
