import { ICreatePageInput, ID, IPage, IUpdatePageInput } from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { getCurrentOrganizationSlug } from '../../credentials';

// ─── Input Transformers (Plane → Gauzy body) ─────────────────────────────────

/**
 * Transform a Plane create page input into a Gauzy article create body
 * (plain object sent as JSON via HTTP).
 */
export function createPageInputTransformer(
	input: ICreatePageInput
): Record<string, any> {
	return {
		name: input.name,
		description: input.description,
		descriptionHtml: input.description_html,
		descriptionJson: input.description_json,
		privacy: input.access === 1,
		color: input.color ?? null,
		parentId: input.parent ?? null,
		index: input.sort_order ?? 0,
		organizationId: getCurrentOrganizationSlug()
	};
}

/**
 * Transform a Plane update page input into a Gauzy article update body.
 * Only includes defined fields (partial update).
 */
export function updatePageInputTransformer(
	input: IUpdatePageInput
): Record<string, any> {
	const result: Record<string, any> = {};

	if (input.name !== undefined) result['name'] = input.name;
	if (input.description !== undefined) result['description'] = input.description;
	if (input.description_html !== undefined) result['descriptionHtml'] = input.description_html;
	if (input.description_json !== undefined) result['descriptionJson'] = input.description_json;
	if (input.access !== undefined) result['privacy'] = input.access === 1;
	if (input.color !== undefined) result['color'] = input.color;
	if (input.parent !== undefined) result['parentId'] = input.parent ?? null;
	if (input.sort_order !== undefined) result['index'] = input.sort_order;
	if (input.is_locked !== undefined) result['isLocked'] = input.is_locked;
	if (input.archived_at !== undefined) {
		result['archivedAt'] = input.archived_at ?? null;
	}

	return result;
}

// ─── Output Transformers (Gauzy response → Plane IPage) ──────────────────────

/**
 * Transform a single Gauzy HelpCenterArticle (plain JSON) into a Plane IPage.
 */
export function articleToPage(article: Record<string, any>): IPage {
	return {
		id: article['id'],
		name: article['name'],
		description: article['description'],
		description_html: article['descriptionHtml'],
		description_json: article['descriptionJson'],
		access: article['privacy'] ? 1 : 0,
		is_locked: article['isLocked'] ?? false,
		archived_at: article['archivedAt'] ?? null,
		color: article['color'],
		parent: article['parentId'] ?? null,
		owned_by: article['ownedById'],
		workspace: article['organizationId'],
		projects: (article['projects'] ?? []).map((p: any) =>
			typeof p === 'string' ? p : p?.id
		),
		labels: (article['tags'] ?? []).map((t: any) =>
			typeof t === 'string' ? t : t?.id
		),
		sort_order: article['index'],
		external_id: article['externalId'] ?? null,
		created_at: article['createdAt'],
		updated_at: article['updatedAt']
	};
}

/**
 * Transform Gauzy articles to Plane pages (single or array).
 */
export function articlesToPages(
	articles: Record<string, any> | Record<string, any>[]
): IPage | IPage[] {
	if (Array.isArray(articles)) {
		return articles.map(articleToPage);
	}
	return articleToPage(articles);
}

// ─── Query Builders ───────────────────────────────────────────────────────────

/**
 * Build query params for GET /help-center-article requests.
 */
export function getPagesQuery(
	projectId?: ID,
	extraWhere?: Record<string, string>
): Record<string, string> {
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery(),
		...extraWhere
	};

	if (projectId) {
		query['where[projectId]'] = projectId;
	}

	// Load projects and tags relations to have them in the response
	query['relations[0]'] = 'projects';
	query['relations[1]'] = 'tags';

	return query;
}
