import type { ApiErrorResponse } from "@/features/auth/types/login.types";
import type {
  Post,
  PostListResponse,
  PostPayload,
  PostStatus,
  PostUpdatePayload,
} from "@/features/posts/types/post.types";

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

export interface ListPostsParams {
  search?: string;
  status?: PostStatus;
  page?: number;
  pageSize?: number;
}

export async function listPosts(params: ListPostsParams = {}): Promise<PostListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const res = await fetch(`${API_URL}/posts?${query.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được danh sách bài viết");
}

export async function getPost(id: string): Promise<Post> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res, "Không tải được bài viết");
}

export async function createPost(payload: PostPayload): Promise<Post> {
  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Tạo bài viết thất bại");
}

export async function updatePost(id: string, payload: PostUpdatePayload): Promise<Post> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Cập nhật bài viết thất bại");
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse(res, "Xóa bài viết thất bại");
}

export async function uploadPostImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/uploads/posts/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res, "Tải ảnh lên thất bại");
}
