import { Module } from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { EstimatesController } from './estimates.controller';

@Module({
	providers: [EstimatesService],
	controllers: [EstimatesController],
	exports: [EstimatesService]
})
export class EstimatesModule {}
