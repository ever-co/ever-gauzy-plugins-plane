import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	Res
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { IUserLoginInput } from '@plane-plugin/models';
import { AuthService } from './auth.service';
import { EXTERNAL_API_MODE } from '../../config';
import { Public } from './auth.guard';
import { CheckExistUserDTO } from '../user/dto';

@ApiTags('Authentication routes')
@Controller()
export class AuthController {
	constructor(private readonly _authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Check email' })
	@Post('email-check')
	@Public()
	async checkExistingUser(@Body() input: CheckExistUserDTO) {
		return await this._authService.checkExistingUser(input);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get csrf_token' })
	@Get('get-csrf-token')
	@Public()
	async getCsrfToken(): Promise<{ csrf_token: string }> {
		return await this._authService.getCsrfToken();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sign in' })
	@Post('sign-in')
	@Public()
	async signIn(
		@Res() res: Response,
		@Body() data: IUserLoginInput & { next_path?: string },
		@Query('next_path') queryNextPath?: string
	) {
		try {
			const result = await this._authService.signIn(data);
			if (result.user) {
				res.cookie('auth-proxy-plane-token', result.token, {
					httpOnly: true,
					secure: EXTERNAL_API_MODE() === 'production',
					sameSite: 'strict'
				});

				const redirectPath =
					data.next_path ||
					queryNextPath ||
					`/${result.user.lastOrganizationId ?? result.user.defaultOrganizationId ?? 'no-workspace'}`;

				const normalizedPath = redirectPath.startsWith('/')
					? redirectPath
					: `/${redirectPath}`;

				return res.redirect(`http://localhost${normalizedPath}`);
			}
			const nextPathParam = data.next_path
				? `&next_path=${encodeURIComponent(data.next_path)}`
				: '';
			return res.redirect(
				`http://localhost/?error_code=5065&error_message=AUTHENTICATION_FAILED_SIGN_IN&email=${data.email}${nextPathParam}`
			);
		} catch (error) {
			console.log(error);
		}
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sign out' })
	@Post('sign-out')
	@Public()
	async signout(@Res() res: Response) {
		res.clearCookie('auth-proxy-plane-token', {
			httpOnly: true,
			secure: EXTERNAL_API_MODE() === 'production',
			sameSite: 'strict'
		});
		return res.redirect('http://localhost');
	}
}
