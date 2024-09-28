import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Module({
	providers: [CommentsService],
	exports: [CommentsService],
})
export class CommentsModule {}
