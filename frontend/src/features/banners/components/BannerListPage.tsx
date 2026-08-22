"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { listBanners } from "@/features/banners/services/banners";
import type { Banner, BannerPosition } from "@/features/banners/types/banner.types";
import { BannerStatsCards } from "@/features/banners/components/BannerStatsCards";
import { BannerTable } from "@/features/banners/components/BannerTable";
import { BannerReorderPanel } from "@/features/banners/components/BannerReorderPanel";
import { DeleteBannerModal } from "@/features/banners/components/DeleteBannerModal";

const PAGE_SIZE = 10;

const POSITION_OPTIONS: { value: BannerPosition; label: string }[] = [
  { value: "HOME_HERO", label: "Banner chính trang chủ" },
  { value: "HOME_SUB", label: "Banner phụ trang chủ" },
  { value: "SIDEBAR", label: "Banner thanh bên" },
];

export function BannerListPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<"all" | BannerPosition>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  async function loadBanners() {
    try {
      const result = await listBanners({ pageSize: 500 });
      setBanners(result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được banner");
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    setLoading(true);
    setError(null);
    void loadBanners();
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOnMount() {
      try {
        const result = await listBanners({ pageSize: 500 });
        if (cancelled) return;
        setBanners(result.items);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được banner");
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
    return banners.filter((banner) => {
      const matchesSearch =
        !keyword ||
        (banner.title ?? "").toLowerCase().includes(keyword) ||
        (banner.linkUrl ?? "").toLowerCase().includes(keyword);
      const matchesPosition = positionFilter === "all" || banner.position === positionFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? banner.isActive : !banner.isActive);
      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [banners, search, positionFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const now = Date.now();
  const activeCount = banners.filter((b) => {
    if (!b.isActive) return false;
    const afterStart = !b.startAt || new Date(b.startAt).getTime() <= now;
    const beforeEnd = !b.endAt || new Date(b.endAt).getTime() >= now;
    return afterStart && beforeEnd;
  }).length;
  const scheduledCount = banners.filter(
    (b) => b.startAt && new Date(b.startAt).getTime() > now,
  ).length;
  const disabledCount = banners.filter((b) => !b.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="text-sm text-text-secondary">Admin / Banner</nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-text">Quản lý banner</h1>
        </div>
        <Link
          href="/admin/banners/new"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} aria-hidden="true" />
          Thêm banner mới
        </Link>
      </div>

      <BannerStatsCards
        total={banners.length}
        active={activeCount}
        scheduled={scheduledCount}
        disabled={disabledCount}
      />

      {error ? (
        <p className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
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
                placeholder="Tìm kiếm banner..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
              />
            </div>
            <select
              value={positionFilter}
              onChange={(e) => {
                setPositionFilter(e.target.value as typeof positionFilter);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text outline-none"
            >
              <option value="all">Vị trí: Tất cả</option>
              {POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              <BannerTable banners={paginated} onDeleteRequest={setDeleteTarget} />

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
                <p>
                  Hiển thị {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} đến{" "}
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} trong tổng số{" "}
                  {filtered.length} banner
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
        </div>

        <div className="space-y-6">
          <BannerReorderPanel banners={banners} onReordered={() => void loadBanners()} />
        </div>
      </div>

      {deleteTarget ? (
        <DeleteBannerModal
          banner={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            void loadBanners();
          }}
        />
      ) : null}
    </div>
  );
}
