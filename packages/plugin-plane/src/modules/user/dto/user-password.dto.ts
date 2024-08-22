import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';
import { IPasswordInput } from '@plane-plugin/models';

/**
 * User password input DTO validation
 */
export class UserPasswordDTO implements IPasswordInput {
	@ApiProperty({ type: () => String })
	@IsOptional()
	@IsEmail()
	readonly password?: string;
}
