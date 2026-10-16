import { Module } from '@nestjs/common';
import { WorkspacePreferencesModule } from '../workspace-preferences/workspace-preferences.module';
import { SidebarPreferencesService } from './sidebar-preferences.service';
import { SidebarPreferencesController } from './sidebar-preferences.controller';

@Module({
	imports: [WorkspacePreferencesModule],
	providers: [SidebarPreferencesService],
	controllers: [SidebarPreferencesController],
	exports: [SidebarPreferencesService]
})
export class SidebarPreferencesModule {}
