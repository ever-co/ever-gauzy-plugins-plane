import { Module, forwardRef } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { ProjectModuleService } from './project-module.service';
import { ProjectModuleController } from './project-module.controller';
import { UserFavoritesModule } from '../user-favorites/user-favorites.module';
import { EmployeePropertiesModule } from '../employee-properties/employee-properties.module';

@Module({
	imports: [
		forwardRef(() => ProjectModule),
		forwardRef(() => UserFavoritesModule),
		EmployeePropertiesModule
	],
	providers: [ProjectModuleService],
	controllers: [ProjectModuleController],
	exports: [ProjectModuleService]
})
export class ProjectModuleModule {}
