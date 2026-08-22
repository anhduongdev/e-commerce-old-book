import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type {
  Page,
  PageListResponse,
  PagePayload,
  PageUpdatePayload,
} from "@/features/pages/types/page.types";

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

export interface ListPagesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listPages(
  params: ListPagesParams = {},
): Promise<PageListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const res = await fetch(`${API_URL}/pages?${query.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh sách trang");
}

export async function getPage(id: string): Promise<Page> {
  const res = await fetch(`${API_URL}/pages/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được trang");
}

export async function createPage(payload: PagePayload): Promise<Page> {
  const res = await fetch(`${API_URL}/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Tạo trang thất bại");
}

export async function updatePage(
  id: string,
  payload: PageUpdatePayload,
): Promise<Page> {
  const res = await fetch(`${API_URL}/pages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Cập nhật trang thất bại");
}

export async function deletePage(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/pages/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse(res, "Xóa trang thất bại");
}
