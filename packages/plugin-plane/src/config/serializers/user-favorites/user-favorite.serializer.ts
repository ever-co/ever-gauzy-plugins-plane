import {
	FavoriteEntityEnum,
	FavoriteEntityTypeEnum,
	ICreateFavoriteInput,
	IFavorite,
	IFavoriteCreateInput,
	IFavoriteData,
} from '@plane-plugin/models';
import { defaultTestTenantId } from '../../credentials';

export function mapFavoriteEntityType(
	entityType: FavoriteEntityTypeEnum,
): FavoriteEntityEnum {
	const entityMapping: { [key: string]: FavoriteEntityEnum } = {
		[FavoriteEntityTypeEnum.CYCLE]: FavoriteEntityEnum.OrganizationSprint,
		[FavoriteEntityTypeEnum.MODULE]:
			FavoriteEntityEnum.OrganizationProjectModule,
		[FavoriteEntityTypeEnum.PROJECT]:
			FavoriteEntityEnum.OrganizationProject,
	};
	return entityMapping[entityType];
}

export function apiFavoriteEntityToProxy(
	entity: FavoriteEntityEnum,
): FavoriteEntityTypeEnum {
	const entityMapping: { [key: string]: FavoriteEntityTypeEnum } = {
		[FavoriteEntityEnum.OrganizationSprint]: FavoriteEntityTypeEnum.CYCLE,
		[FavoriteEntityEnum.OrganizationProjectModule]:
			FavoriteEntityTypeEnum.MODULE,
		[FavoriteEntityEnum.OrganizationProject]:
			FavoriteEntityTypeEnum.PROJECT,
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

export function createFavoriteInputTransformer(
	input: ICreateFavoriteInput,
): IFavoriteCreateInput {
	return {
		entity: mapFavoriteEntityType(input.entity_type),
		entityId: input.entity_identifier,
	};
}
