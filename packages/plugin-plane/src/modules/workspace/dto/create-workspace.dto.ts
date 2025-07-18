import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ICreateWorkSpace, ID } from '@plane-plugin/models';

/**
 * Data Transfer Object (DTO) for creating a workspace.
 *
 * This DTO is used to validate and document the input payload
 * when creating a new workspace.
 */
export class CreateWorkspaceDTO implements ICreateWorkSpace {
	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty({ message: 'Name is required' })
	name: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsOptional()
	organization_size: string;

	@ApiProperty({ type: () => String })
	@IsString()
	@IsOptional()
	slug: string;

	@ApiProperty({ type: () => Array })
	@IsArray()
	@IsOptional()
	members: ID[];
}
