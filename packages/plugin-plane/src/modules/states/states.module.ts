import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { StatesService } from './states.service';
import { StatesController } from './states.controller';

@Module({
	imports: [
		RouterModule.register([{ path: '/states', module: StatesModule }]),
	],
	providers: [StatesService],
	controllers: [StatesController],
	exports: [StatesService],
})
export class StatesModule {}
