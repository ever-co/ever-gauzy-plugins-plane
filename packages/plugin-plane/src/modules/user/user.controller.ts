import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { IUserProfile } from '@plane-plugin/models';

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

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find user project roles' })
	@Get('me/workspaces/:workspace_name/project-roles')
	async findProjectRoles() {
		return await this._userService.findProjectRoles();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update my profile' })
	@Patch('me/profile')
	async updateProfile(@Body() input: IUserProfile) {
		return this._userService.updateUserProfile(input);
	}
}
