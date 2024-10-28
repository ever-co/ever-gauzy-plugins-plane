/**
 * Extract the view ID from the referer URL.
 *
 * @param {string} referer - The referer URL from the request headers
 * @returns {(string | null)} - Returns the view ID if found, otherwise null
 */
export function extractViewIdFromReferer(referer: string): string | null {
	const regex = /\/views\/([a-f0-9-]{36})(\/|$)/;
	const match = referer.match(regex);
	return match && match[1] ? match[1] : null;
}
