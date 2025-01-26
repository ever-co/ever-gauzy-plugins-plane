import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { TIME_ZONES } from '../../config/time-zones';

@ApiTags('Timezones')
@Controller()
export class TimezonesController {
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find timezones' })
	@Get()
	findAll() {
		return TIME_ZONES;
	}
}
