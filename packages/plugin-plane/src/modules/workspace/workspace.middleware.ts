import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WorkspaceContextService } from './workspace-context.service';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { getCurrentTenantId } from '../api-fetch/token.helper';
import { sendTokenChunks, clearTokenChuncks } from '../../config';

@Injectable()
export class WorkspaceMiddleware implements NestMiddleware {
	private readonly logger = new Logger(WorkspaceMiddleware.name);

	constructor(private readonly apiFetchService: ApiFetchService) {}

	async use(req: Request, res: Response, next: NextFunction) {
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

			// Detect cross-tenant workspace switch
			await this.handleTenantSwitch(workspaceName, req, res);
		}

		next();
	}

	/**
	 * Detects if the selected workspace belongs to a different tenant
	 * and performs an automatic tenant switch via Gauzy's /auth/switch-workspace.
	 *
	 * When the switch succeeds, the new JWT is stored in the static token holder
	 * AND sent back to the browser as cookies so subsequent requests are
	 * authenticated for the new tenant.
	 */
	private async handleTenantSwitch(
		orgId: string,
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const targetTenantId =
				WorkspaceContextService.getTenantForOrg(orgId);
			if (!targetTenantId) {
				return; // Unknown org — mapping not loaded yet
			}

			const currentTenant = getCurrentTenantId();
			if (!currentTenant || currentTenant === targetTenantId) {
				return; // Same tenant — no switch needed
			}

			this.logger.log(
				`Switching tenant: ${currentTenant} → ${targetTenantId} (org: ${orgId})`
			);

			// Call Gauzy's POST /auth/switch-workspace
			const response = (
				await this.apiFetchService.apiFetch({
					method: 'POST',
					path: '/auth/switch-workspace',
					body: { tenantId: targetTenantId }
				})
			).data;

			if (response?.token) {
				// Update the static token used for subsequent API calls
				this.apiFetchService.setToken(response.token);

				// Update the browser cookies so the frontend sends the new token
				clearTokenChuncks(req, res);
				sendTokenChunks(response.token, res);

				this.logger.log(
					`Tenant switch successful → ${targetTenantId}`
				);
			}
		} catch (error: any) {
			this.logger.warn(
				`Tenant switch failed for org ${orgId}: ${error?.response?.data?.message || error?.message}`
			);
		}
	}
}
