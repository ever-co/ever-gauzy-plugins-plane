import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { IEmailInput } from '@ever-gauzy/plugin-integration-plane-models';

/**
 * User email input DTO validation
 */
export class UserEmailDTO implements IEmailInput {
	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	@IsEmail()
	readonly email!: string;
}
