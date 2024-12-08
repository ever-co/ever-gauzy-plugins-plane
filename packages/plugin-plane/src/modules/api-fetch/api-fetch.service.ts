import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { IServerFetchInputs } from '@plane-plugin/models';
import {
	defaultTestTenantId,
	defaultTestToken,
	EXTERNAL_BASE_API_URL
} from '../../config';

@Injectable()
export class ApiFetchService {
	constructor(private readonly _httpService: HttpService) {}
	async apiFetch(configs: IServerFetchInputs) {
		const { method, path, body, bearer_token, query, tenantId, init } =
			configs;

		const apiUrl = EXTERNAL_BASE_API_URL();
		let endPoint = apiUrl + path;

		if (query) {
			endPoint = `${apiUrl + path}?${query}`;
		}

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};

		if (bearer_token) {
			headers['Authorization'] = `Bearer ${bearer_token}`;
		} else {
			headers['Authorization'] = `Bearer ${defaultTestToken()}`;
		}

		if (tenantId) {
			headers['Tenant-Id'] = tenantId;
		} else {
			headers['Tenant-Id'] = defaultTestTenantId();
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
							...headers
						}
					})
				);

			case 'POST':
				return await firstValueFrom(
					this._httpService.post(endPoint, body, {
						...(init || {}),
						headers: {
							...headers
						}
					})
				);

			case 'PUT':
				return await firstValueFrom(
					this._httpService.put(endPoint, body, {
						...(init || {}),
						headers: {
							...headers
						}
					})
				);

			case 'DELETE':
				return await firstValueFrom(
					this._httpService.delete(endPoint, {
						...(init || {}),
						headers: {
							...headers
						}
					})
				);
			default:
				throw new BadRequestException('Method not accepted');
		}
	}
}
