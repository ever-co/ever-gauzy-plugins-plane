import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';

@Module({
	imports: [
		RouterModule.register([{ path: '/issues', module: IssuesModule }]),
	],
	providers: [IssuesService],
	controllers: [IssuesController],
	exports: [IssuesService],
})
export class IssuesModule {}
