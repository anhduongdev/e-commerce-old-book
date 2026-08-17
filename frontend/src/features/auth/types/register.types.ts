export interface RegisterFormValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
