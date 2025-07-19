import {
	ICreateEmailInvitesInput,
	ICreateWorkspaceInvitationInput,
	ID,
	IInvitation,
	IInvite,
	InvitationTypeEnum,
	InviteStatusEnum
} from '@plane-plugin/models';
import { currentTenantId, getCurrentOrganizationSlug } from '../../credentials';
import {
	roleTransformer,
	workspaceTransformer
} from '../workspace-organization';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * Transforms an invitation status into a boolean indicating whether the invitation was accepted.
 *
 * @param {InviteStatusEnum} status - The status of the invitation.
 * @returns {boolean} `true` if the invitation was accepted, otherwise `false`.
 */

export function invitationStatusTransformer(status: InviteStatusEnum): boolean {
	const statusMapping: { [key in InviteStatusEnum]: boolean } = {
		[InviteStatusEnum.INVITED]: false,
		[InviteStatusEnum.ACCEPTED]: true,
		[InviteStatusEnum.EXPIRED]: false,
		[InviteStatusEnum.REJECTED]: false
	};

	return statusMapping[status];
}

/**
 * Transforms a single workspace invitation input into a format compatible with bulk email invite creation.
 *
 * @param {ICreateWorkspaceInvitationInput} input - The workspace invitation input containing the email to invite.
 * @param {ID} roleId - The role ID to assign to the invited user.
 * @returns {ICreateEmailInvitesInput} The transformed input ready for the bulk email invitation process.
 */
export function createBulkWorkspaceInvitationInputTransformer(
	input: ICreateWorkspaceInvitationInput,
	roleId: ID
): ICreateEmailInvitesInput {
	return {
		emailIds: [input.email],
		roleId,
		inviteType: InvitationTypeEnum.EMPLOYEE,
		startedWorkOn: new Date(),
		invitationExpirationPeriod: 'Never',
		organizationId: getCurrentOrganizationSlug()
	};
}

/**
 * Transforms one or multiple raw invite objects (`IInvite`) into formatted invitation(s) (`IInvitation`).
 *
 * If an array is provided, it returns an array of transformed invitations.
 * If a single object is provided, it returns the transformed invitation object.
 *
 * @param {IInvite[] | IInvite} invitations - One or many raw invitation objects.
 * @returns {IInvitation | IInvitation[]} The transformed invitation(s).
 */
export function invitationTransformer(
	invitations: IInvite[] | IInvite
): IInvitation | IInvitation[] {
	const transformInvitation = (invitation: IInvite): IInvitation => {
		return {
			id: invitation.id,
			deleted_at: invitation.deletedAt,
			workspace: workspaceTransformer(invitation.organization),
			invite_link: invitation.token,
			created_at: invitation.createdAt,
			updated_at: invitation.updatedAt,
			email: invitation.email,
			accepted: invitationStatusTransformer(invitation.status),
			token: invitation.token,
			message: '',
			responded_at: null, // First set to null and after probably use invitation.actionDate
			role: roleTransformer(invitation.role),
			created_by: invitation.createdByUserId,
			updated_by: invitation.updatedByUserId
		};
	};

	if (Array.isArray(invitations)) {
		return invitations.map(transformInvitation);
	}

	return transformInvitation(invitations);
}

/**
 * Builds a query object for retrieving invitations, with optional filters and related entities.
 *
 * This function is used to dynamically construct query parameters for an API call,
 * supporting filtering by role name and eager-loading related entities like `organization`, `invitedByUser`, and `role`.
 *
 * @param {Partial<IInvite>} options - Optional filtering parameters for the invitations query.
 * - `role.name`: Filters invitations by the name of the assigned role.
 *
 * @returns {Record<string, any>} A query object formatted for use with APIs expecting nested query parameters.
 */
export function getInvitationsQuery(
	options: Partial<IInvite>
): Record<string, any> {
	const relations = ['organization', 'invitedByUser', 'role'];

	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	if (options?.role?.name) {
		query['where[role][name]'] = options?.role.name;
	}

	relations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
}

/**
 * Builds the query object used when deleting an invitation.
 * Includes tenant and organization identifiers.
 *
 * @returns Record<string, any> Query parameters for deletion request
 */
export function deleteInvitationQuery(): Record<string, any> {
	const query: Record<string, any> = {
		tenantId: currentTenantId(),
		organizationId: getCurrentOrganizationSlug()
	};

	return query;
}
