export interface ICheckUserExist {
    existing: boolean;
    status: CheckUserExist
}

export interface IEmailInput {
    email: string;
}

export interface IPasswordInput {
    password: string;
}

export enum CheckUserExist {
  MAGIC_CODE = "MAGIC_CODE",
  CREDENTIALS = "CREDENTIALS",
}