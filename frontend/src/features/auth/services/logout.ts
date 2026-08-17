import type { ApiErrorResponse } from "@/features/auth/types/login.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export async function logoutUser(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `Đăng xuất thất bại (mã lỗi ${res.status})`);
    throw new Error(message);
  }
}
