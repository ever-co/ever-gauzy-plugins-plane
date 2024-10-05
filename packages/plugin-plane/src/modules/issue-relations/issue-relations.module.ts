import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { IssueRelationsService } from './issue-relations.service';
import { IssueRelationsController } from './issue-relations.controller';

@Module({
	imports: [
		RouterModule.register([
			{
				path: '/issue-relation',
				module: IssueRelationsModule,
			},
		]),
	],
	providers: [IssueRelationsService],
	controllers: [IssueRelationsController],
	exports: [IssueRelationsService],
})
export class IssueRelationsModule {}
