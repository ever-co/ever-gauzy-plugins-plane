import { Injectable } from '@nestjs/common';
import {
	CheckUserExistEnum,
	ICheckUserExist,
	IEmailCheckResponse,
	IEmailInput,
	IPasswordInput
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { apiSecretKeys } from '../../config';

@Injectable()
export class AuthService {
	constructor(private readonly _serverFetchService: ApiFetchService) {}
	async checkExistingUser(
		input: IEmailInput & Partial<IPasswordInput>
	): Promise<ICheckUserExist> {
		try {
			const { API_KEY, API_SECRET } = apiSecretKeys();

			const isExists: IEmailCheckResponse = (
				await this._serverFetchService.apiFetch({
					method: 'POST',
					path: '/auth/email-check',
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

	async getCsrfToken(): Promise<{ csrf_token: string }> {
		return {
			csrf_token:
				'VewsJqujUGoIJKA7iTvbqmirySLbzFJVqha7Nxk5U39DCNfk2OLvCxQWYzPymhK4'
		};
	}
}
