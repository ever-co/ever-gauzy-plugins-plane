import { Module } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { StatesModule } from '../states/states.module';

@Module({
	imports: [
		// RouterModule.register([{ path: '/issues', module: IssuesModule }]),
		StatesModule,
	],
	providers: [IssuesService],
	controllers: [IssuesController],
	exports: [IssuesService],
})
export class IssuesModule {}
