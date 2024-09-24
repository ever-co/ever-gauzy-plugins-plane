import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RouterModule } from '@nestjs/core';

@Module({
	imports: [
		RouterModule.register([{ path: '/api/users', module: UserModule }]),
	],
	providers: [UserService],
	controllers: [UserController],
})
export class UserModule {}
