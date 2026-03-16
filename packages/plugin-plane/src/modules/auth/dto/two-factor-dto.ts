import { IntersectionType } from '@nestjs/swagger';

import {
	IUserCodeInput,
	IUserEmailInput,
	IUserTokenInput
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	IncludeTeamsDTO,
	UserCodeDTO,
	UserEmailDTO,
	UserTokenDTO
} from '../../user/dto';

/**
 * Workspace signin email verify DTO validation
 */
export class WorkspaceSigninEmailVerifyDTO
	extends IntersectionType(UserEmailDTO, UserCodeDTO, IncludeTeamsDTO)
	implements IUserEmailInput, IUserCodeInput {}

/**
 * Workspace signin DTO validation
 */
export class WorkspaceSigninDTO
	extends IntersectionType(UserEmailDTO, UserTokenDTO)
	implements IUserEmailInput, IUserTokenInput {}
