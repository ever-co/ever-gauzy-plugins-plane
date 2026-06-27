import { HttpService } from '@nestjs/axios';
import {
	BadRequestException,
	ForbiddenException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	UnauthorizedException,
	UnprocessableEntityException
} from '@nestjs/common';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { IServerFetchInputs } from '@ever-gauzy/plugin-integration-plane-models';
import { PlaneConfigRegistry } from '../../plane-config.registry';
import { RequestContextService } from '../../request-context';
import { getCurrentTenantId } from './token.helper';

@Injectable()
export class ApiFetchService {
	/** Fallback token for non-request contexts (tests, scripts). */
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
	 * Set the token for the API fetch service.
	 * Writes to the per-request AsyncLocalStorage context when available,
	 * and always updates the static fallback for non-request callers.
	 * @param token - The JWT token to set
	 */
	setToken(token: string) {
		RequestContextService.setToken(token);
		ApiFetchService.token = token;
	}

	/**
	 * Get the token for the API fetch service.
	 *
	 * When inside a request context (ALS store active), returns the
	 * request-scoped token — even if empty — to avoid leaking another
	 * user's token via the static fallback.
	 *
	 * Falls back to the static token only when called outside a request
	 * (tests, scripts, background jobs).
	 *
	 * @returns The JWT token
	 */
	static getToken(): string {
		if (RequestContextService.hasActiveStore()) {
			return RequestContextService.getToken();
		}
		return ApiFetchService.token;
	}

	/**
	 * Extracts the real HTTP status and message from an upstream API error
	 * and throws the corresponding NestJS HttpException.
	 *
	 * This preserves the original status code (401, 403, 404, 500 …)
	 * instead of always returning 400 Bad Request.
	 *
	 * @param error - The caught error (AxiosError, HttpException, or unknown)
	 * @throws {HttpException} Always — this method never returns.
	 */
	protected handleApiError(error: unknown): never {
		// Already a NestJS HttpException (e.g. thrown by a nested service call)
		if (error instanceof HttpException) {
			throw error;
		}

		// Axios error with a response from the upstream API
		if (isAxiosError(error) && error.response) {
			const { status, data } = error.response;
			const message =
				data?.message || data?.error || error.message || 'Unknown upstream error';

			this.logger.error(
				`Upstream API error [${status}]: ${typeof message === 'string' ? message : JSON.stringify(message)}`,
				error.stack
			);

			switch (status) {
				case 401:
					throw new UnauthorizedException(message);
				case 403:
					throw new ForbiddenException(message);
				case 404:
					throw new NotFoundException(message);
				case 422:
					throw new UnprocessableEntityException(message);
				default:
					if (status >= 500) {
						throw new InternalServerErrorException(message);
					}
					throw new BadRequestException(message);
			}
		}

		// Network error / timeout (no response received)
		if (isAxiosError(error) && !error.response) {
			this.logger.error(
				`Upstream API unreachable: ${error.message}`,
				error.stack
			);
			throw new InternalServerErrorException(
				`Upstream API unreachable: ${error.message}`
			);
		}

		// Unknown error
		const msg = error instanceof Error ? error.message : String(error);
		this.logger.error(`Unexpected error: ${msg}`);
		throw new InternalServerErrorException(msg);
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

		const isBinaryRequest = responseType === 'arraybuffer';
		const headers: HeadersInit = {
			'Content-Type': isBinaryRequest ? 'application/octet-stream' : 'application/json',
			Accept: isBinaryRequest ? 'application/octet-stream' : 'application/json',
			Authorization: `Bearer ${bearer_token || ApiFetchService.getToken()}`
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
