import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiFetchService } from './api-fetch.service';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
	constructor(private readonly apiFetchService: ApiFetchService) {}

	use(req: Request, res: Response, next: NextFunction) {
		const tokenChunks: string[] = [];
		let index = 0;

		while (req.cookies[`auth-proxy-plane-token-${index}`]) {
			tokenChunks.push(req.cookies[`auth-proxy-plane-token-${index}`]);
			index++;
		}

		const token = tokenChunks.join('');

		if (token) {
			this.apiFetchService.setToken(token);
		}

		next();
	}
}
