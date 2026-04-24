import { AsyncLocalStorage } from 'async_hooks';

/**
 * Per-request context that holds the JWT token and workspace slug.
 *
 * In standalone mode, the store is initialized by an Express middleware
 * added in `main.ts`.
 * In integrated mode, the store is initialized by `mount.ts` before
 * delegating to the proxy handler.
 *
 * When no store is active (tests, scripts, background jobs), all getters
 * return empty strings and setters are no-ops — callers fall back to
 * the static class variables that existed before this change.
 */
interface RequestContext {
	token: string;
	workspaceSlug: string;
}

const requestContextStore = new AsyncLocalStorage<RequestContext>();

export class RequestContextService {
	/** Expose the raw store so `main.ts` and `mount.ts` can call `.run()`. */
	static get store(): AsyncLocalStorage<RequestContext> {
		return requestContextStore;
	}

	// ── Token ────────────────────────────────────────────────────────────

	/**
	 * Read the JWT token scoped to the current request.
	 * Returns an empty string when called outside a request context.
	 */
	static getToken(): string {
		return requestContextStore.getStore()?.token ?? '';
	}

	/**
	 * Store the JWT token in the current request context.
	 * No-op when called outside a request context.
	 */
	static setToken(token: string): void {
		const ctx = requestContextStore.getStore();
		if (ctx) {
			ctx.token = token;
		}
	}

	// ── Workspace slug ───────────────────────────────────────────────────

	/**
	 * Read the workspace slug (organization ID) scoped to the current request.
	 * Returns an empty string when called outside a request context.
	 */
	static getWorkspaceSlug(): string {
		return requestContextStore.getStore()?.workspaceSlug ?? '';
	}

	/**
	 * Store the workspace slug in the current request context.
	 * No-op when called outside a request context.
	 */
	static setWorkspaceSlug(slug: string): void {
		const ctx = requestContextStore.getStore();
		if (ctx) {
			ctx.workspaceSlug = slug;
		}
	}

	// ── Factory ──────────────────────────────────────────────────────────

	/**
	 * Create a fresh, empty RequestContext for use with `store.run()`.
	 */
	static createContext(): RequestContext {
		return { token: '', workspaceSlug: '' };
	}
}
