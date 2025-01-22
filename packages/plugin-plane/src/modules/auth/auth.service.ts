import { Injectable } from '@nestjs/common';
import {
	CheckUserExistEnum,
	IAuthResponse,
	ICheckUserExist,
	IEmailCheckResponse,
	IEmailInput,
	IPasswordInput,
	IUserLoginInput
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { apiSecretKeys } from '../../config';

@Injectable()
export class AuthService extends ApiFetchService {
	private path = '/auth';

	/**
	 * Checks if a user exists based on their email. It sends a request to the email-check endpoint
	 * and determines the user's existence and the authentication method required.
	 *
	 * @param {IEmailInput & Partial<IPasswordInput>} input - The input containing the user's email and optionally their password.
	 * @returns {Promise<ICheckUserExist>} A promise resolving to an object indicating whether the user exists and the authentication status.
	 *
	 * @throws {Error} Logs the error and returns a default response if the API request fails.
	 */
	async checkExistingUser(
		input: IEmailInput & Partial<IPasswordInput>
	): Promise<ICheckUserExist> {
		try {
			const { API_KEY, API_SECRET } = apiSecretKeys();

			const isExists: IEmailCheckResponse = (
				await this.apiFetch({
					method: 'POST',
					path: `${this.path}/email-check`,
					body: { email: input.email },
					customHeaders: {
						'X-APP-ID': API_KEY,
						'X-API-KEY': API_SECRET
					}
				})
			).data;

			if (!isExists.exists) {
				return {
					existing: false,
					status: CheckUserExistEnum.MAGIC_CODE
				};
			}
			return { existing: true, status: CheckUserExistEnum.CREDENTIALS };
		} catch (error: any) {
			console.log(error.response.data);
			return { existing: false, status: CheckUserExistEnum.MAGIC_CODE };
		}
	}

	/**
	 * Authenticates a user by sending their login credentials to the server.
	 *
	 * @async
	 * @param {IUserLoginInput} credentials - The user's login credentials, including email and password.
	 * @returns {Promise<IAuthResponse | null>} A promise that resolves to the authentication response or `null` in case of an error.
	 *
	 * @throws {any} Returns the caught error if the API request fails.
	 */
	async signIn(credentials: IUserLoginInput): Promise<IAuthResponse | null> {
		try {
			const response: IAuthResponse | null = (
				await this.apiFetch({
					method: 'POST',
					path: `${this.path}/login`,
					body: credentials
				})
			).data;

			return response;
		} catch (error: any) {
			return error;
		}
	}

	async getCsrfToken(): Promise<{ csrf_token: string }> {
		return {
			csrf_token:
				'VewsJqujUGoIJKA7iTvbqmirySLbzFJVqha7Nxk5U39DCNfk2OLvCxQWYzPymhK4'
		};
	}
}
