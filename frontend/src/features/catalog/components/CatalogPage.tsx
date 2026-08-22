"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCatalogFilters, listCatalogProducts } from "@/features/catalog/services/catalog";
import type {
  CatalogFilters,
  CatalogProduct,
  CatalogSort,
} from "@/features/catalog/types/catalog.types";
import type { ConditionGrade } from "@/features/products/types/product.types";
import { FilterSidebar } from "@/features/catalog/components/FilterSidebar";
import { SearchBar } from "@/features/catalog/components/SearchBar";
import { SortSelect } from "@/features/catalog/components/SortSelect";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { Pagination } from "@/features/catalog/components/Pagination";

const PAGE_SIZE = 12;

export function CatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();

  const [filters, setFilters] = useState<CatalogFilters | null>(null);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = loadedKey !== queryKey;

  const current = useMemo(() => {
    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");
    const pageRaw = searchParams.get("page");
    return {
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      author: searchParams.get("author") ?? undefined,
      publisher: searchParams.get("publisher") ?? undefined,
      conditionGrade: (searchParams.get("conditionGrade") as ConditionGrade | null) ?? undefined,
      minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
      maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
      sort: (searchParams.get("sort") as CatalogSort | null) ?? "newest",
      page: pageRaw ? Math.max(1, Number(pageRaw)) : 1,
    };
  }, [searchParams]);

  // Mọi thay đổi (filter/sort/search) chỉ set/xóa đúng key được truyền vào,
  // các key khác giữ nguyên — đây là lý do đổi sort không làm mất filter.
  // Riêng thay đổi không phải "page" luôn reset về trang 1 vì tập kết quả đổi.
  const updateQuery = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      if (!("page" in patch)) {
        next.delete("page");
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  function clearFilters() {
    router.push(pathname);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadFilters() {
      try {
        const result = await getCatalogFilters();
        if (!cancelled) setFilters(result);
      } catch (err) {
        if (!cancelled) {
          setFiltersError(err instanceof Error ? err.message : "Không tải được bộ lọc");
        }
      }
    }

    void loadFilters();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await listCatalogProducts({ ...current, pageSize: PAGE_SIZE });
        if (cancelled) return;
        setProducts(result.items);
        setTotal(result.total);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được sản phẩm");
      } finally {
        // Đánh dấu queryKey này đã tải xong — loading suy ra từ so sánh
        // (loadedKey !== queryKey), tránh gọi setState đồng bộ ngay khi effect
        // bắt đầu chạy.
        if (!cancelled) setLoadedKey(queryKey);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [current, queryKey]);

  const hasActiveFilters = Boolean(
    current.search ||
      current.categoryId ||
      current.author ||
      current.publisher ||
      current.conditionGrade ||
      current.minPrice !== undefined ||
      current.maxPrice !== undefined,
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 text-sm text-text-secondary">
        <Link href="/" className="hover:text-text">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">Sản phẩm</span>
      </nav>

      <h1 className="mb-6 font-serif text-2xl font-bold text-text">Tất cả sản phẩm</h1>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <FilterSidebar
            filters={filters}
            filtersError={filtersError}
            current={current}
            hasActiveFilters={hasActiveFilters}
            onChange={updateQuery}
            onClear={clearFilters}
          />
        </div>

        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SearchBar
              initialValue={current.search ?? ""}
              onSearch={(value) => updateQuery({ search: value })}
            />
            <div className="flex items-center gap-3">
              <p className="whitespace-nowrap text-sm text-text-secondary">
                {loading ? "Đang tải..." : `Tìm thấy ${total} sản phẩm`}
              </p>
              <SortSelect value={current.sort} onChange={(sort) => updateQuery({ sort })} />
            </div>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{error}</p>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl bg-white p-16 shadow-sm">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <ProductGrid products={products} />
              <div className="mt-6">
                <Pagination
                  page={current.page}
                  totalPages={totalPages}
                  onChange={(page) => updateQuery({ page: String(page) })}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
