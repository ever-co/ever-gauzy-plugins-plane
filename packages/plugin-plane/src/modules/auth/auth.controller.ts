import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Res
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CheckExistUserDTO } from '../user/dto';
import { Response } from 'express';
import { IUserLoginInput } from '@plane-plugin/models';
import { EXTERNAL_API_MODE } from '../../config';

@ApiTags('Authentication routes')
@Controller()
export class AuthController {
	constructor(private readonly _authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Check email' })
	@Post('email-check')
	async checkExistingUser(@Body() input: CheckExistUserDTO) {
		return await this._authService.checkExistingUser(input);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get csrf_token' })
	@Get('get-csrf-token')
	async getCsrfToken(): Promise<{ csrf_token: string }> {
		return await this._authService.getCsrfToken();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sign in' })
	@Post('sign-in')
	async signIn(@Res() res: Response, @Body() data: IUserLoginInput) {
		try {
			const result = await this._authService.signIn(data);
			if (result.user) {
				console.log(result.user);
				// Send token cookies and tenant credential
				res.cookie('auth-proxy-plane-token', result.token, {
					httpOnly: true, // Make sure the cookie is not inaccessible from client side
					secure: EXTERNAL_API_MODE() === 'production', // Allow only HTTPS if run production
					sameSite: 'strict'
				});
				return res.redirect(
					`http://localhost/${result.user.lastOrganizationId ?? result.user.defaultOrganizationId ?? 'no-workspace'}`
				);
			}
			return res.redirect(
				`http://localhost/?error_code=5065&error_message=AUTHENTICATION_FAILED_SIGN_IN&email=${data.email}`
			);
		} catch (error) {
			console.log(error);
		}
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sign in' })
	@Post('sign-out')
	async signout(@Res() res: Response, @Body() data: any) {
		console.log({ data });
		return res.redirect('http://localhost/gloire-salva');
	}
}
