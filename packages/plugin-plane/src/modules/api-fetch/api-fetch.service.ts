import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { IServerFetchInputs } from '@plane-plugin/models';
import { EXTERNAL_BASE_API_URL } from '../../config';
import { getCurrentTenantId } from './token.helper';

@Injectable()
export class ApiFetchService {
	private static token: string;

	constructor(private readonly _httpService: HttpService) {}

	setToken(token: string) {
		ApiFetchService.token = token;
	}

	static getToken(): string {
		return ApiFetchService.token;
	}

	async apiFetch(configs: IServerFetchInputs) {
		const {
			method,
			path,
			body,
			query,
			customHeaders,
			bearer_token,
			tenantId,
			init
		} = configs;

		const apiUrl = EXTERNAL_BASE_API_URL();
		let endPoint = apiUrl + path;

		if (query) {
			endPoint = `${apiUrl + path}?${query}`;
		}

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Authorization: `Bearer ${bearer_token || ApiFetchService.token}`
		};

		if (tenantId) {
			headers['Tenant-Id'] = tenantId;
		} else {
			headers['Tenant-Id'] = getCurrentTenantId();
		}

		const datas: { body?: string } = {};
		if (body) {
			datas['body'] = JSON.stringify(body);
		}

		switch (method) {
			case 'GET':
				return await firstValueFrom(
					this._httpService.get(endPoint, {
						...(init || {}),
						headers: {
							...headers,
							...customHeaders
						}
					})
				);

			case 'POST':
				return await firstValueFrom(
					this._httpService.post(endPoint, body, {
						...(init || {}),
						headers: {
							...headers,
							...customHeaders
						}
					})
				);

			case 'PUT':
				return await firstValueFrom(
					this._httpService.put(endPoint, body, {
						...(init || {}),
						headers: {
							...headers,
							...customHeaders
						}
					})
				);

			case 'DELETE':
				return await firstValueFrom(
					this._httpService.delete(endPoint, {
						...(init || {}),
						headers: {
							...headers,
							...customHeaders
						}
					})
				);
			default:
				throw new BadRequestException('Method not accepted');
		}
	}
}
