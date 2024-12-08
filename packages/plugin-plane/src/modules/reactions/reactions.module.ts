import { Module } from '@nestjs/common';
import { ReactionsService } from './reactions.service';

@Module({
	providers: [ReactionsService],
	exports: [ReactionsService]
})
export class ReactionsModule {}
