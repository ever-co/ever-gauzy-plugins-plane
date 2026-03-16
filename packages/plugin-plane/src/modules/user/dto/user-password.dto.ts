import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';
import { IPasswordInput } from '@ever-gauzy/plugin-integration-plane-models';

/**
 * User password input DTO validation
 */
export class UserPasswordDTO implements IPasswordInput {
	@ApiProperty({ type: () => String })
	@IsOptional()
	@IsEmail()
	readonly password?: string;
}
