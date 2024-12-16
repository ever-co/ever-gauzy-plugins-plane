import { forwardRef, Module } from '@nestjs/common';
import { CyclesService } from './cycles.service';
import { CyclesController } from './cycles.controller';
import { ProjectModule } from '../project/project.module';
import { IssuesModule } from '../issues/issues.module';
import { EmployeePropertiesModule } from '../employee-properties/employee-properties.module';

@Module({
	imports: [
		forwardRef(() => ProjectModule),
		IssuesModule,
		EmployeePropertiesModule
	],
	providers: [CyclesService],
	controllers: [CyclesController],
	exports: [CyclesService]
})
export class CyclesModule {}
