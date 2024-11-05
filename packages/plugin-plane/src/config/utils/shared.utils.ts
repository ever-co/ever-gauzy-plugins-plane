/**
 * Convert slug back to a readable string
 *
 * @param slug
 * @param replacement
 * @returns {string}
 */
export function deslugify(slug: string, replacement: any = '-'): string {
	// Remplace le caractère de remplacement (par défaut '-') par des espaces
	let result = slug.split(replacement).join(' ');

	// Convertit la première lettre de chaque mot en majuscule (si souhaité)
	result = result.replace(/\b\w/g, (char) => char.toUpperCase());

	return result;
}
