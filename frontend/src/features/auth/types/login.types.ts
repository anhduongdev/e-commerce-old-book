export interface LoginFormValues {
  identifier: string;
  password: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export type { RegisterResponse as LoginResponse } from "./register.types";
export type { ApiErrorResponse } from "./register.types";
