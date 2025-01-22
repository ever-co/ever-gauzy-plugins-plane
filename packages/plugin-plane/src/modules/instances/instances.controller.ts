import { Controller, Get } from '@nestjs/common';
import { InstancesService } from './instances.service';

@Controller()
export class InstancesController {
	constructor(private readonly instancesService: InstancesService) {}

	@Get()
	getDefaultIntanceAndConfigs() {
		return {
			instance: this.instancesService.getDefaultInstance(),
			configs: this.instancesService.getDefaultConfigs()
		};
	}
}
