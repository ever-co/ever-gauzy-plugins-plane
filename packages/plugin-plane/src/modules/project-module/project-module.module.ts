import { Module, forwardRef } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { ProjectModuleService } from './project-module.service';
import { ProjectModuleController } from './project-module.controller';
import { EmployeePropertiesModule } from '../employee-properties/employee-properties.module';
import { IssueLinksModule } from '../issue-links/issue-links.module';

@Module({
	imports: [forwardRef(() => ProjectModule), EmployeePropertiesModule, IssueLinksModule],
	providers: [ProjectModuleService],
	controllers: [ProjectModuleController],
	exports: [ProjectModuleService]
})
export class ProjectModuleModule {}
