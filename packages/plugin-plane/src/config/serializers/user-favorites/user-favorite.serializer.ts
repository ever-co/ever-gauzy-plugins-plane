import {
	BaseEntityEnum,
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
): BaseEntityEnum {
	const entityMapping: { [key: string]: BaseEntityEnum } = {
		[FavoriteEntityTypeEnum.CYCLE]: BaseEntityEnum.OrganizationSprint,
		[FavoriteEntityTypeEnum.MODULE]:
			BaseEntityEnum.OrganizationProjectModule,
		[FavoriteEntityTypeEnum.PROJECT]: BaseEntityEnum.OrganizationProject,
		[FavoriteEntityTypeEnum.VIEW]: BaseEntityEnum.TaskView,
	};
	return entityMapping[entityType];
}

export function apiFavoriteEntityToProxy(
	entity: BaseEntityEnum,
): FavoriteEntityTypeEnum {
	const entityMapping: { [key: string]: FavoriteEntityTypeEnum } = {
		[BaseEntityEnum.OrganizationSprint]: FavoriteEntityTypeEnum.CYCLE,
		[BaseEntityEnum.OrganizationProjectModule]:
			FavoriteEntityTypeEnum.MODULE,
		[BaseEntityEnum.OrganizationProject]: FavoriteEntityTypeEnum.PROJECT,
		[BaseEntityEnum.TaskView]: FavoriteEntityTypeEnum.VIEW,
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
		workspace_id: defaultTestTenantId(),
	};
}

export const getFavoriteQuery = (
	options?: IFavoriteFindInput,
): Record<string, any> => {
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery(),
	};

	if (options?.entity) {
		query['where[entity]'] = options.entity;
	}

	if (options?.entityId) {
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
