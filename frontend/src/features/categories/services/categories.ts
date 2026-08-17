import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type {
  Category,
  CategoryListResponse,
  CategoryPayload,
  ReorderItem,
} from "@/features/categories/types/category.types";

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

export interface ListCategoriesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listCategories(
  params: ListCategoriesParams = {},
): Promise<CategoryListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const res = await fetch(`${API_URL}/categories?${query.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh sách danh mục");
}

export async function getCategory(id: string): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh mục");
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const res = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Tạo danh mục thất bại");
}

export async function updateCategory(
  id: string,
  payload: Omit<CategoryPayload, "slug">,
): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Cập nhật danh mục thất bại");
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse(res, "Xóa danh mục thất bại");
}

export async function reorderCategories(items: ReorderItem[]): Promise<void> {
  const res = await fetch(`${API_URL}/categories/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  await handleResponse(res, "Sắp xếp danh mục thất bại");
}

export async function uploadCategoryImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/uploads/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res, "Tải ảnh lên thất bại");
}
