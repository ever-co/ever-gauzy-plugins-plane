import { Module, forwardRef } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { ProjectModuleService } from './project-module.service';
import { ProjectModuleController } from './project-module.controller';

@Module({
	imports: [forwardRef(() => ProjectModule)],
	providers: [ProjectModuleService],
	controllers: [ProjectModuleController],
	exports: [ProjectModuleService],
})
export class ProjectModuleModule {}
