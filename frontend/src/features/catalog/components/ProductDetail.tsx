"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import type {
  CatalogProductDetail,
  CatalogVariantDetail,
} from "@/features/catalog/types/catalog.types";
import { ConditionGradeBadge } from "@/features/products/components/ConditionGradeBadge";
import { ProductGallery } from "@/features/catalog/components/ProductGallery";
import { QuantityStepper } from "@/features/catalog/components/QuantityStepper";
import { formatPriceVnd } from "@/features/catalog/utils/format";
import { addCartItem } from "@/features/cart/services/cart";

export function ProductDetail({ product }: { product: CatalogProductDetail }) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const variant = product.variants[selectedVariantIndex] ?? product.variants[0];

  if (!variant) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-text-secondary shadow-sm">
        Sản phẩm hiện không còn phiên bản nào đang bán.
      </div>
    );
  }

  const meta = [
    product.author,
    product.publisher,
    product.publishYear ? `Năm ${product.publishYear}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ProductGallery key={variant.id} images={variant.images} />

      <div className="space-y-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text">{product.name}</h1>
          {meta ? <p className="mt-1 text-sm text-text-secondary">{meta}</p> : null}
          {product.seriesName ? (
            <p className="mt-1 text-sm text-text-secondary">Thuộc bộ: {product.seriesName}</p>
          ) : null}
          {product.categories.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/san-pham?categoryId=${category.id}`}
                  className="rounded-full bg-primary-lightest px-2.5 py-1 text-xs text-primary hover:bg-primary-light"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {product.variants.length > 1 ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-text">Chọn tập</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v, index) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantIndex(index)}
                  className={`rounded-full px-3 py-2 text-sm font-medium ${
                    index === selectedVariantIndex
                      ? "bg-primary text-white"
                      : "border border-border text-text hover:bg-primary-lightest"
                  }`}
                >
                  {v.volumeNumber ? `Tập ${v.volumeNumber}` : (v.name ?? "—")}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* key={variant.id}: đổi tập thì remount panel, tự reset số lượng/lỗi/thành công */}
        <VariantPurchasePanel key={variant.id} variant={variant} />

        {product.shortDescription ? (
          <p className="text-sm text-text-secondary">{product.shortDescription}</p>
        ) : null}
      </div>

      {product.description ? (
        <div className="lg:col-span-2">
          <h2 className="mb-2 font-serif text-lg font-bold text-text">Mô tả chi tiết</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
            {product.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function VariantPurchasePanel({ variant }: { variant: CatalogVariantDetail }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const outOfStock = variant.availableQuantity <= 0;

  async function handleAddToCart() {
    setAdding(true);
    setError(null);
    setSuccess(null);
    try {
      await addCartItem({ variantId: variant.id, quantity });
      setSuccess(`Đã thêm ${quantity} vào giỏ hàng`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thêm vào giỏ hàng thất bại");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-text">{formatPriceVnd(variant.price)}</p>
          {variant.compareAtPrice ? (
            <p className="text-sm text-text-secondary line-through">
              {formatPriceVnd(variant.compareAtPrice)}
            </p>
          ) : null}
        </div>
        <ConditionGradeBadge grade={variant.conditionGrade} />
      </div>

      {variant.conditionNote ? (
        <p className="rounded-lg bg-secondary-light p-3 text-sm text-text">{variant.conditionNote}</p>
      ) : null}

      <p className="text-sm text-text-secondary">
        {outOfStock ? (
          <span className="font-medium text-error">Hết hàng</span>
        ) : (
          `Còn ${variant.availableQuantity} cuốn`
        )}
      </p>

      {!outOfStock ? (
        <QuantityStepper value={quantity} max={variant.availableQuantity} onChange={setQuantity} />
      ) : null}

      {error ? (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{success}</p>
      ) : null}

      <button
        type="button"
        disabled={outOfStock || adding}
        onClick={() => void handleAddToCart()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {adding ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingCart size={18} aria-hidden="true" />
        )}
        {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
      </button>
    </div>
  );
}
