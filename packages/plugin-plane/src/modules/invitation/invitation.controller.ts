import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ID, IInvitationAcceptInput } from '@ever-gauzy/plugin-integration-plane-models';
import { InvitationService } from './invitation.service';
import { CreateInvitationDTO } from './dto';
import { Public } from '../auth/auth.guard';

@ApiTags('Invitations')
@Controller()
export class InvitationController {
	constructor(private readonly _issueViewService: InvitationService) {}

	/**
	 * Create one or multiple workspace invitations by email.
	 *
	 * @param input - An object containing a list of email invitations.
	 * @returns The result of the invitation creation.
	 */
	@Post()
	@ApiOperation({ summary: 'Create Invitations' })
	@ApiResponse({
		status: 201,
		description: 'Invitation(s) successfully sent',
		type: CreateInvitationDTO
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid request'
	})
	async createBulkWorksapceInvitation(
		@Body() input: { emails: CreateInvitationDTO[] }
	) {
		return await this._issueViewService.createBulkWorksapceInvitation(
			input
		);
	}

	/**
	 * Retrieve all invitations for the current workspace.
	 *
	 * @returns A list of existing invitations.
	 */
	@Get()
	@ApiOperation({ summary: 'Get workspaces Invitations' })
	@ApiResponse({
		status: 200,
		description: 'Invitations found',
		type: CreateInvitationDTO
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid request'
	})
	async findAll() {
		return await this._issueViewService.findAll();
	}

	/**
	 * Retrieves a workspace invitation using the provided token.
	 *
	 * This endpoint is publicly accessible and returns the invitation associated with the given token.
	 *
	 * @param {string} token - The invitation token extracted from the URL.
	 * @returns The invitation data if found.
	 * @throws {BadRequestException} If the request is invalid or the invitation is not found.
	 */
	@Public()
	@Get(':token/join')
	@ApiOperation({ summary: 'Get workspace invitation by token' })
	@ApiResponse({
		status: 200,
		description: 'Invitation found'
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid request'
	})
	async findOneJoin(@Param('token') token: string) {
		return await this._issueViewService.findOne({ token });
	}

	/**
	 * Accepts a workspace invitation using a token and email address.
	 *
	 * This publicly accessible endpoint is used to accept an invitation by providing the invitation token
	 * and the email address associated with it.
	 *
	 * @param {string} token - The invitation token from the URL.
	 * @param {string} email - The email address associated with the invitation.
	 * @returns A message indicating whether the invitation was accepted.
	 * @throws {BadRequestException} If the token is invalid or the request is malformed.
	 */
	@Public()
	@Post(':token/join')
	@ApiOperation({ summary: 'Accept invitation by token' })
	@ApiResponse({
		status: 200,
		description: 'Invitation accepted'
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid request'
	})
	async acceptOrReject(
		@Param('token') token: string,
		@Body() input: IInvitationAcceptInput
	) {
		return await this._issueViewService.acceptOrReject({
			token,
			...input
		});
	}

	/**
	 * Delete a specific workspace invitation by its ID.
	 *
	 * @param id - The ID of the invitation to delete.
	 * @returns The result of the deletion operation.
	 */
	@Delete(':id')
	@ApiOperation({ summary: 'Delete Invitation' })
	@ApiResponse({
		status: 201,
		description: 'Invitation deleted'
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid request'
	})
	async delete(@Param('id') id: ID) {
		return await this._issueViewService.delete(id);
	}
}
