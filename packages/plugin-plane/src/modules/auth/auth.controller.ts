import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CheckExistUserDTO } from '../user/dto';
import { Request, Response } from 'express';
import { IUserLoginInput } from '@plane-plugin/models';

@ApiTags('Authentication routes')
@Controller()
export class AuthController {
	constructor(private readonly _authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Check email' })
	@Post('email-check')
	async checkExistingUser(
		@Body() input: CheckExistUserDTO,
		@Res() res: Response,
		@Req() req: Request
	) {
		const authToken = req.cookies['auth-gauzy-proxy-plane'];
		console.log(`Le token d'authentification est : ${authToken}`);

		// Définir la cookie
		// res.cookie(
		// 	'auth-gauzy-proxy-plane',
		// 	'auth_token_for_api_key_and_api_secret-now-1',
		// 	{
		// 		httpOnly: true, // La cookie est inaccessible depuis JavaScript côté client
		// 		secure: false, // Utiliser uniquement sur des connexions HTTPS
		// 		sameSite: 'strict', // Empêche les cookies d'être envoyés dans des requêtes intersites
		// 		maxAge: 1000 * 60 * 60 * 24 // Durée de validité: 1 jour (en millisecondes)
		// 	}
		// );

		const result = await this._authService.checkExistingUser(input);
		return res.status(200).json(result);
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
