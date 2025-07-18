import { RouterModule } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/invitations', module: InvitationModule }
		])
	],
	providers: [InvitationService],
	controllers: [InvitationController],
	exports: [InvitationService]
})
export class InvitationModule {}
