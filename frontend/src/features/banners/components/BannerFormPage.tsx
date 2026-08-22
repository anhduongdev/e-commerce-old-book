"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getBanner } from "@/features/banners/services/banners";
import type { Banner } from "@/features/banners/types/banner.types";
import { BannerForm } from "@/features/banners/components/BannerForm";

export function BannerFormPage({
  mode,
  bannerId,
}: {
  mode: "create" | "edit";
  bannerId?: string;
}) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !bannerId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getBanner(bannerId!);
        if (cancelled) return;
        setBanner(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được banner");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mode, bannerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || (mode === "edit" && !banner)) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-error">{error ?? "Không tìm thấy banner"}</p>
        <Link
          href="/admin/banners"
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
        <Link href="/admin/banners" className="hover:text-text">
          Admin / Banner
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">{mode === "create" ? "Tạo mới" : "Chỉnh sửa"}</span>
      </nav>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <rect
              x="3.5"
              y="6"
              width="17"
              height="12"
              rx="2"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
            />
            <path
              d="M3.5 15.5 8 11l3 3 4-4.5 5.5 6"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold text-text">
            {mode === "create" ? "Tạo banner mới" : "Chỉnh sửa banner"}
          </h1>
          <p className="text-sm text-text-secondary">
            {mode === "create"
              ? "Thêm banner mới để quảng bá sản phẩm và chương trình trên trang chủ."
              : "Cập nhật nội dung, vị trí và lịch hiển thị của banner."}
          </p>
        </div>
      </div>

      <BannerForm mode={mode} banner={banner ?? undefined} />
    </div>
  );
}
