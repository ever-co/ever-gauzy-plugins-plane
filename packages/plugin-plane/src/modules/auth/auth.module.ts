import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
	imports: [RouterModule.register([{ path: '/auth', module: AuthModule }])],
	providers: [AuthService],
	controllers: [AuthController]
})
export class AuthModule {}
