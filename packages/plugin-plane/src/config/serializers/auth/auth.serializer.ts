import {
	IUserRegisterInput,
	IUserRegistrationInput
} from '@plane-plugin/models';

export function registerInputTranformer(
	input: IUserRegisterInput
): IUserRegistrationInput {
	return {
		user: { email: input.email },
		password: input.password,
		confirmPassword: input.confirm_password
	};
}
