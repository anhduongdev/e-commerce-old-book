"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getCategory,
  listCategories,
} from "@/features/categories/services/categories";
import type { Category } from "@/features/categories/types/category.types";
import { CategoryForm } from "@/features/categories/components/CategoryForm";

export function CategoryFormPage({
  mode,
  categoryId,
}: {
  mode: "create" | "edit";
  categoryId?: string;
}) {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [listResult, categoryResult] = await Promise.all([
          listCategories({ pageSize: 500 }),
          mode === "edit" && categoryId ? getCategory(categoryId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setAllCategories(listResult.items);
        setCategory(categoryResult);
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
  }, [mode, categoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
        <Loader2 size={24} className="animate-spin text-brand-700" />
      </div>
    );
  }

  if (error || (mode === "edit" && !category)) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-700">{error ?? "Không tìm thấy danh mục"}</p>
        <Link
          href="/admin/categories"
          className="mt-4 inline-block text-sm font-medium text-brand-700 underline"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="mb-4 text-sm text-brand-600">
        <Link href="/admin/categories" className="hover:text-brand-900">
          Admin / Danh mục
        </Link>
        <span className="mx-1">/</span>
        <span className="text-brand-900">
          {mode === "create" ? "Tạo mới" : "Chỉnh sửa"}
        </span>
      </nav>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <path
              d="M4 6c3-1.5 8-1.5 10 1v11c-2-2.5-7-2.5-10-1V6Z"
              stroke="var(--color-brand-700)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-900">
            {mode === "create" ? "Tạo danh mục mới" : "Chỉnh sửa danh mục"}
          </h1>
          <p className="text-sm text-brand-600">
            {mode === "create"
              ? "Thêm danh mục mới để tổ chức và quản lý sách hiệu quả hơn."
              : "Cập nhật thông tin danh mục để quản lý hiển thị và cấu trúc hiệu quả hơn."}
          </p>
        </div>
      </div>

      <CategoryForm mode={mode} category={category ?? undefined} allCategories={allCategories} />
    </div>
  );
}
