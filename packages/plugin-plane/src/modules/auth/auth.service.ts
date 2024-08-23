import { Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	CheckUserExistEnum,
	ICheckUserExist,
	IEmailInput,
	IPasswordInput,
} from '@plane-plugin/models';

@Injectable()
export class AuthService {
	constructor(private readonly _serverFetchService: ApiFetchService) {}
	async checkExistingUser(
		payload: IEmailInput & Partial<IPasswordInput>,
	): Promise<ICheckUserExist> {
		console.log(payload);
		// try {
		// 	const user = await this._serverFetchService.apiFetch({
		// 		method: 'POST',
		// 		path: '/auth/login',
		// 		body: { email: payload.email, password: 'admine' },
		// 	});

		// 	console.log(user.data);

		// 	if (!user.data) {
		// 		return { existing: false, status: CheckUserExist.MAGIC_CODE };
		// 	}
		return { existing: true, status: CheckUserExistEnum.CREDENTIALS };
		// } catch (error) {
		// 	return { existing: false, status: CheckUserExist.MAGIC_CODE };
		// }
	}

	async getCsrfToken(): Promise<{ csrf_token: string }> {
		return {
			csrf_token:
				'VewsJqujUGoIJKA7iTvbqmirySLbzFJVqha7Nxk5U39DCNfk2OLvCxQWYzPymhK4',
		};
	}
}
