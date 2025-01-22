import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';

@Module({
	imports: [
		RouterModule.register([{ path: '/auth', module: AuthModule }]),
		UserModule
	],
	providers: [AuthService],
	controllers: [AuthController]
})
export class AuthModule {}
