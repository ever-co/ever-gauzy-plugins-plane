import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICreateWorkspaceInvitationInput } from '@plane-plugin/models';
import { InvitationService } from './invitation.service';

@ApiTags('Invitations')
@Controller()
export class InvitationController {
	constructor(private readonly _issueViewService: InvitationService) {}

	@Post()
	async createBulkWorksapceInvitation(
		@Body() input: { emails: ICreateWorkspaceInvitationInput[] }
	) {
		return await this._issueViewService.createBulkWorksapceInvitation(
			input
		);
	}
}
