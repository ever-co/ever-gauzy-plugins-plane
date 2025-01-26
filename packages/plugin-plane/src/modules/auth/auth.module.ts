import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { EmployeePropertiesModule } from '../employee-properties/employee-properties.module';

@Module({
	imports: [
		RouterModule.register([{ path: '/auth', module: AuthModule }]),
		UserModule,
		EmployeePropertiesModule
	],
	providers: [AuthService],
	controllers: [AuthController]
})
export class AuthModule {}
