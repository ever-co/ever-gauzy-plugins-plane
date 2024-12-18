import { Injectable } from '@nestjs/common';
import {
	CheckUserExistEnum,
	ICheckUserExist,
	IEmailInput,
	IPasswordInput
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class AuthService {
	constructor(private readonly _serverFetchService: ApiFetchService) {}
	async checkExistingUser(
		input: IEmailInput & Partial<IPasswordInput>
	): Promise<ICheckUserExist> {
		try {
			const user = await this._serverFetchService.apiFetch({
				method: 'POST',
				path: '/auth/validate-by-email',
				body: { email: input.email }
			});

			console.log(user.data);

			if (!user.data) {
				return {
					existing: false,
					status: CheckUserExistEnum.MAGIC_CODE
				};
			}
			return { existing: true, status: CheckUserExistEnum.CREDENTIALS };
		} catch (error) {
			console.log(error);
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
