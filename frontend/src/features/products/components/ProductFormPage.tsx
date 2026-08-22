"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Package } from "lucide-react";
import { getProduct } from "@/features/products/services/products";
import type { ProductDetail } from "@/features/products/types/product.types";
import { ProductForm } from "@/features/products/components/ProductForm";

export function ProductFormPage({
  mode,
  productId,
}: {
  mode: "create" | "edit";
  productId?: string;
}) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !productId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getProduct(productId!);
        if (cancelled) return;
        setProduct(result);
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
  }, [mode, productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || (mode === "edit" && !product)) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-error">{error ?? "Không tìm thấy sản phẩm"}</p>
        <Link
          href="/admin/products"
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
        <Link href="/admin/products" className="hover:text-text">
          Admin / Sản phẩm
        </Link>
        <span className="mx-1">/</span>
        <span className="text-text">
          {mode === "create" ? "Tạo mới" : "Cập nhật sản phẩm"}
        </span>
      </nav>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
          <Package size={22} className="text-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold text-text">
            {mode === "create" ? "Tạo sản phẩm mới" : "Cập nhật sản phẩm"}
          </h1>
          <p className="text-sm text-text-secondary">
            {mode === "create"
              ? "Thêm sản phẩm mới, có thể là sách lẻ hoặc thuộc một bộ truyện."
              : "Chỉnh sửa thông tin sản phẩm, các tập và ảnh liên quan."}
          </p>
        </div>
      </div>

      <ProductForm mode={mode} product={product ?? undefined} />
    </div>
  );
}
