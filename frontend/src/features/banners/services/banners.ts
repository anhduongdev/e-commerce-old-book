import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type {
  Banner,
  BannerListResponse,
  BannerPayload,
  BannerPosition,
  ReorderItem,
} from "@/features/banners/types/banner.types";

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

export interface ListBannersParams {
  search?: string;
  position?: BannerPosition;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listBanners(
  params: ListBannersParams = {},
): Promise<BannerListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.position) query.set("position", params.position);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const res = await fetch(`${API_URL}/banners?${query.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh sách banner");
}

export async function getBanner(id: string): Promise<Banner> {
  const res = await fetch(`${API_URL}/banners/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được banner");
}

export async function createBanner(payload: BannerPayload): Promise<Banner> {
  const res = await fetch(`${API_URL}/banners`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Tạo banner thất bại");
}

export async function updateBanner(id: string, payload: BannerPayload): Promise<Banner> {
  const res = await fetch(`${API_URL}/banners/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Cập nhật banner thất bại");
}

export async function deleteBanner(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/banners/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse(res, "Xóa banner thất bại");
}

export async function reorderBanners(items: ReorderItem[]): Promise<void> {
  const res = await fetch(`${API_URL}/banners/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  await handleResponse(res, "Sắp xếp banner thất bại");
}

export async function uploadBannerImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/uploads/banners/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res, "Tải ảnh lên thất bại");
}
