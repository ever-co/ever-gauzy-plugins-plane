import {
	EntityEnum,
	FavoriteEntityTypeEnum,
	ICreateFavoriteInput,
	IFavorite,
	IFavoriteCreateInput,
	IFavoriteData,
	IFavoriteFindInput,
} from '@plane-plugin/models';
import { defaultTestTenantId } from '../../credentials';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

export function mapFavoriteEntityType(
	entityType: FavoriteEntityTypeEnum,
): EntityEnum {
	const entityMapping: { [key: string]: EntityEnum } = {
		[FavoriteEntityTypeEnum.CYCLE]: EntityEnum.OrganizationSprint,
		[FavoriteEntityTypeEnum.MODULE]: EntityEnum.OrganizationProjectModule,
		[FavoriteEntityTypeEnum.PROJECT]: EntityEnum.OrganizationProject,
		[FavoriteEntityTypeEnum.VIEW]: EntityEnum.TaskView,
	};
	return entityMapping[entityType];
}

export function apiFavoriteEntityToProxy(
	entity: EntityEnum,
): FavoriteEntityTypeEnum {
	const entityMapping: { [key: string]: FavoriteEntityTypeEnum } = {
		[EntityEnum.OrganizationSprint]: FavoriteEntityTypeEnum.CYCLE,
		[EntityEnum.OrganizationProjectModule]: FavoriteEntityTypeEnum.MODULE,
		[EntityEnum.OrganizationProject]: FavoriteEntityTypeEnum.PROJECT,
		[EntityEnum.TaskView]: FavoriteEntityTypeEnum.VIEW,
	};
	return entityMapping[entity];
}

export function favoriteTransformer(
	favorite: IFavorite,
	data: any,
): IFavoriteData {
	return {
		id: favorite.id,
		entity_type: apiFavoriteEntityToProxy(favorite.entity),
		entity_identifier: favorite.entityId,
		entity_data: {
			id: data.id || favorite.entityId,
			name: data.name,
			project_id: data.projectId,
			logo_props: {},
		},
		project_id: data.projectId,
		workspace_id: defaultTestTenantId,
	};
}

export const getFavoriteQuery = (
	options?: IFavoriteFindInput,
): Record<string, any> => {
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery,
	};

	if (options.entity) {
		query['where[entity]'] = options.entity;
	}

	if (options.entityId) {
		query['where[entityId]'] = options.entityId;
	}

	return query;
};

export function createFavoriteInputTransformer(
	input: ICreateFavoriteInput,
): IFavoriteCreateInput {
	return {
		entity: mapFavoriteEntityType(input.entity_type),
		entityId: input.entity_identifier,
	};
}
