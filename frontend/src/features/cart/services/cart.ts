import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type { AddCartItemPayload, AddCartItemResponse } from "@/features/cart/types/cart.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `${fallbackMessage} (mã lỗi ${res.status})`);
    throw new Error(message);
  }
  return res.json();
}

export async function addCartItem(
  payload: AddCartItemPayload,
): Promise<AddCartItemResponse> {
  const res = await fetch(`${API_URL}/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Thêm vào giỏ hàng thất bại");
}
