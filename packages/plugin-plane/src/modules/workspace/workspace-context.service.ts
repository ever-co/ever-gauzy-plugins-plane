import { Injectable } from '@nestjs/common';
import { RequestContextService } from '../../request-context';

@Injectable()
export class WorkspaceContextService {
	private static workspaceSlug: string;

	/**
	 * Mapping of organizationId → tenantId.
	 * Populated by getMyWorkspaces(), consumed by WorkspaceMiddleware
	 * to detect cross-tenant workspace switches.
	 */
	private static orgTenantMap: Map<string, string> = new Map();

	/**
	 * @description Set the current workspace slug
	 * @param {string} slug - The workspace slug
	 */
	static setWorkspaceSlug(slug: string) {
		RequestContextService.setWorkspaceSlug(slug);
		WorkspaceContextService.workspaceSlug = slug;
	}

	/**
	 * @description Get the current workspace slug
	 * @returns {string} The current workspace slug
	 */
	static getCurrentWorkspaceSlug(): string {
		return RequestContextService.getWorkspaceSlug()
			|| WorkspaceContextService.workspaceSlug
			|| '';
	}

	/**
	 * Store the mapping of an organizationId to its tenantId.
	 */
	static setOrgTenantMapping(orgId: string, tenantId: string) {
		WorkspaceContextService.orgTenantMap.set(orgId, tenantId);
	}

	/**
	 * Get the tenantId for a given organizationId.
	 */
	static getTenantForOrg(orgId: string): string | null {
		return WorkspaceContextService.orgTenantMap.get(orgId) || null;
	}

	/**
	 * Clear all org→tenant mappings.
	 */
	static clearOrgTenantMappings() {
		WorkspaceContextService.orgTenantMap.clear();
	}
}
