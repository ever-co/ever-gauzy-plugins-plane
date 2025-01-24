import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WorkspaceContextService } from './workspace-context.service';

@Injectable()
export class WorkspaceMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const urlParts = req.url.split('/').filter(Boolean);
		const workspaceNameIndex = urlParts.indexOf('workspaces') + 1;
		let workspaceName =
			req.params.workspace_name ||
			(workspaceNameIndex > 0 ? urlParts[workspaceNameIndex] : null);

		if (workspaceName === 'file-assets') {
			const otherParams = req.params['0'].split('/');
			workspaceName = otherParams[0];
		}

		if (workspaceName) {
			WorkspaceContextService.setWorkspaceSlug(workspaceName);
		}

		next();
	}
}
