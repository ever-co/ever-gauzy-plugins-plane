import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import qs from 'qs';
import { ID, IHelpCenterArticle, IPage, IPagination } from '@ever-gauzy/plugin-integration-plane-models';
import { getCurrentOrganizationSlug } from '../../config/credentials';
import {
	articleToPage, createPageInputTransformer,
	getPagesQuery,
	updatePageInputTransformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { CreatePageDTO, UpdatePageDTO } from './dto';

@Injectable()
export class PagesService extends ApiFetchService {
	/** In-memory cache for the default HelpCenter category ID */
	private static defaultCategoryId: string | null = null;

	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/help-center-article';

	/**
	 * Get or lazily create a default "Pages" HelpCenter category.
	 * The ID is cached as a static property for the process lifetime.
	 * On restart, the existing category is found via GET and re-cached.
	 */
	private async getOrCreateDefaultCategory(): Promise<string> {
		// Return from cache if available
		if (PagesService.defaultCategoryId) {
			return PagesService.defaultCategoryId;
		}

		try {
			// Search for an existing "Pages" category in Gauzy
			const query = qs.stringify({
				data: JSON.stringify({
					relations: [],
					findInput: { name: 'Pages' }
				})
			});
			const response = await this.apiFetch({
				method: 'GET',
				path: '/help-center',
				query
			});

			const items = response.data?.items ?? [];
			const existing = items.find((c: any) => c.name === 'Pages');

			if (existing) {
				PagesService.defaultCategoryId = existing.id;
				this.logger.log(`Found existing default Pages category: ${existing.id}`);
				return existing.id;
			}

			// Create a new default category
			const created = await this.apiFetch({
				method: 'POST',
				path: '/help-center',
				body: {
					name: 'Pages',
					flag: 'pages',
					icon: 'book-open-outline',
					privacy: 'eye-outline',
					language: 'en',
					color: '#3F76FF',
					index: 0,
					organizationId: getCurrentOrganizationSlug()
				}
			});

			PagesService.defaultCategoryId = created.data.id;
			this.logger.log(`Created default Pages category: ${created.data.id}`);
			return created.data.id;
		} catch (error) {
			this.logger.error(
				'Failed to get or create default category',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException('Unable to resolve default Pages category');
		}
	}

	/**
	 * List all pages, optionally filtered by project.
	 */
	async findAll(projectId?: ID): Promise<IPage[]> {
		try {
			const path = projectId ? `${this.path}/project/${projectId}` : this.path;
			const query = qs.stringify(getPagesQuery(projectId));
			const articles: IPagination<IHelpCenterArticle> = (await this.apiFetch({ method: 'GET', path, query })).data;
			if (!articles.items) {
				return [];
			}

			return articles.items.map(articleToPage);
		} catch (error) {
			if (error instanceof NotFoundException || (error as any)?.response?.status === 404) {
				return [];
			}
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
	async create(input: CreatePageDTO, projectId?: ID): Promise<IPage> {
		try {
			const categoryId = await this.getOrCreateDefaultCategory();
			const body = createPageInputTransformer(input, categoryId, projectId);
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
	 *
	 * The live server sends `description_binary` as base64 and `description_html`/`description_json` as text.
	 * All three fields are sent in a single atomic PATCH to Gauzy's `/:id/description` endpoint,
	 * which decodes the base64 binary server-side and performs a single update with one versioning cycle.
	 *
	 * This replaces the previous 2-PUT approach (binary-description + metadata) that caused
	 * double versioning, race conditions, and potential content duplication.
	 */
	async updateDescription(id: ID, payload: any): Promise<any> {
		try {
			const body: Record<string, any> = {};

			// Binary stays as base64 string — the Gauzy PATCH endpoint decodes it server-side
			if (payload.description_binary !== undefined) {
				body['descriptionBinary'] = payload.description_binary;
			}
			if (payload.description_html !== undefined) {
				body['descriptionHtml'] = payload.description_html;
			}
			if (payload.description_json !== undefined) {
				body['descriptionJson'] = payload.description_json;
			}

			if (Object.keys(body).length > 0) {
				const response = await this.apiFetch({
					method: 'PATCH',
					path: `${this.path}/${id}/description`,
					body
				});
				return response.data;
			}
			return null;
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

	/**
	 * Fetch favorite pages for a project.
	 * (Note: Mapping to Gauzy favorites if available, or empty for now)
	 */
	async fetchFavorites(projectId: ID): Promise<IPage[]> {
		try {
			// Plane expects a list of favorite pages. 
			// For now, we return empty as we don't have a dedicated M2M for favorites in Gauzy's HelpCenterArticle yet.
			// Ideally this would filter by a "isFavorite" or similar flag if we had one.
			return [];
		} catch (error) {
			this.logger.error('Pages.fetchFavorites failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Add page to favorites.
	 */
	async addToFavorites(id: ID): Promise<void> {
		try {
			// Mocking for now as Gauzy doesn't have a direct "favorites" for help center articles.
		} catch (error) {
			this.logger.error('Pages.addToFavorites failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Remove page from favorites.
	 */
	async removeFromFavorites(id: ID): Promise<void> {
		try {
			// Mocking for now.
		} catch (error) {
			this.logger.error('Pages.removeFromFavorites failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}

	/**
	 * Fetch user mentions for a page.
	 */
	async fetchUserMentions(projectId: ID): Promise<any[]> {
		try {
			// Plane expects people who can be mentioned in the page.
			// We can return project members.
			const response = await this.apiFetch({
				method: 'GET',
				path: `/organization-project/${projectId}`,
				query: 'relations[0]=members.employee.user'
			});
			const project = response.data;
			return (project?.members || []).map((m: any) => ({
				id: m.employee?.user?.id,
				display_name: m.employee?.user?.name || m.employee?.user?.email,
				avatar_url: m.employee?.user?.image
			}));
		} catch (error) {
			this.logger.error('Pages.fetchUserMentions failed', error instanceof Error ? error.stack : String(error));
			throw new BadRequestException(error);
		}
	}
}
