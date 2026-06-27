import {
    Injectable,
    CanActivate,
    ExecutionContext,
    SetMetadata,
    UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { decodeToken } from '../api-fetch/token.helper';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// Check if route is marked as public
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();

		const tokenChunks: string[] = [];
		let index = 0;

		while (request.cookies[`auth-proxy-plane-token-${index}`]) {
			tokenChunks.push(
				request.cookies[`auth-proxy-plane-token-${index}`]
			);
			index++;
		}

		const token = tokenChunks.join('');

		// Reject when no session token is present, or when it is structurally
		// malformed. Respond 401 (which the Plane SPA handles by routing to sign-in)
		// rather than redirecting to a client-controlled `Referer` or a request-scoped
		// URL — either would be an open redirect. Cryptographic signature/expiry are
		// enforced upstream by Gauzy (which owns the JWT secret) and, for the integrated
		// mount, by the host's tenant resolver; this is an edge-level sanity check.
		if (!token || !decodeToken(token)) {
			throw new UnauthorizedException('Authentication required');
		}

		return true;
	}
}
