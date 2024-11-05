/**
 * Convert slug back to a readable string
 *
 * @param slug
 * @param replacement
 * @returns {string}
 */
export function deslugify(slug: string, replacement: any = '-'): string {
	// Replace the replacement character (default '-') with spaces
	let result = slug.split(replacement).join(' ');

	// Convert la the first letter of each word in Upper case
	result = result.replace(/\b\w/g, (char) => char.toUpperCase());

	return result;
}
