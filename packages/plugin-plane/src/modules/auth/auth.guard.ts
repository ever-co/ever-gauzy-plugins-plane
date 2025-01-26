import {
	Injectable,
	CanActivate,
	ExecutionContext,
	SetMetadata
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// Check if route is marked as public
		const isPublic = this.reflector.get<boolean>(
			IS_PUBLIC_KEY,
			context.getHandler()
		);

		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();
		const response = context.switchToHttp().getResponse<Response>();

		const tokenChunks: string[] = [];
		let index = 0;

		while (request.cookies[`auth-proxy-plane-token-${index}`]) {
			tokenChunks.push(
				request.cookies[`auth-proxy-plane-token-${index}`]
			);
			index++;
		}

		const token = tokenChunks.join('');

		if (!token) {
			response.redirect('http://localhost');
			return false;
		}

		return true;
	}
}
