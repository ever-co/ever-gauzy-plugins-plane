import * as cheerio from 'cheerio';
import { ID, IssueOrderByField } from '@plane-plugin/models';
import { Request, Response } from 'express';
import { EXTERNAL_API_MODE, MAX_TOKEN_COOKIE_SIZE } from '../constants';

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

/**
 * Splits a string into an array of substrings based on a specified separator.
 *
 * @param {string} criteria - The string to be split.
 * @param {string} [separator=','] - The character or pattern to use as the separator (default is a comma).
 * @returns {string[]} An array of substrings obtained by splitting the input string.
 */
export function issueFilterSplitter(
	criteria: string,
	separator = ','
): string[] {
	return criteria.split(separator);
}

/**
 * Splits a token string into chunks of specified size.
 * @param token - The token string to be split.
 * @param chunkSize - The size of each chunk.
 * @returns An array of token chunks.
 */
export function splitToken(token: string, chunkSize: number): string[] {
	// Initialize an array to store the chunks
	const chunks: string[] = [];
	// Iterate through the token string, slicing it into chunks of specified size
	for (let i = 0; i < token.length; i += chunkSize) {
		chunks.push(token.slice(i, i + chunkSize));
	}
	// Return the array of chunks
	return chunks;
}

/**
 * Sends token chunks as cookies in the response.
 * @param token - The token string to be split and sent as cookies.
 * @param response - The response object to set cookies on.
 */
export function sendTokenChunks(token: string, response: Response) {
	// Split the token into chunks using the splitToken function
	const tokenChunks = splitToken(token, MAX_TOKEN_COOKIE_SIZE);
	// Iterate through each chunk and set it as a cookie
	tokenChunks.forEach((chunk, index) => {
		response.cookie(`auth-proxy-plane-token-${index}`, chunk, {
			httpOnly: true, // Ensure cookie is inaccessible to JavaScript
			secure: EXTERNAL_API_MODE() === 'production', // Use secure cookies in production
			sameSite: 'strict' // Restrict cookie to same-site requests
		});
	});
}

/**
 * Clears token chunk cookies from the response.
 * @param request - The request object containing cookies.
 * @param response - The response object to clear cookies from.
 */
export function clearTokenChuncks(request: Request, response: Response) {
	// Initialize index for cookie names
	let index = 0;
	// Loop to find and clear all token chunk cookies
	while (true) {
		const cookieName = `auth-proxy-plane-token-${index}`;
		// Break if no cookie exists with the current index
		if (!request.cookies[cookieName]) {
			break;
		}
		// Clear the cookie with matching name
		response.clearCookie(cookieName, {
			httpOnly: true, // Ensure cookie is inaccessible to JavaScript
			secure: EXTERNAL_API_MODE() === 'production', // Use secure cookies in production
			sameSite: 'strict' // Restrict cookie to same-site requests
		});
		index++;
	}
}

/**
 * Checks if an item is empty, handling arrays, objects, and primitive values.
 * @param item - The item to check for emptiness. Can be of any type.
 * @returns True if the item is considered empty, false otherwise.
 */
export function isEmpty(item: any): boolean {
	// Handle arrays by filtering out empty elements and checking length
	if (item instanceof Array) {
		item = item.filter((val) => !isEmpty(val));
		return item.length === 0;
	}

	// Handle Dates
	else if (item instanceof Date) {
		return isNaN(item.getTime()); // invalid date is considered empty
	}

	// Handle objects by removing null, undefined, or empty string properties
	else if (item && typeof item === 'object') {
		for (const key in item) {
			if (
				item[key] === null ||
				item[key] === undefined ||
				item[key] === ''
			) {
				delete item[key];
			}
		}
		// Return true if no properties remain
		return Object.keys(item).length === 0;
	}
	// Handle primitive values (null, undefined, or string representations)
	else {
		return (
			!item ||
			(item + '').toLocaleLowerCase() === 'null' ||
			(item + '').toLocaleLowerCase() === 'undefined'
		);
	}
}

/**
 * Check value not empty.
 * @param item
 * @returns {boolean}
 */
export function isNotEmpty(item: any): boolean {
	return !isEmpty(item);
}

/**
 * Sanitizes and decodes an encoded email address from a URL.
 *
 * @param {string} encodedEmail - The URL-encoded email string (e.g. "gloire%40ever.tech").
 * @returns {string} The decoded, sanitized email address (e.g. "gloire@ever.tech").
 */
export function sanitizeEmail(encodedEmail: string): string {
	// Trim leading/trailing spaces and decode URI component
	return decodeURIComponent(encodedEmail.trim());
}
