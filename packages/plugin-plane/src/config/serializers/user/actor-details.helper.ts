import { IEmployee } from '@plane-plugin/models';

export function actorDetailsTransformer(actor: IEmployee) {
	return {
		id: actor?.id,
		first_name: actor?.user?.firstName,
		last_name: actor?.user?.lastName,
		avatar: actor?.user?.imageUrl,
		is_bot: false,
		display_name: actor?.fullName,
		email: actor?.user?.email
	};
}
