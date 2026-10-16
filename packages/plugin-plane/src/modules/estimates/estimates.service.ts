import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IEstimate,
	IEstimateCreateInput,
	IEstimatePoint,
	IEstimatePointInput,
	IPagination,
	ITaskSize
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	baseGetItemsWhereQuery,
	currentTenantId,
	estimatePointTransformer,
	estimateTransformer,
	getCurrentOrganizationSlug,
	getTaskSizesQuery,
	sortTaskSizes,
	taskSizeValueOf
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

/**
 * ever-gauzy fork: Plane estimates backed by Ever Gauzy task sizes (see `estimate.serializer.ts`).
 */
@Injectable()
export class EstimatesService extends ApiFetchService {
	private readonly path = '/task-sizes';

	/**
	 * A project's task sizes: its own ones, or Gauzy's defaults when it has none.
	 *
	 * @param projectId - The project.
	 */
	async getProjectSizes(projectId: ID): Promise<ITaskSize[]> {
		const sizes: IPagination<ITaskSize> = (
			await this.apiFetch({
				method: 'GET',
				path: this.path,
				query: qs.stringify(getTaskSizesQuery(projectId))
			})
		).data;

		return sizes?.items ?? [];
	}

	/**
	 * One task size by id.
	 *
	 * @param id - The task size (estimate point) id.
	 */
	async getTaskSize(id: ID): Promise<ITaskSize> {
		return (
			await this.apiFetch({ method: 'GET', path: `${this.path}/${id}` })
		).data;
	}

	/**
	 * GET /projects/:projectId/estimates/ — the project's single, active estimate.
	 */
	async getProjectEstimates(projectId: ID): Promise<IEstimate[]> {
		try {
			const sizes = await this.getProjectSizes(projectId);
			return [
				estimateTransformer(
					projectId,
					sizes,
					getCurrentOrganizationSlug()
				)
			];
		} catch (error) {
			this.handleApiError(error);
		}
	}

	/**
	 * GET /projects/:projectId/estimates/:estimateId/
	 */
	async getEstimate(projectId: ID, estimateId: ID): Promise<IEstimate> {
		this.assertEstimateOfProject(projectId, estimateId);
		const [estimate] = await this.getProjectEstimates(projectId);
		return estimate;
	}

	/**
	 * GET /estimates/ — the estimates of every project of the workspace.
	 *
	 * Three kinds of request, none per project: the project ids, every project-scoped size of the organization (pages
	 * of 100, Gauzy's maximum), and the organization's fallback sizes for projects without their own.
	 */
	async getWorkspaceEstimates(): Promise<IEstimate[]> {
		try {
			const workspaceId = getCurrentOrganizationSlug();
			const [projects, projectSizes, fallbackSizes] = await Promise.all([
				this.getProjectIds(),
				this.getOrganizationProjectSizes(),
				this.getFallbackSizes()
			]);

			const sizesByProject = new Map<ID, ITaskSize[]>();
			projectSizes.forEach((size) => {
				const sizes = sizesByProject.get(size.projectId!) ?? [];
				sizes.push(size);
				sizesByProject.set(size.projectId!, sizes);
			});

			return projects.map((projectId) =>
				estimateTransformer(
					projectId,
					sizesByProject.get(projectId) ?? fallbackSizes,
					workspaceId
				)
			);
		} catch (error) {
			this.handleApiError(error);
		}
	}

	/**
	 * POST /projects/:projectId/estimates/ — Plane creates an estimate system with its points. In Gauzy that means the
	 * project's task sizes: every point without a project size of the same name becomes one. Existing sizes are kept
	 * (tasks may use them), so this never removes anything.
	 */
	async createEstimate(
		projectId: ID,
		input: IEstimateCreateInput
	): Promise<IEstimate> {
		try {
			const sizes = await this.ensureProjectSizes(projectId);
			const names = new Set(
				sizes.map((size) => (size.name ?? '').toLowerCase())
			);
			const points = [...(input?.estimate_points ?? [])]
				.filter((point) => (point?.value ?? '').trim() !== '')
				.sort((a, b) => (a.key ?? 0) - (b.key ?? 0));

			for (const point of points) {
				if (!names.has(point.value.trim().toLowerCase())) {
					await this.createSize(projectId, { value: point.value });
					names.add(point.value.trim().toLowerCase());
				}
			}

			const [estimate] = await this.getProjectEstimates(projectId);
			return estimate;
		} catch (error) {
			this.handleApiError(error);
		}
	}

	/**
	 * DELETE /projects/:projectId/estimates/:estimateId/ — Plane only deletes archived estimates. A Gauzy project's task
	 * sizes are its only, active estimate, so there is never one to delete.
	 */
	async deleteEstimate(projectId: ID, estimateId: ID): Promise<void> {
		this.assertEstimateOfProject(projectId, estimateId);
		throw new BadRequestException(
			'An Ever Gauzy project always has task sizes, so its estimate cannot be deleted. Edit its points instead.'
		);
	}

