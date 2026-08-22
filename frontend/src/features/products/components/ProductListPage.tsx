"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { listProducts } from "@/features/products/services/products";
import type { ProductListItem } from "@/features/products/types/product.types";
import { ProductStatsCards } from "@/features/products/components/ProductStatsCards";
import { ProductTable } from "@/features/products/components/ProductTable";
import { DeleteProductModal } from "@/features/products/components/DeleteProductModal";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "ACTIVE" | "DRAFT" | "HIDDEN";
type StockFilter = "all" | "inStock" | "outOfStock";

export function ProductListPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);

  async function loadProducts() {
    try {
      const result = await listProducts({ pageSize: 500 });
      setProducts(result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được sản phẩm");
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    setLoading(true);
    setError(null);
    void loadProducts();
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOnMount() {
      try {
        const result = await listProducts({ pageSize: 500 });
        if (cancelled) return;
        setProducts(result.items);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được sản phẩm");
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
    return products.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword) ||
        (item.author?.toLowerCase().includes(keyword) ?? false) ||
        (item.publisher?.toLowerCase().includes(keyword) ?? false);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "outOfStock" ? item.totalStock === 0 : item.totalStock > 0);
      return matchesSearch && matchesStatus && matchesStock;
    });
  }, [products, search, statusFilter, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const draftCount = products.filter((p) => p.status === "DRAFT").length;
  const hiddenCount = products.filter((p) => p.status === "HIDDEN").length;
  const outOfStockCount = products.filter((p) => p.totalStock === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="text-sm text-text-secondary">Admin / Sản phẩm</nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-text">
            Quản lý sản phẩm
          </h1>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} aria-hidden="true" />
          Thêm sản phẩm mới
        </Link>
      </div>

      <ProductStatsCards
        total={products.length}
        active={activeCount}
        draft={draftCount}
        hidden={hiddenCount}
        outOfStock={outOfStockCount}
      />

      {error ? (
        <p className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{error}</p>
      ) : null}

      <div className="space-y-4">
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
              placeholder="Tìm kiếm sản phẩm, tác giả, NXB..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text outline-none"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="HIDDEN">Đang ẩn</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as StockFilter);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text outline-none"
          >
            <option value="all">Tồn kho: Tất cả</option>
            <option value="inStock">Còn hàng</option>
            <option value="outOfStock">Hết hàng</option>
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
            <ProductTable products={paginated} onDeleteRequest={setDeleteTarget} />

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
              <p>
                Hiển thị {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} đến{" "}
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} trong tổng số{" "}
                {filtered.length} sản phẩm
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

      {deleteTarget ? (
        <DeleteProductModal
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            void loadProducts();
          }}
        />
      ) : null}
    </div>
  );
}
