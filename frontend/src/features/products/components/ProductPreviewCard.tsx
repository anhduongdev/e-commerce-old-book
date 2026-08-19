import { Package } from "lucide-react";
import type { ProductStatus } from "@/features/products/types/product.types";
import { ProductStatusBadge } from "@/features/products/components/ProductStatusBadge";
import { formatPriceVnd } from "@/features/products/utils/format";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

export function ProductPreviewCard({
  name,
  slug,
  thumbnailUrl,
  author,
  status,
  priceRange,
}: {
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  author: string;
  status: ProductStatus;
  priceRange: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-brand-900">Xem trước sản phẩm</h3>
      <div className="mt-4 overflow-hidden rounded-xl border border-brand-100">
        <div className="flex h-32 items-center justify-center bg-brand-50">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${BACKEND_ORIGIN}${thumbnailUrl}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={32} className="text-brand-600" aria-hidden="true" />
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-serif text-base font-bold text-brand-900">
              {name || "Tên sản phẩm"}
            </p>
            <ProductStatusBadge status={status} />
          </div>
          <p className="text-xs text-brand-600">{slug || "ten-san-pham"}</p>
          {author ? <p className="mt-1 text-xs text-brand-600">{author}</p> : null}
          <p className="mt-2 text-sm font-semibold text-brand-900">
            {priceRange ?? "Chưa có giá"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function formatPriceRange(prices: number[]): string | null {
  const valid = prices.filter((p) => Number.isFinite(p) && p >= 0);
  if (valid.length === 0) return null;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  return min === max ? formatPriceVnd(min) : `${formatPriceVnd(min)} – ${formatPriceVnd(max)}`;
}
