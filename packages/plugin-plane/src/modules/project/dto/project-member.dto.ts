import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { IProjectMember } from '@ever-gauzy/plugin-integration-plane-models';

export class ProjectMemberDTO implements IProjectMember {
	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	id?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsUUID()
	@IsOptional()
	member_id?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	member__display_name?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	member__avatar?: string;

	@ApiPropertyOptional({ type: () => Number })
	@IsNumber()
	@IsOptional()
	role?: number;
}
