import {
	BadGatewayException,
	BadRequestException,
	Injectable
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
	BaseEntityEnum,
	CheckUserExistEnum,
	EmployeeSettingTypeEnum,
	IAuthResponse,
	ICheckUserExist,
	ID,
	IEmailCheckResponse,
	IEmailInput,
	IEmployee,
	IEmployeeCreateInput,
	IMagicGenerateResponse,
	IOrganization,
	IOrganizationCreateInput,
	IPasswordInput,
	ITenant,
	ITenantCreateInput,
	IUser,
	IUserCodeInput,
	IUserEmailInput,
	IUserLoginInput,
	IUserRegisterInput,
	IUserSigninWorkspaceResponse
} from '@ever-gauzy/plugin-integration-plane-models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	apiSecretKeys,
	clearTokenChuncks,
	DEFAULT_MAGIC_GENERATE_PREFIX,
	MEMBER_DEFAULT_VIEW_PROPS,
	registerInputTranformer,
	sendTokenChunks
} from '../../config';
import { UserService } from '../user/user.service';
import { EmployeePropertiesService } from '../employee-properties/employee-properties.service';

@Injectable()
export class AuthService extends ApiFetchService {
	constructor(
		private readonly _userService: UserService,
		private readonly _employeePropertiesService: EmployeePropertiesService,
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
			this.logger.warn(
				`Failed to check existing user: ${error?.response?.data?.message || error.message}`
			);
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

	/**
	 * Handles the sign-in process including token management and redirection.
	 *
	 * @param {Request} req - The Express request object.
	 * @param {Response} res - The Express response object.
	 * @param {IUserLoginInput & { next_path?: string }} data - The login input data with optional next_path.
	 * @param {string} [queryNextPath] - Optional next path from query parameters.
	 * @returns {Promise<void>}
	 */
	async handleSignIn(
		req: Request,
		res: Response,
		data: IUserLoginInput & { next_path?: string },
		queryNextPath?: string,
		customRedirectPath?: string
	): Promise<void> {
		try {
			const result = await this.signIn(data);
			if (result?.user) {
				clearTokenChuncks(req, res);
				sendTokenChunks(result.token, res);

				const redirectPath =
					customRedirectPath ||
					data.next_path ||
					queryNextPath ||
					`${result.user.lastOrganizationId ?? result.user.defaultOrganizationId ?? ''}`;

				const normalizedPath = redirectPath;

				return res.redirect(`${req.headers.referer}${normalizedPath}`);
			}
			const nextPathParam = data.next_path
				? `&next_path=${encodeURIComponent(data.next_path)}`
				: '';
			return res.redirect(
				`${req.headers.referer}?error_code=5065&error_message=AUTHENTICATION_FAILED_SIGN_IN&email=${data.email}${nextPathParam}`
			);
		} catch (error) {
			this.logger.error(
				'Failed to handle sign in',
				error instanceof Error ? error.stack : String(error)
			);
		}
	}

	/**
	 * Registers a new user by sending their details to the server.
	 *
	 * @param {IUserRegisterInput} input - The input containing the user's details.
	 * @returns {Promise<IUser>} A promise resolving to the created user object.
	 *
	 * @throws {BadRequestException} Throws an exception if the API request fails.
	 */
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

	/**
	 * Generates a magic key for a user by sending their email to the server.
	 *
	 * @param {IUserEmailInput} input - The input containing the user's email.
	 * @returns {Promise<IMagicGenerateResponse>} A promise resolving to the magic key.
	 *
	 * @throws {BadRequestException} Throws an exception if the API request fails.
	 */
	async magicGenerate(
		input: IUserEmailInput
	): Promise<IMagicGenerateResponse> {
		try {
			await this.apiFetch({
				method: 'POST',
				path: `${this.path}/signin.email`,
				body: input
			});

			return { key: `${DEFAULT_MAGIC_GENERATE_PREFIX}${input.email}` };
		} catch (error: any) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * Confirms a magic signin by sending the user's email and code to the server.
	 *
	 * @param {IUserEmailInput & IUserCodeInput} input - The input containing the user's email and code.
	 * @returns {Promise<IUserSigninWorkspaceResponse>} A promise resolving to the user's signin workspace response.
	 *
	 * @throws {BadRequestException} Throws an exception if the API request fails.
	 */
	async magicSignin(
		input: IUserEmailInput & IUserCodeInput
	): Promise<IAuthResponse> {
		try {
			// Confirm the signin by email and code
			const response: IUserSigninWorkspaceResponse = (
				await this.apiFetch({
					method: 'POST',
					path: `${this.path}/signin.email/confirm`,
					body: input
				})
			).data;

			// Get the last workspace
			const lastWorkspace =
				response.workspaces.find(
					(workspace) => workspace.user.lastOrganizationId
				) || response.workspaces[0];

			// Signin to the last workspace
			const lastWorkspaceResponse: IAuthResponse = (
				await this.apiFetch({
					method: 'POST',
					path: `${this.path}/signin.workspace`,
					body: {
						email: lastWorkspace.user.email,
						token: lastWorkspace.token
					}
				})
			).data;

			return lastWorkspaceResponse;
		} catch (error: any) {
			this.logger.error(
				`Magic Signin Error: ${error?.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Handles the magic sign-in process including token management and redirection.
	 *
	 * @param {Request} req - The Express request object.
	 * @param {Response} res - The Express response object.
	 * @param {IUserEmailInput & IUserCodeInput & { next_path?: string }} data - The magic sign-in input data with optional next_path.
	 * @param {string} [queryNextPath] - Optional next path from query parameters.
	 * @param {string} [customRedirectPath] - Optional custom redirect path.
	 * @returns {Promise<void>}
	 */
	async handleMagicSignIn(
		req: Request,
		res: Response,
		data: IUserEmailInput & IUserCodeInput & { next_path?: string },
		queryNextPath?: string,
		customRedirectPath?: string
	): Promise<void> {
		try {
			const result = await this.magicSignin(data);
			if (result?.user) {
				clearTokenChuncks(req, res);
				sendTokenChunks(result.token, res);

				const redirectPath =
					customRedirectPath ||
					data.next_path ||
					queryNextPath ||
					`${result.user.lastOrganizationId ?? result.user.defaultOrganizationId ?? ''}`;

				const normalizedPath = redirectPath;

				return res.redirect(`${req.headers.referer}${normalizedPath}`);
			}

			const nextPathParam = data.next_path
				? `&next_path=${encodeURIComponent(data.next_path)}`
				: '';
			return res.redirect(
				`${req.headers.referer}?error_code=5065&error_message=AUTHENTICATION_FAILED_SIGN_IN&email=${data.email}${nextPathParam}`
			);
		} catch (error) {
			this.logger.error(
				'Failed to handle magic sign in',
				error instanceof Error ? error.stack : String(error)
			);
		}
	}

	/**
	 * Initiates the onboarding process for a new tenant by sending its details to the server.
	 *
	 * @param {ITenantCreateInput} input - The input containing the tenant's details.
	 * @param {string} token - The bearer token for authentication.
	 * @returns {Promise<ITenant>} A promise resolving to the created tenant object.
	 *
	 * @throws {BadRequestException} Throws an exception if the API request fails.
	 */
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
			this.logger.error(
				`Tenant Onboard Error: ${error?.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Refreshes the user's authentication token using a provided refresh token.
	 *
	 * @param {string} refreshToken - The refresh token to be used for obtaining a new token.
	 * @param {string} token - The bearer token for authentication.
	 * @returns {Promise<{ token: string } | null>} A promise resolving to an object containing the new token or `null` if the request fails.
	 *
	 * @throws {BadRequestException} Throws an exception if the API request fails.
	 */
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
			this.logger.error(
				`Refresh Token error: ${error?.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Creates a new organization by sending its details to the server.
	 *
	 * @param {IOrganizationCreateInput} input - The input containing the organization's details.
	 * @param {string} token - The bearer token for authentication.
	 * @returns {Promise<IOrganization>} A promise resolving to the created organization object.
	 *
	 * @throws {BadRequestException} Throws an exception if the API request fails.
	 */
	async signUpCreateOrganization(
		input: IOrganizationCreateInput,
		token: string,
		tenantId?: ID
	): Promise<IOrganization> {
		try {
			const organization: IOrganization = (
				await this.apiFetch({
					method: 'POST',
					path: '/organization',
					body: input,
					bearer_token: token,
					tenantId
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

	/**
	 * Creates a new employee by sending their details to the server.
	 *
	 * @param {IEmployeeCreateInput} input - The input containing the employee's details.
	 * @param {string} token - The bearer token for authentication.
	 * @returns {Promise<IEmployee>} A promise resolving to the created employee object.
	 *
	 * @throws {BadRequestException} Throws an exception if the API request fails.
	 */
	async signUpCreateEmployee(
		input: IEmployeeCreateInput,
		token: string,
		tenantId?: ID
	): Promise<IEmployee> {
		try {
			const employee: IEmployee = (
				await this.apiFetch({
					method: 'POST',
					path: '/employee',
					body: input,
					bearer_token: token,
					tenantId
				})
			).data;

			// Create default settings
			const settingViewProps = {
				...MEMBER_DEFAULT_VIEW_PROPS,
				issue_props: {
					created: true,
					assigned: true,
					all_issues: true,
					subscribed: true
				}
			};
			try {
				await this._employeePropertiesService.create(
					{
						entity: BaseEntityEnum.Tenant,
						entityId: tenantId,
						settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
						data: settingViewProps,
						defaultData: settingViewProps,
						employee: { id: employee.id },
						employeeId: employee.id
					},
					token,
					tenantId,
					employee.organizationId
				);
			} catch (error: any) {
				this.logger.warn(
					`Failed to create employee settings: ${error?.response?.data?.message || error.message}`
				);
			}

			return employee;
		} catch (error: any) {
			this.logger.error(
				`Failed to create employee: ${error?.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Get the CSRF token
	 * @returns {Promise<{ csrf_token: string }>} The CSRF token
	 */
	async getCsrfToken(): Promise<{ csrf_token: string }> {
		return {
			csrf_token:
				'VewsJqujUGoIJKA7iTvbqmirySLbzFJVqha7Nxk5U39DCNfk2OLvCxQWYzPymhK4'
		};
	}
}
