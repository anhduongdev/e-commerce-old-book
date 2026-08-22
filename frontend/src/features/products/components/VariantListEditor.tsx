"use client";

import { Plus } from "lucide-react";
import type { ConditionGrade } from "@/features/products/types/product.types";
import { VariantRow } from "@/features/products/components/VariantRow";
import { suggestSku } from "@/features/products/utils/sku";

export interface VariantRowState {
  key: string;
  id?: string;
  tempKey?: string;
  sku: string;
  volumeNumber: string;
  name: string;
  price: string;
  compareAtPrice: string;
  conditionGrade: ConditionGrade;
  conditionNote: string;
  stockQuantity: string;
  isActive: boolean;
  imageUrl: string | null;
}

export function createEmptyVariant(slug: string, volumeNumber?: number): VariantRowState {
  return {
    key: crypto.randomUUID(),
    tempKey: crypto.randomUUID(),
    sku: suggestSku(slug, volumeNumber),
    volumeNumber: volumeNumber ? String(volumeNumber) : "",
    name: "",
    price: "",
    compareAtPrice: "",
    conditionGrade: "GOOD",
    conditionNote: "",
    stockQuantity: "0",
    isActive: true,
    imageUrl: null,
  };
}

export function validateVariants(
  variants: VariantRowState[],
  allowMultiple: boolean,
): string | null {
  if (variants.length === 0) return "Sản phẩm phải có ít nhất một tập/phiên bản";

  const skuSeen = new Set<string>();
  const volumeSeen = new Set<string>();
  for (const variant of variants) {
    if (!variant.sku.trim()) return "Vui lòng nhập SKU cho tất cả các tập";
    if (skuSeen.has(variant.sku.trim())) return `SKU "${variant.sku}" bị trùng`;
    skuSeen.add(variant.sku.trim());

    if (variant.price === "" || Number(variant.price) < 0) {
      return "Giá bán phải là số không âm";
    }
    if (variant.stockQuantity === "" || Number(variant.stockQuantity) < 0) {
      return "Số lượng tồn phải là số không âm";
    }

    if (allowMultiple && variant.volumeNumber) {
      if (volumeSeen.has(variant.volumeNumber)) {
        return `Tập số ${variant.volumeNumber} bị trùng`;
      }
      volumeSeen.add(variant.volumeNumber);
    }
  }
  return null;
}

export function VariantListEditor({
  variants,
  onChange,
  allowMultiple,
  slug,
}: {
  variants: VariantRowState[];
  onChange: (variants: VariantRowState[]) => void;
  allowMultiple: boolean;
  slug: string;
}) {
  function updateVariant(index: number, patch: Partial<VariantRowState>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  function addVariant() {
    const nextVolume = allowMultiple
      ? Math.max(0, ...variants.map((v) => Number(v.volumeNumber) || 0)) + 1
      : undefined;
    onChange([...variants, createEmptyVariant(slug, nextVolume)]);
  }

  return (
    <div className="space-y-3">
      {variants.map((variant, index) => (
        <VariantRow
          key={variant.key}
          variant={variant}
          allowMultiple={allowMultiple}
          onUpdate={(patch) => updateVariant(index, patch)}
          onRemove={() => removeVariant(index)}
        />
      ))}

      {allowMultiple ? (
        <button
          type="button"
          onClick={addVariant}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-primary hover:border-primary hover:bg-primary-lightest"
        >
          <Plus size={16} aria-hidden="true" />
          Thêm tập
        </button>
      ) : null}
    </div>
  );
}
