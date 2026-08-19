import type { ProductStatus } from "@/features/products/types/product.types";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Đang bán", className: "bg-emerald-100 text-emerald-700" },
  DRAFT: { label: "Bản nháp", className: "bg-slate-100 text-slate-700" },
  HIDDEN: { label: "Đang ẩn", className: "bg-orange-100 text-orange-700" },
};

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = (
  Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[]
).map((value) => ({ value, label: PRODUCT_STATUS_LABELS[value].label }));

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { label, className } = PRODUCT_STATUS_LABELS[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>
  );
}
