import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type { BlogPostDetail, BlogPostListResponse } from "@/features/blog/types/blog.types";

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

export interface ListBlogPostsParams {
  page?: number;
  pageSize?: number;
}

export async function listBlogPosts(
  params: ListBlogPostsParams = {},
): Promise<BlogPostListResponse> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const res = await fetch(`${API_URL}/blog/posts?${query.toString()}`, {
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh sách bài viết");
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const res = await fetch(`${API_URL}/blog/posts/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  return handleResponse(res, "Không tải được bài viết");
}
