import { Module } from '@nestjs/common';
import { FileAssetsController } from './file-assets.controller';
import { FileAssetsService } from './file-assets.service';

@Module({
	controllers: [FileAssetsController],
	providers: [FileAssetsService],
	exports: [FileAssetsService]
})
export class FileAssetsModule {}
