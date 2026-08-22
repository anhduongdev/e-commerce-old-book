"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getPage } from "@/features/pages/services/pages";
import type { Page } from "@/features/pages/types/page.types";
import { PageForm } from "@/features/pages/components/PageForm";

export function PageFormPage({
  mode,
  pageId,
}: {
  mode: "create" | "edit";
  pageId?: string;
}) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !pageId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPage(pageId!);
        if (cancelled) return;
        setPage(result);
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
  }, [mode, pageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || (mode === "edit" && !page)) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-error">{error ?? "Không tìm thấy trang"}</p>
        <Link
          href="/admin/pages"
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
        <Link href="/admin/pages" className="hover:text-text">
          Admin / Trang nội dung
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">
          {mode === "create" ? "Tạo mới" : "Chỉnh sửa"}
        </span>
      </nav>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-text">
          {mode === "create" ? "Tạo trang mới" : "Chỉnh sửa trang"}
        </h1>
        <p className="text-sm text-text-secondary">
          {mode === "create"
            ? "Thêm trang nội dung mới, ví dụ như trang chính sách hoặc trang giới thiệu."
            : "Cập nhật nội dung hiển thị công khai của trang này."}
        </p>
      </div>

      <PageForm mode={mode} page={page ?? undefined} />
    </div>
  );
}
