import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { IPasswordInput } from '@plane-plugin/models';

/**
 * User password input DTO validation
 */
export class UserPasswordDTO implements IPasswordInput {
	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	@IsEmail()
	readonly password: string;
}
