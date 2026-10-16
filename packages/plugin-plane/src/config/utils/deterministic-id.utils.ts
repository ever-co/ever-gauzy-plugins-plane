import { createHash } from 'crypto';

/**
 * Namespace of the ids below (an arbitrary, fixed UUID), so they cannot collide with ids from other name-based schemes.
 */
const PROXY_ID_NAMESPACE = '6f1c2a8e-3b4d-5e6f-8a9b-0c1d2e3f4a5b';

/**
 * ever-gauzy fork: a stable, name-based (RFC 4122 version 5) UUID for proxy objects that have no Gauzy row of their
 * own, e.g. a project's intake "Triage" state. The same parts always give the same id, so the Plane UI can cache it.
 *
 * @param parts - What the id stands for, e.g. `['intake-state', projectId]`.
 * @returns A version 5 UUID.
 */
export function deterministicUuid(...parts: string[]): string {
	const namespace = Buffer.from(PROXY_ID_NAMESPACE.replace(/-/g, ''), 'hex');
	const hash = createHash('sha1')
		.update(namespace)
		.update(parts.join(':'))
		.digest();
	const bytes = hash.subarray(0, 16);

	bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

	const hex = bytes.toString('hex');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
