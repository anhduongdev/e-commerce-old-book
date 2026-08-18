"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { listSeries, updateSeries } from "@/features/series/services/series";
import type { Series } from "@/features/series/types/series.types";
import { SeriesStatsCards } from "@/features/series/components/SeriesStatsCards";
import { SeriesTable } from "@/features/series/components/SeriesTable";
import { DeleteSeriesModal } from "@/features/series/components/DeleteSeriesModal";

const PAGE_SIZE = 10;

export function SeriesListPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);

  async function loadSeries() {
    try {
      const result = await listSeries({ pageSize: 500 });
      setSeries(result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bộ truyện");
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    setLoading(true);
    setError(null);
    void loadSeries();
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOnMount() {
      try {
        const result = await listSeries({ pageSize: 500 });
        if (cancelled) return;
        setSeries(result.items);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được bộ truyện");
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
    return series.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword) ||
        (item.author?.toLowerCase().includes(keyword) ?? false) ||
        (item.publisher?.toLowerCase().includes(keyword) ?? false);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.isActive : !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [series, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const visibleCount = series.filter((s) => s.isActive).length;
  const hiddenCount = series.length - visibleCount;
  const totalVolumes = series.reduce((sum, s) => sum + (s.totalVolumes ?? 0), 0);

  async function handleToggleActive(item: Series) {
    try {
      await updateSeries(item.id, {
        name: item.name,
        author: item.author ?? undefined,
        publisher: item.publisher ?? undefined,
        description: item.description ?? undefined,
        coverUrl: item.coverUrl ?? undefined,
        totalVolumes: item.totalVolumes ?? undefined,
        isActive: !item.isActive,
      });
      await loadSeries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="text-sm text-brand-600">Admin / Bộ truyện</nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-brand-900">
            Quản lý series / bộ truyện
          </h1>
        </div>
        <Link
          href="/admin/series/new"
          className="flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-900"
        >
          <Plus size={16} aria-hidden="true" />
          Thêm series mới
        </Link>
      </div>

      <SeriesStatsCards
        total={series.length}
        visible={visibleCount}
        hidden={hiddenCount}
        totalVolumes={totalVolumes}
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2">
            <Search size={16} className="text-brand-600" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm series / bộ truyện..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-brand-600/60"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-900 outline-none"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đang ẩn</option>
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-900 hover:bg-brand-50"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
            <Loader2 size={24} className="animate-spin text-brand-700" />
          </div>
        ) : (
          <>
            <SeriesTable
              series={paginated}
              onDeleteRequest={setDeleteTarget}
              onToggleActive={(item) => void handleToggleActive(item)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-brand-600">
              <p>
                Hiển thị {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} đến{" "}
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} trong tổng số{" "}
                {filtered.length} series
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-brand-100 px-3 py-1.5 disabled:opacity-40"
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
                        ? "bg-brand-700 text-white"
                        : "border border-brand-100 text-brand-900 hover:bg-brand-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-brand-100 px-3 py-1.5 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {deleteTarget ? (
        <DeleteSeriesModal
          series={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            void loadSeries();
          }}
        />
      ) : null}
    </div>
  );
}
