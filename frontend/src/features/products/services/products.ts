import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type {
  ProductDetail,
  ProductListResponse,
  ProductPayload,
} from "@/features/products/types/product.types";

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

export interface ListProductsParams {
  search?: string;
  status?: string;
  seriesId?: string;
  categoryId?: string;
  outOfStock?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listProducts(
  params: ListProductsParams = {},
): Promise<ProductListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.seriesId) query.set("seriesId", params.seriesId);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.outOfStock !== undefined) query.set("outOfStock", String(params.outOfStock));
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const res = await fetch(`${API_URL}/products?${query.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh sách sản phẩm");
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được sản phẩm");
}

export async function createProduct(payload: ProductPayload): Promise<ProductDetail> {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Tạo sản phẩm thất bại");
}

export async function updateProduct(
  id: string,
  payload: Omit<ProductPayload, "slug">,
): Promise<ProductDetail> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Cập nhật sản phẩm thất bại");
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse(res, "Xóa sản phẩm thất bại");
}

export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/uploads/products/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res, "Tải ảnh lên thất bại");
}
