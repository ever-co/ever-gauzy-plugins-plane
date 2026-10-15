import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    SetMetadata,
    UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { decodeToken } from '../api-fetch/token.helper';
import { readSessionTokenFromCookies } from '../../config/utils/session-cookie.utils';
import { USER_NOT_EMPLOYEE_ERROR_CODE, USER_NOT_EMPLOYEE_MESSAGE } from '../../config/constants';

export const IS_PUBLIC_KEY = 'isPublic';

/** Workspace-scoped proxy routes: `/api/workspaces/<slug>/…` (after the mount prefix is stripped). */
const WORKSPACE_ROUTE = /^\/api\/workspaces\/[^/]+\//;
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

		const token = readSessionTokenFromCookies(request.cookies);

		// Reject when no session token is present, or when it is structurally
		// malformed. Respond 401 (which the Plane SPA handles by routing to sign-in)
		// rather than redirecting to a client-controlled `Referer` or a request-scoped
		// URL — either would be an open redirect. Cryptographic signature/expiry are
		// enforced upstream by Gauzy (which owns the JWT secret) and, for the integrated
		// mount, by the host's tenant resolver; this is an edge-level sanity check.
		const payload = token ? decodeToken(token) : null;
		if (!token || !payload) {
			throw new UnauthorizedException('Authentication required');
		}

		// ever-gauzy fork: Ever Gauzy PM is employees-only. Sign-in already refuses a
		// Gauzy user without an employee profile; this also covers sessions created
		// before that gate, on every workspace-scoped route. User-level routes
		// (`/api/users/me…`) stay reachable: they return only the user's own profile and
		// organization list, which the Plane UI needs to render its "Employees only" screen.
		if (!payload.employeeId && WORKSPACE_ROUTE.test(request.path ?? '')) {
			throw new ForbiddenException({
				statusCode: 403,
				error_code: USER_NOT_EMPLOYEE_ERROR_CODE,
				message: USER_NOT_EMPLOYEE_MESSAGE
			});
		}

		return true;
	}
}
