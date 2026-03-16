import { decode } from 'jsonwebtoken';
import { Logger } from '@nestjs/common';
import { IDecodedToken } from '@ever-gauzy/plugin-integration-plane-models';
import { ApiFetchService } from './api-fetch.service';

const logger = new Logger('TokenHelper');

/**
 * Decode a JWT token and return the payload
 * @param token JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): IDecodedToken | null {
	try {
		return decode(token) as IDecodedToken;
	} catch (error) {
		logger.error(
			'Error decoding token',
			error instanceof Error ? error.stack : String(error)
		);
		return null;
	}
}

/**
 * Get the employee ID from the current token
 * @returns Employee ID from token or null if not found
 */
export function getCurrentEmployeeId(): string | null {
	const token = ApiFetchService.getToken();
	if (!token) return null;

	const decoded = decodeToken(token);
	return decoded?.employeeId || null;
}

/**
 * Get the user ID from the current token
 * @returns User ID from token or null if not found
 */
export function getCurrentUserId(defaultToken?: string): string | null {
	const token = defaultToken || ApiFetchService.getToken();
	if (!token) return null;

	const decoded = decodeToken(token);
	return decoded?.id || null;
}

/**
 * Get the current tenant ID from the token
 * @returns The tenant ID from the token
 */
export function getCurrentTenantId(): string {
	const token = ApiFetchService.getToken();
	if (!token) return '';

	const decoded = decodeToken(token);
	return decoded?.tenantId || '';
}
