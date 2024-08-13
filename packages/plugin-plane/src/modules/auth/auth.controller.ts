import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CheckExistUserDTO } from '../user/dto';

@ApiTags('Auth check email')
@Controller()
export class AuthController {
	constructor(private readonly _authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Check email' })
	@Post('email-check')
	async checkExistingUser(@Body() payload: CheckExistUserDTO) {
		return await this._authService.checkExistingUser(payload)
	}
}
