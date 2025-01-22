import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApiFetchService } from './api-fetch.service';
@Global()
@Module({
	imports: [HttpModule.register({ timeout: 240000, maxRedirects: 2 })],
	providers: [ApiFetchService],
	exports: [ApiFetchService]
})
export class ApiFetchModule {}
