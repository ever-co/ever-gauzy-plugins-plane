import * as zlib from 'zlib';

/**
 * Name prefix of the chunked session cookies (`auth-proxy-plane-token-0`, `-1`, ...).
 */
export const SESSION_COOKIE_PREFIX = 'auth-proxy-plane-token-';

/**
 * Marker of a compact session value. A legacy value is the raw JWT, whose first
 * segment is base64url JSON (`eyJ...`), so it can never start with this marker.
 */
const COMPACT_SESSION_PREFIX = 'z1.';

/**
 * Upper bound for an inflated JWT payload. The cookie is client-controlled, so a
 * forged value must not be able to inflate into a decompression bomb.
 */
const MAX_INFLATED_PAYLOAD_BYTES = 256 * 1024;

/**
 * Encodes a Gauzy JWT into the compact session cookie value.
 *
 * Gauzy embeds the role's permissions in the access token, so an admin JWT is
 * ~11.5 KB (3 cookie chunks, ~12 KB of Set-Cookie headers). Deflating the payload
 * brings it to ~3.3 KB (1 chunk). The header and signature are kept verbatim so
 * that `decodeSessionToken` rebuilds the exact token Gauzy signed.
 *
 * Falls back to the raw token when it is not a JWT, when the compact form is not
 * smaller, or when it does not decode back to the identical token.
 *
 * @param token - The Gauzy access JWT.
 * @returns The value to store in the session cookie chunks.
 */
export function encodeSessionToken(token: string): string {
	const parts = token.split('.');
	if (parts.length !== 3) {
		return token;
	}

	const [header, payload, signature] = parts;
	try {
		const compressed = zlib
			.deflateRawSync(Buffer.from(payload, 'base64url'), {
				level: zlib.constants.Z_BEST_COMPRESSION
			})
			.toString('base64url');
		const encoded = `${COMPACT_SESSION_PREFIX}${header}.${compressed}.${signature}`;

		return encoded.length < token.length &&
			decodeSessionToken(encoded) === token
			? encoded
			: token;
	} catch {
		return token;
	}
}

/**
 * Decodes a session cookie value back into the Gauzy JWT.
 *
 * Accepts both the compact form written by `encodeSessionToken` and the legacy
 * raw JWT, so sessions created before the compact form keep working.
 *
 * @param value - The joined session cookie chunks.
 * @returns The JWT, or `undefined` when the value is empty or malformed.
 */
export function decodeSessionToken(
	value: string | undefined
): string | undefined {
	if (!value) {
		return undefined;
	}
	if (!value.startsWith(COMPACT_SESSION_PREFIX)) {
		return value;
	}

	const parts = value.slice(COMPACT_SESSION_PREFIX.length).split('.');
	if (parts.length !== 3) {
		return undefined;
	}

	const [header, compressed, signature] = parts;
	try {
		const payload = zlib
			.inflateRawSync(Buffer.from(compressed, 'base64url'), {
				maxOutputLength: MAX_INFLATED_PAYLOAD_BYTES
			})
			.toString('base64url');

		return `${header}.${payload}.${signature}`;
	} catch {
		return undefined;
	}
}

/**
 * Reads the Gauzy JWT from parsed request cookies (e.g. `cookie-parser`'s `req.cookies`).
 *
 * @param cookies - The parsed cookies.
 * @returns The JWT, or `undefined` when there is no valid session cookie.
 */
export function readSessionTokenFromCookies(
	cookies: Record<string, string | undefined> | undefined
): string | undefined {
	if (!cookies) {
		return undefined;
	}

	const chunks: string[] = [];
	for (let index = 0; cookies[`${SESSION_COOKIE_PREFIX}${index}`]; index++) {
		chunks.push(cookies[`${SESSION_COOKIE_PREFIX}${index}`] as string);
	}

	return decodeSessionToken(chunks.join(''));
}

/**
 * Reads the Gauzy JWT from a raw `Cookie` request header, for callers that run
 * before any cookie parser (e.g. the host's tenant resolver in `mountPlaneProxy`).
 *
 * @param cookieHeader - The raw `Cookie` header.
 * @returns The JWT, or `undefined` when there is no valid session cookie.
 */
export function readSessionTokenFromCookieHeader(
	cookieHeader: string | string[] | undefined
): string | undefined {
	const header = Array.isArray(cookieHeader)
		? cookieHeader.join('; ')
		: cookieHeader;
	if (!header) {
		return undefined;
	}

	const cookies: Record<string, string> = {};
	for (const part of header.split(';')) {
		const eq = part.indexOf('=');
		if (eq === -1) {
			continue;
		}
		const name = part.slice(0, eq).trim();
		if (!name.startsWith(SESSION_COOKIE_PREFIX)) {
			continue;
		}
		const raw = part.slice(eq + 1).trim();
		try {
			cookies[name] = decodeURIComponent(raw);
		} catch {
			cookies[name] = raw;
		}
	}

	return readSessionTokenFromCookies(cookies);
}
