"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import type { CatalogProduct } from "@/features/catalog/types/catalog.types";
import { ConditionGradeBadge } from "@/features/products/components/ConditionGradeBadge";
import { formatPriceVnd } from "@/features/catalog/utils/format";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

export function ProductCard({ product }: { product: CatalogProduct }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const variant = product.variants[selectedIndex] ?? product.variants[0];

  // Không còn tập nào đang bán (đã bị ẩn hết) — không hiển thị sản phẩm này.
  if (!variant) return null;

  const outOfStock = variant.availableQuantity <= 0;
  const hasMultipleVariants = product.variants.length > 1;
  const useSelect = product.variants.length > 8;
  const subtitle = [product.author, product.publisher].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-primary-lightest">
        {variant.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${BACKEND_ORIGIN}${variant.imageUrl}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Package size={32} className="text-text-secondary" aria-hidden="true" />
        )}
        {variant.imageUrl && !variant.isRealPhoto ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-primary">
            Ảnh minh họa
          </span>
        ) : null}
        {outOfStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
            Hết hàng
          </span>
        ) : null}
      </div>

      <p className="line-clamp-2 font-serif text-sm font-bold text-text">{product.name}</p>
      <p className="mt-0.5 text-xs text-text-secondary">{subtitle || " "}</p>

      {hasMultipleVariants ? (
        <div className="mt-2">
          {useSelect ? (
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-xs text-text outline-none"
            >
              {product.variants.map((v, index) => (
                <option key={v.id} value={index}>
                  {v.name ?? (v.volumeNumber ? `Tập ${v.volumeNumber}` : "Bản duy nhất")}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map((v, index) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    index === selectedIndex
                      ? "bg-primary text-white"
                      : "border border-border text-text hover:bg-primary-lightest"
                  }`}
                >
                  {v.volumeNumber ? `Tập ${v.volumeNumber}` : (v.name ?? "—")}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-base font-bold text-text">{formatPriceVnd(variant.price)}</p>
          {variant.compareAtPrice ? (
            <p className="text-xs text-text-secondary line-through">
              {formatPriceVnd(variant.compareAtPrice)}
            </p>
          ) : null}
        </div>
        <ConditionGradeBadge grade={variant.conditionGrade} />
      </div>

      {variant.conditionNote ? (
        <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{variant.conditionNote}</p>
      ) : null}

      {!outOfStock ? (
        <p className="mt-1 text-xs text-text-secondary">Còn {variant.availableQuantity} cuốn</p>
      ) : null}
    </div>
  );
}
