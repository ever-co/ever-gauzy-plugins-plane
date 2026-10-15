import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiFetchService } from './api-fetch.service';
import { readSessionTokenFromCookies } from '../../config/utils/session-cookie.utils';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
	constructor(private readonly apiFetchService: ApiFetchService) {}

	use(req: Request, res: Response, next: NextFunction) {
		const token = readSessionTokenFromCookies(req.cookies);

		if (token) {
			this.apiFetchService.setToken(token);
		}

		next();
	}
}
