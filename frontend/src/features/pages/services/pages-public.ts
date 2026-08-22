import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type { PublicPage } from "@/features/pages/types/page-public.types";

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

export async function getPageBySlug(slug: string): Promise<PublicPage | null> {
  const res = await fetch(`${API_URL}/pages/public/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  return handleResponse(res, "Không tải được trang");
}
