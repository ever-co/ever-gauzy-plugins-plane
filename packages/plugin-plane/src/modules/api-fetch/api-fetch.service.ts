import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { IServerFetchInputs } from '@ever-gauzy/plugin-integration-plane-models';
import { PlaneConfigRegistry } from '../../plane-config.registry';
import { getCurrentTenantId } from './token.helper';

@Injectable()
export class ApiFetchService {
	private static token: string;
	private _logger!: Logger;

	constructor(private readonly _httpService: HttpService) {}

	/**
	 * Lazy-initialized logger that automatically uses the child class name as context.
	 * This allows all services extending ApiFetchService to have a properly contextualized logger
	 * without manual instantiation.
	 */
	protected get logger(): Logger {
		if (!this._logger) {
			this._logger = new Logger(this.constructor.name);
		}
		return this._logger;
	}

	/**
	 * Set the token for the API fetch service
	 * @param token - The token to set
	 */
	setToken(token: string) {
		ApiFetchService.token = token;
	}

	/**
	 * Get the token for the API fetch service
	 * @returns The token
	 */
	static getToken(): string {
		return ApiFetchService.token;
	}

	/**
	 * Fetch data from the API
	 * @param configs - The configurations for the API fetch
	 * @returns The data from the API
	 */
	async apiFetch(configs: IServerFetchInputs) {
		const {
			method,
			path,
			body,
			query,
			customHeaders,
			bearer_token,
			tenantId,
			responseType,
			init
		} = configs;

		const apiUrl = PlaneConfigRegistry.externalBaseApiUrl;
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
					},
					responseType
				} as any)
				);

			case 'POST':
				return await firstValueFrom(
				this._httpService.post(endPoint, body, {
					...(init || {}),
					headers: {
						...headers,
						...customHeaders
					},
					responseType
				} as any)
				);

			case 'PUT':
				return await firstValueFrom(
				this._httpService.put(endPoint, body, {
					...(init || {}),
					headers: {
						...headers,
						...customHeaders
					},
					responseType
				} as any)
				);

			case 'PATCH':
				return await firstValueFrom(
				this._httpService.patch(endPoint, body, {
					...(init || {}),
					headers: {
						...headers,
						...customHeaders
					},
					responseType
				} as any)
				);

			case 'DELETE':
				return await firstValueFrom(
				this._httpService.delete(endPoint, {
					...(init || {}),
					headers: {
						...headers,
						...customHeaders
					},
					responseType
				} as any)
				);
			default:
				throw new BadRequestException('Method not accepted');
		}
	}
}
