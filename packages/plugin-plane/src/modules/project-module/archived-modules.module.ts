import { Module, forwardRef } from '@nestjs/common';
import { ProjectModuleModule } from './project-module.module';
import { ArchivedModulesController } from './archived-modules.controller';

@Module({
	imports: [forwardRef(() => ProjectModuleModule)],
	controllers: [ArchivedModulesController]
})
export class ArchivedModulesModule {}
