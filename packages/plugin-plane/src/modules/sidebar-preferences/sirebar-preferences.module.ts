import { Module } from '@nestjs/common';
import { SidebarPreferencesService } from './sirebar-preferences.service';
import { SidebarPreferencesController } from './sirebar-preferences.controller';

@Module({
	providers: [SidebarPreferencesService],
	controllers: [SidebarPreferencesController],
	exports: [SidebarPreferencesService]
})
export class SidebarPreferencesModule {}
