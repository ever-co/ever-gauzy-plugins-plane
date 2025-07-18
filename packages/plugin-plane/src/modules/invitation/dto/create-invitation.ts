import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ICreateWorkspaceInvitationInput } from '@plane-plugin/models';

/**
 * DTO for creating a single workspace invitation.
 */
export class CreateInvitationDTO implements ICreateWorkspaceInvitationInput {
	@ApiProperty({
		type: () => String,
		example: 'john.doe@example.com',
		description: 'Email of the user to invite'
	})
	@IsString()
	@IsNotEmpty()
	email: string;

	@ApiProperty({
		type: () => Number,
		example: 15,
		description: 'Role ID to assign (e.g., 20 = ADMIN, 15 = EMPLOYEE)'
	})
	@IsNumber()
	@IsNotEmpty()
	role: number;
}
