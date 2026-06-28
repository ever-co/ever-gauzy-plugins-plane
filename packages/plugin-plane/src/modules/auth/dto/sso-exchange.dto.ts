import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * SSO exchange input DTO validation.
 *
 * Carries a Gauzy access JWT to be verified by the proxy before the
 * session cookie is set, allowing a logged-in Gauzy user to be logged
 * into Plane without re-entering credentials.
 */
export class SsoExchangeDto {
	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	@IsString()
	readonly token!: string;
}