	/**
	 * POST /projects/:projectId/estimates/:estimateId/estimate-points/ — adds a task size to the project.
	 */
	async createEstimatePoint(
		projectId: ID,
		estimateId: ID,
		input: IEstimatePointInput
	): Promise<IEstimatePoint> {
		this.assertEstimateOfProject(projectId, estimateId);
		if (!input?.value?.trim()) {
			throw new BadRequestException('An estimate point needs a value.');
		}
		try {
			await this.ensureProjectSizes(projectId);
			const size = await this.createSize(projectId, input);
			return this.toPoint(projectId, size);
		} catch (error) {
			this.handleApiError(error);
		}
	}

	/**
	 * PATCH /projects/:projectId/estimates/:estimateId/estimate-points/:pointId/ — renames a task size. Its `value` is
	 * kept, so tasks that only carry the size's value still match it. A default size (shared by every project) is never
	 * edited: the project gets its own copies first and the copy is renamed.
	 */
	async updateEstimatePoint(
		projectId: ID,
		estimateId: ID,
		pointId: ID,
		input: IEstimatePointInput
	): Promise<IEstimatePoint> {
		this.assertEstimateOfProject(projectId, estimateId);
		try {
			const before = await this.getProjectSizes(projectId);
			const target = before.find((size) => size.id === pointId);
			if (!target) {
				throw new NotFoundException('Estimate point not found');
			}

			let sizeId = target.id!;
			if (target.projectId !== projectId) {
				const copies = await this.ensureProjectSizes(projectId, before);
				sizeId =
					copies.find(
						(size) =>
							(size.value ?? '').toLowerCase() ===
							(target.value ?? '').toLowerCase()
					)?.id ?? sizeId;
			}

			const size: ITaskSize = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${sizeId}`,
					body: {
						...(input?.value?.trim()
							? { name: input.value.trim() }
							: {}),
						...(input?.description !== undefined
							? { description: input.description }
							: {}),
						organizationId: getCurrentOrganizationSlug(),
						tenantId: currentTenantId()
					}
				})
			).data;

			return this.toPoint(projectId, size);
		} catch (error) {
			this.handleApiError(error);
		}
	}

	/**
	 * The project's own task sizes, creating copies of the sizes it falls back to when it has none (like Gauzy does
	 * for a new project), so editing them never touches the shared defaults.
	 */
	private async ensureProjectSizes(
		projectId: ID,
		known?: ITaskSize[]
	): Promise<ITaskSize[]> {
		const sizes = known ?? (await this.getProjectSizes(projectId));
		const own = sizes.filter((size) => size.projectId === projectId);
		if (own.length > 0 || sizes.length === 0) {
			return own;
		}

		const copies: ITaskSize[] = [];
		for (const size of sortTaskSizes(sizes)) {
			copies.push(
				await this.createSize(projectId, {
					value: size.name,
					description: size.description,
					sizeValue: size.value,
					icon: size.icon,
					color: size.color
				})
			);
		}
		return copies;
	}

	private async createSize(
		projectId: ID,
		input: IEstimatePointInput & {
			sizeValue?: string;
			icon?: string;
			color?: string;
		}
	): Promise<ITaskSize> {
		const name = input.value!.trim();
		return (
			await this.apiFetch({
				method: 'POST',
				path: this.path,
				body: {
					name,
					value: input.sizeValue ?? taskSizeValueOf(name),
					description: input.description,
					icon: input.icon,
					color: input.color,
					projectId,
					organizationId: getCurrentOrganizationSlug(),
					tenantId: currentTenantId()
				}
			})
		).data;
	}

	private async toPoint(
		projectId: ID,
		size: ITaskSize
	): Promise<IEstimatePoint> {
		const sorted = sortTaskSizes(await this.getProjectSizes(projectId));
		const index = sorted.findIndex((candidate) => candidate.id === size.id);
		return estimatePointTransformer(
			size,
			index === -1 ? sorted.length : index,
			projectId,
			getCurrentOrganizationSlug()
		);
	}

	private async getProjectIds(): Promise<ID[]> {
		const projects: IPagination<{ id: ID }> = (
			await this.apiFetch({
				method: 'GET',
				path: '/organization-projects',
				query: qs.stringify({
					...baseGetItemsWhereQuery(),
					'select[id]': true
				})
			})
		).data;

		return (projects?.items ?? []).map((project) => project.id);
	}

	private async getOrganizationProjectSizes(): Promise<ITaskSize[]> {
		const sizes: ITaskSize[] = [];
		for (let page = 1; ; page++) {
			const result: IPagination<ITaskSize> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/pagination`,
					query: qs.stringify({
						...baseGetItemsWhereQuery(),
						take: 100,
						skip: page
					})
				})
			).data;
			const items = result?.items ?? [];
			sizes.push(...items);
			if (items.length < 100 || sizes.length >= (result?.total ?? 0)) {
				break;
			}
		}
		return sizes.filter((size) => !!size.projectId);
	}

	private async getFallbackSizes(): Promise<ITaskSize[]> {
		const where = baseGetItemsWhereQuery();
		const sizes: IPagination<ITaskSize> = (
			await this.apiFetch({
				method: 'GET',
				path: this.path,
				query: qs.stringify({
					tenantId: where['where[tenantId]'],
					organizationId: where['where[organizationId]']
				})
			})
		).data;

		return sizes?.items ?? [];
	}

	private assertEstimateOfProject(projectId: ID, estimateId: ID) {
		if (estimateId !== projectId) {
			throw new NotFoundException('Estimate not found');
		}
	}
}
