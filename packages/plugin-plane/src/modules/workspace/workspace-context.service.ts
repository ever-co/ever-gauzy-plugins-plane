import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkspaceContextService {
	private static workspaceSlug: string;

	/**
	 * @description Set the current workspace slug
	 * @param {string} slug - The workspace slug
	 */
	static setWorkspaceSlug(slug: string) {
		WorkspaceContextService.workspaceSlug = slug;
	}

	/**
	 * @description Get the current workspace slug
	 * @returns {string} The current workspace slug
	 */
	static getCurrentWorkspaceSlug(): string {
		if (!WorkspaceContextService.workspaceSlug) {
			return '';
		}
		return WorkspaceContextService.workspaceSlug;
	}
}
