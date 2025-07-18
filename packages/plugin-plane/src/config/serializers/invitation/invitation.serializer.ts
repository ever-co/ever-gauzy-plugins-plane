import {
	ICreateEmailInvitesInput,
	ICreateWorkspaceInvitationInput,
	ID,
	InvitationTypeEnum
} from '@plane-plugin/models';
import { getCurrentOrganizationSlug } from '../../credentials';

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
		inviteType: InvitationTypeEnum.USER,
		startedWorkOn: new Date(),
		invitationExpirationPeriod: 'Never',
		organizationId: getCurrentOrganizationSlug()
	};
}
