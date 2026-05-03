import { Module } from '@nestjs/common';
import { StickiesService } from './stickies.service';
import { StickiesController } from './stickies.controller';

@Module({
	providers: [StickiesService],
	controllers: [StickiesController],
	exports: [StickiesService]
})
export class StickiesModule {}
