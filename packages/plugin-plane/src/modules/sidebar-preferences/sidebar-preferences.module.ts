import { Module } from '@nestjs/common';
import { SidebarPreferencesService } from './sidebar-preferences.service';
import { SidebarPreferencesController } from './sidebar-preferences.controller';

@Module({
	providers: [SidebarPreferencesService],
	controllers: [SidebarPreferencesController],
	exports: [SidebarPreferencesService]
})
export class SidebarPreferencesModule {}
