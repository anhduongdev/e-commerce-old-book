import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type {
  CatalogFilters,
  CatalogProductDetail,
  CatalogProductListResponse,
  CatalogSort,
} from "@/features/catalog/types/catalog.types";
import type { ConditionGrade } from "@/features/products/types/product.types";

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

export interface ListCatalogProductsParams {
  search?: string;
  categoryId?: string;
  author?: string;
  publisher?: string;
  conditionGrade?: ConditionGrade;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
}

export async function listCatalogProducts(
  params: ListCatalogProductsParams = {},
): Promise<CatalogProductListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.author) query.set("author", params.author);
  if (params.publisher) query.set("publisher", params.publisher);
  if (params.conditionGrade) query.set("conditionGrade", params.conditionGrade);
  if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
  query.set("sort", params.sort ?? "newest");
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 12));

  const res = await fetch(`${API_URL}/catalog/products?${query.toString()}`, {
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh sách sản phẩm");
}

export async function getCatalogFilters(): Promise<CatalogFilters> {
  const res = await fetch(`${API_URL}/catalog/filters`, {
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được bộ lọc");
}

export async function getCatalogProductBySlug(
  slug: string,
): Promise<CatalogProductDetail | null> {
  const res = await fetch(`${API_URL}/catalog/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  return handleResponse(res, "Không tải được sản phẩm");
}
