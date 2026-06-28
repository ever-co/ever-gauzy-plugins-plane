import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Logger,
	Post,
	Query,
	Req,
	Res
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
	CurrenciesEnum,
	IOrganization,
	ITenant,
	IUserLoginInput,
	IUserRegisterInput
} from '@ever-gauzy/plugin-integration-plane-models';
import { AuthService } from './auth.service';
import { clearTokenChuncks, sendTokenChunks } from '../../config';
import { Public } from './auth.guard';
import { CheckExistUserDTO, UserEmailDTO } from '../user/dto';
import { SsoExchangeDto, WorkspaceSigninEmailVerifyDTO } from './dto';

@ApiTags('Authentication routes')
@Controller()
export class AuthController {
	private readonly logger = new Logger(AuthController.name);

	constructor(private readonly _authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Check email' })
	@Post('email-check')
	@Public()
	async checkExistingUser(@Body() input: CheckExistUserDTO) {
		return await this._authService.checkExistingUser(input);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Check email' })
	@Post('spaces/email-check')
	@Public()
	async checkExistingUserSpaces(@Body() input: CheckExistUserDTO) {
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
		@Req() req: Request,
		@Res() res: Response,
		@Body() data: IUserLoginInput & { next_path?: string },
		@Query('next_path') queryNextPath?: string
	) {
		return await this._authService.handleSignIn(
			req,
			res,
			data,
			queryNextPath
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'SSO exchange' })
	@Post('sso-exchange')
	@Public()
	async ssoExchange(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Body() body: SsoExchangeDto
	) {
		return await this._authService.handleSsoExchange(
			req,
			res,
			body.token
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sign in' })
	@Post('spaces/sign-in')
	@Public()
	async spacesSignIn(
		@Req() req: Request,
		@Res() res: Response,
		@Body() data: IUserLoginInput & { next_path?: string },
		@Query('next_path') queryNextPath?: string
	) {
		return await this._authService.handleSignIn(
			req,
			res,
			data,
			queryNextPath,
			'spaces'
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Magic signin' })
	@Post('magic-sign-in')
	@Public()
	async magicSignin(
		@Req() req: Request,
		@Res() res: Response,
		@Body() data: WorkspaceSigninEmailVerifyDTO & { next_path?: string },
		@Query('next_path') queryNextPath?: string
	) {
		return await this._authService.handleMagicSignIn(
			req,
			res,
			data,
			queryNextPath
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Magic signin' })
	@Post('spaces/magic-sign-in')
	@Public()
	async spacesMagicSignin(
		@Req() req: Request,
		@Res() res: Response,
		@Body() data: WorkspaceSigninEmailVerifyDTO & { next_path?: string },
		@Query('next_path') queryNextPath?: string
	) {
		return await this._authService.handleMagicSignIn(
			req,
			res,
			data,
			queryNextPath,
			'spaces'
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sign out' })
	@Post('sign-out')
	@Public()
	async signout(@Res() res: Response, @Req() req: Request) {
		clearTokenChuncks(req, res);
		return res.redirect(req.headers.referer!);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Spaces sign out' })
	@Post('spaces/sign-out')
	@Public()
	async spacesSignout(@Res() res: Response, @Req() req: Request) {
		clearTokenChuncks(req, res);
		return res.redirect(`${req.headers.referer}spaces`);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sign up' })
	@Post('sign-up')
	@Public()
	async signUp(
		@Req() req: Request,
		@Res() res: Response,
		@Body() data: IUserRegisterInput
	) {
		try {
			// 1. Attempt to register the new user
			const user = await this._authService.signUp(data);

			if (user) {
				// 2. If registration is successful, sign in the user for onboarding process
			const result = await this._authService.signIn({
				email: user!.email!,
				password: data.password
			});

			if (result!.user) {
				// 3. Onboard the tenant using the user's email as the tenant name
				let tenant!: ITenant;

				try {
					tenant = await this._authService.onboardTenant(
						{
							name: data.email.split('@')[0]
						},
						result!.token!
					);
					} catch (error: any) {
						this.logger.error(
							'Error when creating new Tenant',
							error instanceof Error ? error.stack : String(error)
						);
					}

					// 4. Re-login to get fresh tokens with new tenant/role context
					// (the original refresh_token JWT is now stale after onboardTenant changed user's tenantId/roleId)
				let freshLogin = await this._authService.signIn({
					email: user!.email!,
					password: data.password
				});

					// 5. Create an organization for the tenant
					let organization!: IOrganization;
					try {
						organization =
							await this._authService.signUpCreateOrganization(
								{
									name: data.email.split('@')[0],
									currency: CurrenciesEnum.USD,
						tenantId: tenant.id
					},
					freshLogin!.token!,
					tenant.id
							);
					} catch (error) {
						this.logger.error(
							'Error when creating new default Organization',
							error
						);
					}

					// 6. Create an employee record for the user within the created organization
					try {
						await this._authService.signUpCreateEmployee(
							{
								userId: user.id,
								organizationId: organization.id,
								tenantId: tenant!.id
							},
							freshLogin!.token,
							tenant!.id
						);
					} catch (error) {
						this.logger.error(
							'Error when creating Employee',
							error instanceof Error ? error.stack : String(error)
						);
					}

					// 7. Re-login again to get tokens that include the new employee context
				freshLogin = await this._authService.signIn({
					email: user!.email!,
					password: data.password
					});

					// 8. Split the token into chunks and set cookies for the user
					clearTokenChuncks(req, res);
					sendTokenChunks(freshLogin!.token, res);

					// 9. Redirect the user to the onboarding page
					return res.redirect(`${req.headers.referer}onboarding`);
				}
			}
			// 10. Redirect to error page if user registration fails
			return res.redirect(
				`${req.headers.referer}?error_code=INVALID_EMAIL_SIGN_UP&error_message=INVALID_EMAIL_SIGN_UP`
			);
		} catch (error: any) {
			// Log any errors that occur during the sign-up process
			this.logger.error(
				`Sign-up error: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
		}
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Magic generate' })
	@Post('magic-generate')
	@Public()
	async magicGenerate(@Body() input: UserEmailDTO) {
		return await this._authService.magicGenerate(input);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Spaces magic generate' })
	@Post('spaces/magic-generate')
	@Public()
	async spacesMagicGenerate(@Body() input: UserEmailDTO) {
		return await this._authService.magicGenerate(input);
	}
}
