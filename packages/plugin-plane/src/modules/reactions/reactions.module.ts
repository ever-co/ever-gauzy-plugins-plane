import { Module } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';

@Module({
  providers: [ReactionsService],
  controllers: [ReactionsController]
})
export class ReactionsModule {}
