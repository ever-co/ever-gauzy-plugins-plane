import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('User routes')
@Controller()
export class UserController {
	constructor(private readonly _userService: UserService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get my profile' })
	@Get('me/profile')
	async getMyProfile() {
		return this._userService.getMyProfile();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get my settings' })
	@Get('me/settings')
	async getMySettings() {
		return this._userService.getMySettings();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get my workspaces' })
	@Get('me/workspaces')
	async getMyWorkspaces() {
		return this._userService.getMyWorkspaces();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get my infos' })
	@Get('me')
	async getMe() {
		return this._userService.getMe();
	}
}
