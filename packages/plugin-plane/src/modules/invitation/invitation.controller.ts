import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import { CreateInvitationDTO } from './dto';

@ApiTags('Invitations')
@Controller()
export class InvitationController {
	constructor(private readonly _issueViewService: InvitationService) {}

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

	@Get()
	@ApiOperation({ summary: 'Get workspaces Invitations' })
	@ApiResponse({
		status: 201,
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
}
