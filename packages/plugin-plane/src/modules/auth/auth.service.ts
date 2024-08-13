import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
  CheckUserExist,
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
		try {
			const user = await this._serverFetchService.apiFetch({
				method: 'POST',
				path: '/auth/login',
				body: { email: payload.email, password: '1234' },
			});
      
			if (!user) {
				return { existing: false, status: CheckUserExist.MAGIC_CODE };
			}
			return { existing: true, status: CheckUserExist.CREDENTIALS };
		} catch (error) {
			throw new BadRequestException(error);
		}
	}
}
