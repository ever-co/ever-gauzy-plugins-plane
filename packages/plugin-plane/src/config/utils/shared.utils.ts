import * as cheerio from 'cheerio';
import { ID, IssueOrderByField } from '@plane-plugin/models';

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

export const orderByFieldMap: { [key in IssueOrderByField]: string } = {
	[IssueOrderByField.DESC_CREATED_AT]: 'createdAt',
	[IssueOrderByField.ASC_CREATED_AT]: 'createdAt',
	[IssueOrderByField.MANUAL]: '',
	[IssueOrderByField.DESC_PRIORITY]: 'priority',
	[IssueOrderByField.START_DATE]: 'startDate',
	[IssueOrderByField.DESC_UPDATED_AT]: 'updatedAt',
	[IssueOrderByField.ASC_UPDATED_AT]: 'updatedAt'
};

/**
 * Transforms a given issue ordering field into its corresponding property name.
 *
 * @param {IssueOrderByField} field - The field used for ordering issues.
 *   It should be one of the values defined in the `IssueOrderByField` enum (e.g., `CREATED_AT`, `MANUAL`, `PRIORITY`, etc.).
 * @returns {string} The corresponding property name as a string, such as `createdAt`, `priority`, or `startDate`.
 *   If the provided `field` is `MANUAL`, the function will return an empty string as there is no corresponding property.
 */
export function orderByFieldTransformer(field: IssueOrderByField): string {
	return orderByFieldMap[field];
}

/**
 * Gets the sorting direction based on the order field.
 *
 * @param {keyof typeof orderByFieldMap} field - A key from `orderByFieldMap` to determine the sorting direction.
 * @returns {string} The sorting direction, either "ASC" or "DESC", or an empty string if no direction exists.
 */

export function orderByDirection(field: IssueOrderByField): string {
	return field.startsWith('-') ? 'DESC' : 'ASC';
}

/**
 * Extract mention IDs from comment HTML.
 *
 * @param commentHtml - The HTML content of the comment.
 * @returns An array of mention IDs extracted from the comment HTML.
 */
export function extractEmployeeMentionIds(commentHtml: string): ID[] {
	if (!commentHtml) {
		return [];
	}

	try {
		// Load the HTML into cheerio
		const commenMentionParser = cheerio.load(commentHtml);

		// Select all mention-component elements and extract their 'entity_identifier'
		const mentionIds: ID[] = commenMentionParser('mention-component')
			.map((_, element) =>
				commenMentionParser(element).attr('entity_identifier')
			)
			.get() // Convert cheerio object to a plain array
			.filter((id): id is ID => !!id); // Ensure IDs are non-null

		// Remove duplicates by converting to a Set and back to an array
		return [...new Set(mentionIds)];
	} catch (error) {
		console.error('Error extracting mention IDs:', error);
		return [];
	}
}
