"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSeries } from "@/features/series/services/series";
import type { Series } from "@/features/series/types/series.types";
import { SeriesForm } from "@/features/series/components/SeriesForm";

export function SeriesFormPage({
  mode,
  seriesId,
}: {
  mode: "create" | "edit";
  seriesId?: string;
}) {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !seriesId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getSeries(seriesId!);
        if (cancelled) return;
        setSeries(result);
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
  }, [mode, seriesId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
        <Loader2 size={24} className="animate-spin text-brand-700" />
      </div>
    );
  }

  if (error || (mode === "edit" && !series)) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-700">{error ?? "Không tìm thấy bộ truyện"}</p>
        <Link
          href="/admin/series"
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
        <Link href="/admin/series" className="hover:text-brand-900">
          Admin / Bộ truyện
        </Link>
        <span className="mx-1">/</span>
        <span className="text-brand-900">
          {mode === "create" ? "Tạo mới" : "Cập nhật series"}
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
            {mode === "create" ? "Tạo bộ truyện mới" : "Cập nhật bộ truyện"}
          </h1>
          <p className="text-sm text-brand-600">
            {mode === "create"
              ? "Thêm series mới để quản lý trọn bộ sách, tập truyện và thông tin liên quan."
              : "Chỉnh sửa thông tin bộ truyện."}
          </p>
        </div>
      </div>

      <SeriesForm mode={mode} series={series ?? undefined} />
    </div>
  );
}
