"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { listPages } from "@/features/pages/services/pages";
import type { Page } from "@/features/pages/types/page.types";
import { PageTable } from "@/features/pages/components/PageTable";
import { DeletePageModal } from "@/features/pages/components/DeletePageModal";

const PAGE_SIZE = 10;

export function PageListPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  async function loadPages() {
    try {
      const result = await listPages({ pageSize: 500 });
      setPages(result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách trang");
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    setLoading(true);
    setError(null);
    void loadPages();
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOnMount() {
      try {
        const result = await listPages({ pageSize: 500 });
        if (cancelled) return;
        setPages(result.items);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được danh sách trang");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOnMount();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return pages.filter((p) => {
      const matchesSearch =
        !keyword ||
        p.title.toLowerCase().includes(keyword) ||
        p.slug.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? p.isActive : !p.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [pages, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="text-sm text-text-secondary">Admin / Trang nội dung</nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-text">
            Quản lý trang nội dung
          </h1>
        </div>
        <Link
          href="/admin/pages/new"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} aria-hidden="true" />
          Thêm trang mới
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
            placeholder="Tìm kiếm trang..."
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
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Đang ẩn</option>
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
          <PageTable pages={paginated} onDeleteRequest={setDeleteTarget} />

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
            <p>
              Hiển thị {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} đến{" "}
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} trong tổng số{" "}
              {filtered.length} trang
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
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
                    p === currentPage
                      ? "bg-primary text-white"
                      : "border border-border text-text hover:bg-primary-lightest"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
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
        <DeletePageModal
          page={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            void loadPages();
          }}
        />
      ) : null}
    </div>
  );
}
