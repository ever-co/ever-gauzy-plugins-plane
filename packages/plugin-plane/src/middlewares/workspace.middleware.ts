import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// Middleware for dynamic workspace name injection into request
export class WorkspaceNameMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const workspaceName = req.params.workspace_name;
		if (workspaceName) {
			req['workspaceName'] = workspaceName;
		}
		next();
	}
}
