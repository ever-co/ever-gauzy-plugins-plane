import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { ID, IPage } from '@plane-plugin/models';
import {
	articleToPage, createPageInputTransformer,
	getPagesQuery,
	updatePageInputTransformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { CreatePageDTO, UpdatePageDTO } from './dto';

@Injectable()
export class PagesService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/help-center-article';

	/**
	 * List all pages, optionally filtered by project.
	 */
	async findAll(projectId?: ID): Promise<IPage[]> {
		try {
			const path = projectId ? `${this.path}/by-project/${projectId}` : this.path;
			const query = qs.stringify(getPagesQuery(projectId));
			const response = await this.apiFetch({ method: 'GET', path, query });
			const items: Record<string, any>[] = response.data?.items ?? response.data ?? [];
			return items.map(articleToPage);
		} catch (error) {
			this.logger.error('Pages.findAll failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * List archived pages for a project.
	 */
	async findArchived(projectId: ID): Promise<IPage[]> {
		try {
			const pages = await this.findAll(projectId);
			return pages.filter((page) => page.archived_at !== null);
		} catch (error) {
			this.logger.error('Pages.findArchived failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Get a single page by ID.
	 */
	async findOne(id: ID): Promise<IPage> {
		try {
			const query = qs.stringify({
				'relations[0]': 'projects',
				'relations[1]': 'tags'
			});
			const response = await this.apiFetch({ method: 'GET', path: `${this.path}/${id}`, query });
			return articleToPage(response.data);
		} catch (error) {
			this.logger.error('Pages.findOne failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Create a new page.
	 */
	async create(input: CreatePageDTO): Promise<IPage> {
		try {
			const body = createPageInputTransformer(input);
			const response = await this.apiFetch({ method: 'POST', path: this.path, body });
			return articleToPage(response.data);
		} catch (error) {
			this.logger.error('Pages.create failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Update a page (content + metadata).
	 */
	async update(id: ID, input: UpdatePageDTO): Promise<void> {
		try {
			const body = updatePageInputTransformer(input);
			await this.apiFetch({ method: 'PUT', path: `${this.path}/${id}`, body });
		} catch (error) {
			this.logger.error('Pages.update failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Delete a page.
	 */
	async delete(id: ID): Promise<void> {
		try {
			await this.apiFetch({ method: 'DELETE', path: `${this.path}/${id}` });
		} catch (error) {
			this.logger.error('Pages.delete failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Archive a page (set archivedAt = now).
	 */
	async archive(id: ID): Promise<void> {
		try {
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: { archivedAt: new Date().toISOString() }
			});
		} catch (error) {
			this.logger.error('Pages.archive failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Unarchive a page (set archivedAt = null).
	 */
	async unarchive(id: ID): Promise<void> {
		try {
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: { archivedAt: null }
			});
		} catch (error) {
			this.logger.error('Pages.unarchive failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Lock a page.
	 */
	async lock(id: ID): Promise<void> {
		try {
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: { isLocked: true }
			});
		} catch (error) {
			this.logger.error('Pages.lock failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Unlock a page.
	 */
	async unlock(id: ID): Promise<void> {
		try {
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: { isLocked: false }
			});
		} catch (error) {
			this.logger.error('Pages.unlock failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Duplicate a page.
	 */
	async duplicate(id: ID): Promise<IPage> {
		try {
			const response = await this.apiFetch({
				method: 'POST',
				path: `${this.path}/${id}/duplicate`
			});
			return articleToPage(response.data);
		} catch (error) {
			this.logger.error('Pages.duplicate failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Get page description binary.
	 */
	async getDescriptionBinary(id: ID): Promise<any> {
		try {
			const response = await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}/description`,
				responseType: 'arraybuffer'
			});
			return response.data;
		} catch (error) {
			this.logger.error('Pages.getDescriptionBinary failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Update page description (supports binary/live editor).
	 */
	async updateDescription(id: ID, payload: any): Promise<any> {
		try {
			// Proxy to the standard PUT endpoint which handles descriptionBinary via CQRS
			const response = await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: payload
			});
			return response.data;
		} catch (error) {
			this.logger.error('Pages.updateDescription failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Update page access.
	 */
	async updateAccess(id: ID, access: string): Promise<void> {
		try {
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: { privacy: access === 'public' }
			});
		} catch (error) {
			this.logger.error('Pages.updateAccess failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Move page to another project.
	 */
	async move(id: ID, newProjectId: ID): Promise<void> {
		try {
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: { projectIds: [newProjectId] }
			});
		} catch (error) {
			this.logger.error('Pages.move failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Fetch all versions of a page.
	 */
	async fetchAllVersions(id: ID): Promise<any[]> {
		try {
			const query = qs.stringify({
				'where[articleId]': id,
				'relations[0]': 'ownedBy'
			});
			const response = await this.apiFetch({
				method: 'GET',
				path: '/help-center-article-version',
				query
			});
			return response.data?.items ?? response.data ?? [];
		} catch (error) {
			this.logger.error('Pages.fetchAllVersions failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Fetch a specific version by ID.
	 */
	async fetchVersionById(vId: ID): Promise<any> {
		try {
			const response = await this.apiFetch({
				method: 'GET',
				path: `/help-center-article-version/${vId}`
			});
			return response.data;
		} catch (error) {
			this.logger.error('Pages.fetchVersionById failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Restore a page to a specific version.
	 */
	async restoreVersion(id: ID, vId: ID): Promise<void> {
		try {
			const version = await this.fetchVersionById(vId);
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: {
					descriptionHtml: version.descriptionHtml,
					descriptionJson: version.descriptionJson,
					descriptionBinary: version.descriptionBinary
				}
			});
		} catch (error) {
			this.logger.error('Pages.restoreVersion failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}
}
