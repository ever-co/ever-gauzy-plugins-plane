import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkspaceContextService {
	private static workspaceSlug: string;

	static setWorkspaceSlug(slug: string) {
		WorkspaceContextService.workspaceSlug = slug;
	}

	static getCurrentWorkspaceSlug(): string {
		if (!WorkspaceContextService.workspaceSlug) {
			return '';
		}
		return WorkspaceContextService.workspaceSlug;
	}
}
