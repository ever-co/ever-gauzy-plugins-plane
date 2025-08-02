import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ID } from '@plane-plugin/models';
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
		return await this._issueViewService.findOne({ token: token });
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
