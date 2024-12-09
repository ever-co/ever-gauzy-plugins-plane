import { Module } from '@nestjs/common';
import { IntakeIssuesService } from './intake-issues.service';
import { IntakeIssuesController } from './intake-issues.controller';
import { StatesModule } from '../../states/states.module';

@Module({
	imports: [StatesModule],
	providers: [IntakeIssuesService],
	controllers: [IntakeIssuesController]
})
export class IntakeIssuesModule {}
