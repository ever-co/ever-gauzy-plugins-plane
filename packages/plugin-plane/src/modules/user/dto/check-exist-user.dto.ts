import { IntersectionType, PartialType } from "@nestjs/swagger";
import { UserEmailDTO } from "./user-email.dto";
import { UserPasswordDTO } from "./user-password.dto";
import { IEmailInput, IPasswordInput } from "@plane-plugin/models";

/**
 *  check exist User DTO validation
 */
export class CheckExistUserDTO
	extends IntersectionType(UserEmailDTO, PartialType(UserPasswordDTO))
	implements IEmailInput, Partial<IPasswordInput> {}
