import { Module } from '@nestjs/common';
import { IntakeIssuesService } from './intake-issues.service';
import { IntakeIssuesController } from './intake-issues.controller';
import { IssuesModule } from '../issues.module';
import { StatesModule } from '../../states/states.module';

@Module({
	imports: [IssuesModule, StatesModule],
	providers: [IntakeIssuesService],
	controllers: [IntakeIssuesController]
})
export class IntakeIssuesModule {}
