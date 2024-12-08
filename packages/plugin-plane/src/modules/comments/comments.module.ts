import { Module, forwardRef } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { ReactionsModule } from '../reactions/reactions.module';

@Module({
	imports: [forwardRef(() => ProjectModule), ReactionsModule],
	providers: [CommentsService],
	controllers: [CommentsController],
	exports: [CommentsService]
})
export class CommentsModule {}
