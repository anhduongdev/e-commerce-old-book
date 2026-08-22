"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { listPosts } from "@/features/posts/services/posts";
import type { Post, PostStatus } from "@/features/posts/types/post.types";
import { PostTable } from "@/features/posts/components/PostTable";
import { DeletePostModal } from "@/features/posts/components/DeletePostModal";

const PAGE_SIZE = 10;

export function PostListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await listPosts({
          search: search.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setPosts(result.items);
        setTotal(result.total);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được bài viết");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, page, refreshKey]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="text-sm text-text-secondary">Admin / Blog</nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-text">
            Quản lý bài viết
          </h1>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} aria-hidden="true" />
          Viết bài mới
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
          <Search size={16} className="text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm theo tiêu đề..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text outline-none"
        >
          <option value="all">Trạng thái: Tất cả</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
        </select>
        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text hover:bg-primary-lightest"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PostTable posts={posts} onDeleteRequest={setDeleteTarget} />

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
            <p>
              Hiển thị {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} đến{" "}
              {Math.min(page * PAGE_SIZE, total)} trong tổng số {total} bài viết
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 ${
                    p === page
                      ? "bg-primary text-white"
                      : "border border-border text-text hover:bg-primary-lightest"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}

      {deleteTarget ? (
        <DeletePostModal
          post={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            handleRefresh();
          }}
        />
      ) : null}
    </div>
  );
}
