import { Module } from '@nestjs/common';
import { EmployeePropertiesService } from './employee-properties.service';

@Module({
	providers: [EmployeePropertiesService],
	exports: [EmployeePropertiesService]
})
export class EmployeePropertiesModule {}
