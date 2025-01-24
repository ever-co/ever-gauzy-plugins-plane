import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { TimezonesController } from './timezones.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/api/timezones', module: TimezonesModule }
		])
	],
	controllers: [TimezonesController]
})
export class TimezonesModule {}
