export interface ICheckUserExist {
    existing: boolean;
    status: CheckUserExistEnum
}

export interface IEmailInput {
    email: string;
}

export interface IPasswordInput {
    password?: string;
}

export enum CheckUserExistEnum {
  MAGIC_CODE = "MAGIC_CODE",
  CREDENTIALS = "CREDENTIAL",
}