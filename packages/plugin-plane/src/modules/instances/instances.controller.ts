import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.guard';
import { InstancesService } from './instances.service';

@Controller()
export class InstancesController {
	constructor(private readonly instancesService: InstancesService) {}

	@Get()
	@Public()
	getDefaultIntanceAndConfigs() {
		return {
			instance: this.instancesService.getDefaultInstance(),
			config: this.instancesService.getDefaultConfigs()
		};
	}
}
