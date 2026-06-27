import { IEmployee } from '@ever-gauzy/plugin-integration-plane-models';

export function actorDetailsTransformer(actor: IEmployee | undefined) {
	return {
		id: actor?.id,
		first_name: actor?.user?.firstName || '',
		last_name: actor?.user?.lastName || '',
		avatar: actor?.user?.imageUrl,
		is_bot: false,
		display_name: actor?.fullName || '',
		email: actor?.user?.email
	};
}
