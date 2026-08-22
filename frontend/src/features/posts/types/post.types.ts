export type PostStatus = "DRAFT" | "PUBLISHED";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  thumbnailUrl: string | null;
  status: PostStatus;
  authorId: string | null;
  // Only present on some responses (e.g. the public detail-by-slug endpoint) — check before using.
  authorName?: string | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostListResponse {
  items: Post[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PostPayload {
  title: string;
  slug: string; // included on create — slug is immutable after creation
  excerpt?: string;
  content?: string;
  thumbnailUrl?: string;
  status: PostStatus;
}

export type PostUpdatePayload = Omit<PostPayload, "slug">;
