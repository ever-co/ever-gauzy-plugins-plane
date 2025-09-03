import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { IUserCodeInput } from '@plane-plugin/models';
import { ALPHA_NUMERIC_CODE_LENGTH, CustomLength } from '../../../config';

/**
 * User code input DTO validation
 */
export class UserCodeDTO implements IUserCodeInput {
	@ApiProperty({ type: () => Number })
	@IsString()
	@CustomLength(ALPHA_NUMERIC_CODE_LENGTH)
	readonly code: string;
}
