import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type {
  Series,
  SeriesListResponse,
  SeriesPayload,
} from "@/features/series/types/series.types";

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

export interface ListSeriesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listSeries(
  params: ListSeriesParams = {},
): Promise<SeriesListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const res = await fetch(`${API_URL}/series?${query.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh sách bộ truyện");
}

export async function getSeries(id: string): Promise<Series> {
  const res = await fetch(`${API_URL}/series/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được bộ truyện");
}

export async function createSeries(payload: SeriesPayload): Promise<Series> {
  const res = await fetch(`${API_URL}/series`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Tạo bộ truyện thất bại");
}

export async function updateSeries(
  id: string,
  payload: Omit<SeriesPayload, "slug">,
): Promise<Series> {
  const res = await fetch(`${API_URL}/series/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Cập nhật bộ truyện thất bại");
}

export async function deleteSeries(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/series/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse(res, "Xóa bộ truyện thất bại");
}

export async function uploadSeriesImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/uploads/series/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res, "Tải ảnh lên thất bại");
}
