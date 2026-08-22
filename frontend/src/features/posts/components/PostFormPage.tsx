"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getPost } from "@/features/posts/services/posts";
import type { Post } from "@/features/posts/types/post.types";
import { PostForm } from "@/features/posts/components/PostForm";

export function PostFormPage({
  mode,
  postId,
}: {
  mode: "create" | "edit";
  postId?: string;
}) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !postId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPost(postId!);
        if (cancelled) return;
        setPost(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được dữ liệu");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mode, postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || (mode === "edit" && !post)) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-error">{error ?? "Không tìm thấy bài viết"}</p>
        <Link
          href="/admin/posts"
          className="mt-4 inline-block text-sm font-medium text-primary underline"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="mb-4 text-sm text-text-secondary">
        <Link href="/admin/posts" className="hover:text-text">
          Admin / Blog
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">
          {mode === "create" ? "Viết bài mới" : "Chỉnh sửa bài viết"}
        </span>
      </nav>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <path
              d="M4 6c3-1.5 8-1.5 10 1v11c-2-2.5-7-2.5-10-1V6Z"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold text-text">
            {mode === "create" ? "Viết bài mới" : "Chỉnh sửa bài viết"}
          </h1>
          <p className="text-sm text-text-secondary">
            {mode === "create"
              ? "Thêm bài viết mới cho chuyên mục blog."
              : "Cập nhật nội dung và trạng thái của bài viết."}
          </p>
        </div>
      </div>

      <PostForm mode={mode} post={post ?? undefined} />
    </div>
  );
}
