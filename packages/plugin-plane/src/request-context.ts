import { AsyncLocalStorage } from 'async_hooks';
import type { IncomingMessage } from 'http';

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
	clientAddressHeaders: Record<string, string>;
}

/**
 * The headers that tell the Gauzy API which address a request came from, as it reads them:
 * `X-Forwarded-For` (the socket address when the request came without one) and `CF-Connecting-IP`.
 *
 * The proxy mounted inside the Gauzy API calls it over loopback, so without these every call it makes
 * would come from 127.0.0.1 and share one rate-limit and sign-in-attempt bucket. Passed on unchanged,
 * they make Gauzy resolve the same client for the proxy's call as for the browser's own request when it
 * trusts a number of proxy hops (`TRUST_PROXY`, 1 by default: the loopback hop then stands in for the hop
 * the request came through) or `CF-Connecting-IP`. A client gains nothing by sending them: it could send
 * the same headers to Gauzy directly.
 *
 * @param req - The incoming request.
 * @returns The headers to send with every call made while handling it.
 */
export function clientAddressHeaders(
	req: IncomingMessage
): Record<string, string> {
	const headers: Record<string, string> = {};

	const forwardedFor = req.headers['x-forwarded-for'];
	const forwarded = Array.isArray(forwardedFor)
		? forwardedFor.join(', ')
		: forwardedFor;
	const address = forwarded || req.socket?.remoteAddress;
	if (address) {
		headers['X-Forwarded-For'] = address;
	}

	const connectingIp = req.headers['cf-connecting-ip'];
	if (typeof connectingIp === 'string' && connectingIp) {
		headers['CF-Connecting-IP'] = connectingIp;
	}

	return headers;
}

const requestContextStore = new AsyncLocalStorage<RequestContext>();

export class RequestContextService {
	/** Expose the raw store so `main.ts` and `mount.ts` can call `.run()`. */
	static get store(): AsyncLocalStorage<RequestContext> {
		return requestContextStore;
	}

	/**
	 * Returns `true` when executing inside a request context
	 * (i.e. `store.run()` has been called), even if the context values are empty.
	 * Used by callers to distinguish "no token was set for this request"
	 * from "we're not in a request at all" (tests, scripts).
	 */
	static hasActiveStore(): boolean {
		return requestContextStore.getStore() !== undefined;
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

	// ── Client address ───────────────────────────────────────────────────

	/**
	 * The client-address headers of the current request (see {@link clientAddressHeaders}).
	 * Empty outside a request context, and when the context was created without a request.
	 */
	static getClientAddressHeaders(): Record<string, string> {
		return requestContextStore.getStore()?.clientAddressHeaders ?? {};
	}

	// ── Factory ──────────────────────────────────────────────────────────

	/**
	 * Create a fresh RequestContext for use with `store.run()`.
	 *
	 * @param req - The incoming request, whose client-address headers every call to Gauzy then carries.
	 */
	static createContext(req?: IncomingMessage): RequestContext {
		return {
			token: '',
			workspaceSlug: '',
			clientAddressHeaders: req ? clientAddressHeaders(req) : {}
		};
	}
}
