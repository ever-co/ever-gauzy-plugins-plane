import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateIssueLink,
	ID,
	IPagination,
	IResourceLink
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createIssueLinkInputTransformer,
	getCurrentOrganizationSlug,
	getIssueLinksQuery,
	updateIssueLinkInputTransformer
} from '../../config';

@Injectable()
export class IssueLinksService extends ApiFetchService {
	private readonly path = '/resource-link';

	/**
	 * @description Create link
	 * @param {ICreateIssueLink} input body request for link creation
	 * @param {ID} issueId Issue ID for whom to create link
	 * @returns A promise resolved to created link
	 * @memberof IssueLinksService
	 */
	async create(input: ICreateIssueLink, issueId: ID): Promise<IResourceLink> {
		try {
			const body = {
				...createIssueLinkInputTransformer(input, issueId),
				organizationId: getCurrentOrganizationSlug()
			};

			const link: IResourceLink = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			return link;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Update Issue Link
	 * @param {ID} id Issue Link ID to be updated
	 * @param {Partial<ICreateIssueLink>} input Body Request data for updating
	 * @returns A Promise resolved to updated issue link
	 * @memberof IssueLinksService
	 */
	async update(
		id: ID,
		issueId: ID,
		input: ICreateIssueLink
	): Promise<IResourceLink> {
		try {
			const existingLink = await this.findOne(id, issueId);

			if (!existingLink) {
				throw new BadRequestException('Link Not Found');
			}

			const body = updateIssueLinkInputTransformer(input);

			const link: IResourceLink = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body
				})
			).data;

			return link;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find issue links
	 * @returns A promise resolved to fetched links
	 * @memberof IssueLinksService
	 */
	async findAll(issueId: ID): Promise<IResourceLink[]> {
		try {
			const query = qs.stringify(getIssueLinksQuery(issueId));

			const links: IPagination<IResourceLink> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			return links.items;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Find one link
	 * @param {ID} id - Link ID
	 * @returns A promise resolved to found link
	 * @memberof IssueLinksService
	 */
	async findOne(id: ID, issueId: ID): Promise<IResourceLink> {
		try {
			const query = qs.stringify(getIssueLinksQuery(issueId));

			const link: IResourceLink = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${id}`,
					query
				})
			).data;

			return link;
		} catch (error) {
			console.log(error);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Delete Issue Link
	 * @param {ID} id - Issue Link ID
	 * @returns A promise resolving to deleted Result
	 * @memberof IssueLinksService
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}`
			})
		).data;
	}
}
