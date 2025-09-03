import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IUserTokenInput } from '@plane-plugin/models';

/**
 * User token input DTO validation
 */
export class UserTokenDTO implements IUserTokenInput {
	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	@IsString()
	readonly token: string;
}
