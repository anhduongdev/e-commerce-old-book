"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import {
  listCategories,
  updateCategory,
} from "@/features/categories/services/categories";
import type { Category } from "@/features/categories/types/category.types";
import { CategoryStatsCards } from "@/features/categories/components/CategoryStatsCards";
import { CategoryTable } from "@/features/categories/components/CategoryTable";
import { CategoryHierarchyPanel } from "@/features/categories/components/CategoryHierarchyPanel";
import { FeaturedCategoriesPanel } from "@/features/categories/components/FeaturedCategoriesPanel";
import { DeleteCategoryModal } from "@/features/categories/components/DeleteCategoryModal";

const PAGE_SIZE = 10;

export function CategoryListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  async function loadCategories() {
    try {
      const result = await listCategories({ pageSize: 500 });
      setCategories(result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh mục");
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    setLoading(true);
    setError(null);
    void loadCategories();
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOnMount() {
      try {
        const result = await listCategories({ pageSize: 500 });
        if (cancelled) return;
        setCategories(result.items);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được danh mục");
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
    return categories.filter((category) => {
      const matchesSearch =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        category.slug.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? category.isActive : !category.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const visibleCount = categories.filter((c) => c.isActive).length;
  const hiddenCount = categories.length - visibleCount;

  async function handleToggleActive(category: Category) {
    try {
      await updateCategory(category.id, {
        name: category.name,
        parentId: category.parentId,
        description: category.description ?? undefined,
        imageUrl: category.imageUrl ?? undefined,
        sortOrder: category.sortOrder,
        isActive: !category.isActive,
        isFeatured: category.isFeatured,
        searchKeywords: category.searchKeywords ?? undefined,
      });
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="text-sm text-brand-600">Admin / Danh mục</nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-brand-900">
            Quản lý danh mục
          </h1>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-900"
        >
          <Plus size={16} aria-hidden="true" />
          Thêm danh mục mới
        </Link>
      </div>

      <CategoryStatsCards
        total={categories.length}
        visible={visibleCount}
        hidden={hiddenCount}
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
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
                placeholder="Tìm kiếm danh mục..."
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
              <CategoryTable
                categories={paginated}
                onDeleteRequest={setDeleteTarget}
                onToggleActive={(category) => void handleToggleActive(category)}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-brand-600">
                <p>
                  Hiển thị {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} đến{" "}
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} trong tổng số{" "}
                  {filtered.length} danh mục
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

        <div className="space-y-6">
          <CategoryHierarchyPanel categories={categories} />
          <FeaturedCategoriesPanel categories={categories} onReordered={() => void loadCategories()} />
        </div>
      </div>

      {deleteTarget ? (
        <DeleteCategoryModal
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            void loadCategories();
          }}
        />
      ) : null}
    </div>
  );
}
