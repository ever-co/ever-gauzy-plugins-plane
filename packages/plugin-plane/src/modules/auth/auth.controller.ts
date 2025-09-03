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
	IOrganization,
	ITenant,
	IUserLoginInput,
	IUserRegisterInput
} from '@plane-plugin/models';
import { AuthService } from './auth.service';
import { clearTokenChuncks, sendTokenChunks } from '../../config';
import { Public } from './auth.guard';
import { CheckExistUserDTO, UserEmailDTO } from '../user/dto';

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
		@Req() req: Request,
		@Res() res: Response,
		@Body() data: IUserLoginInput & { next_path?: string },
		@Query('next_path') queryNextPath?: string
	) {
		try {
			const result = await this._authService.signIn(data);
			if (result.user) {
				clearTokenChuncks(req, res);
				sendTokenChunks(result.token, res);

				const redirectPath =
					data.next_path ||
					queryNextPath ||
					`/${result.user.lastOrganizationId ?? result.user.defaultOrganizationId ?? ''}`;

				const normalizedPath = redirectPath.startsWith('/')
					? redirectPath
					: `/${redirectPath}`;

				return res.redirect(`${req.headers.referer}${normalizedPath}`);
			}
			const nextPathParam = data.next_path
				? `&next_path=${encodeURIComponent(data.next_path)}`
				: '';
			return res.redirect(
				`${req.headers.referer}?error_code=5065&error_message=AUTHENTICATION_FAILED_SIGN_IN&email=${data.email}${nextPathParam}`
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
		clearTokenChuncks(req, res);
		return res.redirect(req.headers.referer);
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
					email: user?.email,
					password: data.password
				});

				if (result.user) {
					// 3. Onboard the tenant using the user's email as the tenant name
					let tenant: ITenant;

					console.log('Attempt create tenant...');
					try {
						tenant = await this._authService.onboardTenant(
							{
								name: data.email.split('@')[0]
							},
							result.token
						);
						console.log('Tenant Created');
					} catch (error: any) {
						console.log('Error when creating new Tenant...', error);
					}

					// 4. Refresh the token using the refresh token for organization creation purpose
					console.log('Refreshing token....');
					let refrechedToken = await this._authService.refreshToken(
						result.refresh_token,
						result.token
					);

					console.log('1..... First refreshed token');

					// 5. Create an organization for the tenant
					console.log('Attempt create new default organization...');
					let organization: IOrganization;
					try {
						organization =
							await this._authService.signUpCreateOrganization(
								{
									name: data.email.split('@')[0],
									currency: CurrenciesEnum.USD,
									tenantId: tenant.id
								},
								refrechedToken.token,
								tenant.id
							);

						console.log('Organization Created');
					} catch (error) {
						console.log(
							'Error when creating new default Organization...',
							error
						);
					}

					// 6. Create an employee record for the user within the created organization
					console.log('Attempt create employee...');
					try {
						await this._authService.signUpCreateEmployee(
							{
								userId: user.id,
								organizationId: organization.id,
								tenantId: tenant.id
							},
							refrechedToken.token,
							tenant.id
						);
						console.log('Employee Created');
					} catch (error) {
						console.log('Error when creating Employee...', error);
					}

					// 7. Refresh the token again to include the new employee
					console.log('Refreshing token again....');
					refrechedToken = await this._authService.refreshToken(
						result.refresh_token,
						result.token
					);

					console.log('2..... Second refreshed token');

					// 8. Split the token into chunks and set cookies for the user
					clearTokenChuncks(req, res);
					sendTokenChunks(refrechedToken.token, res);

					// 9. Redirect the user to the onboarding page
					return res.redirect(`${req.headers.referer}/onboarding`);
				}
			}
			// 10. Redirect to error page if user registration fails
			return res.redirect(
				`${req.headers.referer}?error_code=INVALID_EMAIL_SIGN_UP&error_message=INVALID_EMAIL_SIGN_UP`
			);
		} catch (error: any) {
			// Log any errors that occur during the sign-up process
			console.log(error.response);
		}
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Magic generate' })
	@Post('magic-generate')
	@Public()
	async magicGenerate(@Body() input: UserEmailDTO) {
		return await this._authService.magicGenerate(input);
	}
}
