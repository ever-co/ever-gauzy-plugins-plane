import {
	FavoriteEntityEnum,
	FavoriteEntityTypeEnum,
	ICreateFavoriteInput,
	IFavoriteCreateInput,
} from '@plane-plugin/models';

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

export function createFavoriteInputTransformer(
	input: ICreateFavoriteInput,
): IFavoriteCreateInput {
	return {
		entity: mapFavoriteEntityType(input.entity_type),
		entityId: input.entity_identifier,
	};
}
