import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	Req,
	Res
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
	CurrenciesEnum,
	IUserLoginInput,
	IUserRegisterInput
} from '@plane-plugin/models';
import { AuthService } from './auth.service';
import {
	EXTERNAL_API_MODE,
	MAX_TOKEN_COOKIE_SIZE,
	splitToken
} from '../../config';
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
				const tokenChunks = splitToken(
					result.token,
					MAX_TOKEN_COOKIE_SIZE
				);
				tokenChunks.forEach((chunk, index) => {
					res.cookie(`auth-proxy-plane-token-${index}`, chunk, {
						httpOnly: true,
						secure: EXTERNAL_API_MODE() === 'production',
						sameSite: 'strict'
					});
				});

				const redirectPath =
					data.next_path ||
					queryNextPath ||
					`/${result.user.lastOrganizationId ?? result.user.defaultOrganizationId ?? ''}`;

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
	async signout(@Res() res: Response, @Req() req: Request) {
		let index = 0;
		while (true) {
			const cookieName = `auth-proxy-plane-token-${index}`;
			if (!req.cookies[cookieName]) {
				break;
			}
			res.clearCookie(cookieName, {
				httpOnly: true,
				secure: EXTERNAL_API_MODE() === 'production',
				sameSite: 'strict'
			});
			index++;
		}
		return res.redirect('http://localhost');
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sign up' })
	@Post('sign-up')
	@Public()
	async signUp(@Res() res: Response, @Body() data: IUserRegisterInput) {
		try {
			const user = await this._authService.signUp(data);

			if (user) {
				const result = await this._authService.signIn({
					email: user.email,
					password: data.password
				});

				if (result.user) {
					const tenant = await this._authService.onboardTenant(
						{
							name: data.email.split('@')[0]
						},
						result.token
					);

					let refrechedToken = await this._authService.refreshToken(
						result.refresh_token,
						result.token
					);

					const organization =
						await this._authService.signUpCreateOrganization(
							{
								name: data.email.split('@')[0],
								currency: CurrenciesEnum.USD,
								tenantId: tenant.id
							},
							refrechedToken.token
						);

					await this._authService.signUpCreateEmployee(
						{
							userId: user.id,
							organizationId: organization.id,
							tenantId: tenant.id
						},
						refrechedToken.token
					);

					refrechedToken = await this._authService.refreshToken(
						result.refresh_token,
						result.token
					);

					console.log({ refrechedToken });

					const tokenChunks = splitToken(
						refrechedToken.token,
						MAX_TOKEN_COOKIE_SIZE
					);
					tokenChunks.forEach((chunk, index) => {
						res.cookie(`auth-proxy-plane-token-${index}`, chunk, {
							httpOnly: true,
							secure: EXTERNAL_API_MODE() === 'production',
							sameSite: 'strict'
						});
					});
					return res.redirect('http://localhost/onboarding');
				}
			}
			return res.redirect(
				'http://localhost/?error_code=INVALID_EMAIL_SIGN_UP&error_message=INVALID_EMAIL_SIGN_UP'
			);
		} catch (error: any) {
			console.log(error.response.response);
		}
	}
}
