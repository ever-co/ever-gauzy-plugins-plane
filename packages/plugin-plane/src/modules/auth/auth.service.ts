import {
	BadGatewayException,
	BadRequestException,
	Injectable
} from '@nestjs/common';
import {
	CheckUserExistEnum,
	IAuthResponse,
	ICheckUserExist,
	IEmailCheckResponse,
	IEmailInput,
	IEmployee,
	IEmployeeCreateInput,
	IOrganization,
	IOrganizationCreateInput,
	IPasswordInput,
	ITenant,
	ITenantCreateInput,
	IUser,
	IUserLoginInput,
	IUserRegisterInput
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { apiSecretKeys, registerInputTranformer } from '../../config';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService extends ApiFetchService {
	constructor(
		private readonly _userService: UserService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

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
					status: CheckUserExistEnum.CREDENTIALS
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

	async signUp(input: IUserRegisterInput): Promise<IUser> {
		try {
			const user: IUser = (
				await this.apiFetch({
					method: 'POST',
					path: `${this.path}/register`,
					body: registerInputTranformer(input)
				})
			).data;

			return user;
		} catch (error: any) {
			throw new BadRequestException(error);
		}
	}

	async onboardTenant(
		input: ITenantCreateInput,
		token: string
	): Promise<ITenant> {
		try {
			const tenant: ITenant = (
				await this.apiFetch({
					method: 'POST',
					path: '/tenant',
					body: input,
					bearer_token: token
				})
			).data;

			return tenant;
		} catch (error: any) {
			console.log('Tenant Onboard Error', error);
			throw new BadRequestException(error);
		}
	}

	async refreshToken(
		refreshToken: string,
		token: string
	): Promise<{ token: string } | null> {
		try {
			const response: { token: string } | null = (
				await this.apiFetch({
					method: 'POST',
					path: `${this.path}/refresh-token`,
					body: { refresh_token: refreshToken },
					bearer_token: token
				})
			).data;

			return response;
		} catch (error: any) {
			console.log('Refresh Token error', error);
			throw new BadRequestException(error);
		}
	}

	async signUpCreateOrganization(
		input: IOrganizationCreateInput,
		token: string
	): Promise<IOrganization> {
		try {
			const organization: IOrganization = (
				await this.apiFetch({
					method: 'POST',
					path: '/organization',
					body: input,
					bearer_token: token
				})
			).data;

			await this._userService.updateUserProfile(
				{ fallback_workspace_id: organization.id },
				token,
				organization.tenantId
			);

			return organization;
		} catch (error) {
			throw new BadGatewayException(error);
		}
	}

	async signUpCreateEmployee(
		input: IEmployeeCreateInput,
		token: string
	): Promise<IEmployee> {
		try {
			const employee: IEmployee = (
				await this.apiFetch({
					method: 'POST',
					path: '/employee',
					body: input,
					bearer_token: token
				})
			).data;

			return employee;
		} catch (error: any) {
			// console.log(error);
			throw new BadRequestException(error);
		}
	}

	async getCsrfToken(): Promise<{ csrf_token: string }> {
		return {
			csrf_token:
				'VewsJqujUGoIJKA7iTvbqmirySLbzFJVqha7Nxk5U39DCNfk2OLvCxQWYzPymhK4'
		};
	}
}
