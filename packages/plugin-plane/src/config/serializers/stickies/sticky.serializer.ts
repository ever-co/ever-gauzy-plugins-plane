import {
	ID,
	ISticky,
	IStickyCreateInput,
	IStickyUpdateInput,
	ITask
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	currentEmployeeId,
	getCurrentOrganizationSlug
} from '../../credentials';

/**
 * Metadata stored inside Gauzy Task.description as JSON string.
 * Carries the Plane Sticky visual properties that don't map to native Task fields.
 */
interface StickyMeta {
	description?: Record<string, any>;
	description_html?: string;
	color?: string | null;
	background_color?: string | null;
	logo_props?: Record<string, any>;
	sort_order?: number;
}

/**
 * Safely parses the task description as a StickyMeta JSON envelope.
 */
function parseStickyMeta(description?: string | null): StickyMeta {
	if (!description) return {};
	try {
		return JSON.parse(description);
	} catch {
		// Legacy or plain-text description – wrap it
		return { description_html: description };
	}
}

/**
 * Transforms a Gauzy Task (issueType='memo', projectId=null) into a Plane Sticky.
 */
export function stickyTransformer(task: ITask): ISticky;
export function stickyTransformer(tasks: ITask[]): ISticky[];
export function stickyTransformer(input: ITask | ITask[]): ISticky | ISticky[] {
	if (Array.isArray(input)) {
		return input.map((t) => transformOne(t));
	}
	return transformOne(input);
}

function transformOne(task: ITask): ISticky {
	const meta = parseStickyMeta(task.description);

	return {
		id: task.id,
		name: task.title ?? null,
		description: meta.description ?? {},
		description_html: meta.description_html ?? '<p></p>',
		description_stripped: stripTags(meta.description_html),
		color: meta.color ?? null,
		background_color: meta.background_color ?? null,
		logo_props: meta.logo_props ?? {},
		sort_order: meta.sort_order ?? 65535,
		workspace_id: task.organizationId,
		owner_id: task.createdByUserId ?? currentEmployeeId() ?? undefined,
		created_at: task.createdAt,
		updated_at: task.updatedAt
	};
}

/**
 * Strip HTML tags to produce description_stripped.
 */
function stripTags(html?: string | null): string | null {
	if (!html) return null;
	return html.replace(/<[^>]*>/g, '').trim() || null;
}

/**
 * Transforms a Plane Sticky create input into a Gauzy Task create body.
 */
export function stickyCreateInputTransformer(input: IStickyCreateInput): Record<string, any> {
	const meta: StickyMeta = {
		description: input.description,
		description_html: input.description_html,
		color: input.color,
		background_color: input.background_color,
		logo_props: input.logo_props,
		sort_order: input.sort_order ?? 65535
	};

	return {
		title: input.name ?? '',
		description: JSON.stringify(meta),
		issueType: 'memo',
		// projectId is intentionally omitted (null) — workspace-level task
		organizationId: getCurrentOrganizationSlug()
	};
}

/**
 * Transforms a Plane Sticky update input into a Gauzy Task partial update body.
 */
export function stickyUpdateInputTransformer(
	input: IStickyUpdateInput,
	existingDescription?: string | null
): Record<string, any> {
	const existingMeta = parseStickyMeta(existingDescription);

	const meta: StickyMeta = {
		description: input.description ?? existingMeta.description,
		description_html: input.description_html ?? existingMeta.description_html,
		color: input.color !== undefined ? input.color : existingMeta.color,
		background_color: input.background_color !== undefined ? input.background_color : existingMeta.background_color,
		logo_props: input.logo_props ?? existingMeta.logo_props,
		sort_order: input.sort_order ?? existingMeta.sort_order
	};

	const body: Record<string, any> = {
		description: JSON.stringify(meta)
	};

	if (input.name !== undefined) {
		body.title = input.name ?? '';
	}

	return body;
}
