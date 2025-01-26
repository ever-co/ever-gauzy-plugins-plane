import { Module, forwardRef } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ProjectModule } from '../project/project.module';

@Module({
	imports: [
		RouterModule.register([{ path: '/api/users', module: UserModule }]),
		forwardRef(() => ProjectModule)
	],
	providers: [UserService],
	controllers: [UserController],
	exports: [UserService]
})
export class UserModule {}
