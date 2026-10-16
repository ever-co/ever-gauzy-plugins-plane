import { Module } from '@nestjs/common';
import { EmployeePropertiesModule } from '../employee-properties/employee-properties.module';
import { WorkspacePreferencesService } from './workspace-preferences.service';
import { WorkspacePreferencesController } from './workspace-preferences.controller';

@Module({
	imports: [EmployeePropertiesModule],
	providers: [WorkspacePreferencesService],
	controllers: [WorkspacePreferencesController],
	exports: [WorkspacePreferencesService]
})
export class WorkspacePreferencesModule {}
