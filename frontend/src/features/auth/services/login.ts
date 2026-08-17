import type {
  ApiErrorResponse,
  LoginPayload,
  LoginResponse,
} from "@/features/auth/types/login.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export async function loginUser(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `Đăng nhập thất bại (mã lỗi ${res.status})`);
    throw new Error(message);
  }

  return res.json();
}
