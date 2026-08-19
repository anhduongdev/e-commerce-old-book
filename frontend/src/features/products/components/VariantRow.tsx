"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { VariantRowState } from "@/features/products/components/VariantListEditor";
import { CONDITION_OPTIONS } from "@/features/products/components/ConditionGradeBadge";
import { ImageDropzone } from "@/features/products/components/ImageDropzone";

function inputClassName(hasError?: boolean) {
  return `w-full rounded-lg border bg-white px-3 py-2 text-sm text-brand-900 outline-none placeholder:text-brand-600/60 focus:border-brand-700 ${
    hasError ? "border-red-400" : "border-brand-100"
  }`;
}

export function VariantRow({
  variant,
  allowMultiple,
  onUpdate,
  onRemove,
}: {
  variant: VariantRowState;
  allowMultiple: boolean;
  onUpdate: (patch: Partial<VariantRowState>) => void;
  onRemove: () => void;
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  function handleRemoveClick() {
    if (variant.id && !confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }
    onRemove();
  }

  return (
    <div className="rounded-xl border border-brand-100 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-brand-900">SKU *</span>
          <input
            type="text"
            value={variant.sku}
            onChange={(e) => onUpdate({ sku: e.target.value })}
            placeholder="vd: doraemon-tap-001"
            className={inputClassName()}
          />
        </label>

        {allowMultiple ? (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-brand-900">Tập số</span>
            <input
              type="number"
              min={1}
              value={variant.volumeNumber}
              onChange={(e) => onUpdate({ volumeNumber: e.target.value })}
              placeholder="1"
              className={inputClassName()}
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-brand-900">Tên hiển thị</span>
          <input
            type="text"
            value={variant.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="vd: Tập 105"
            className={inputClassName()}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-brand-900">Giá bán (₫) *</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={variant.price}
            onChange={(e) => onUpdate({ price: e.target.value })}
            placeholder="0"
            className={inputClassName()}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-brand-900">Giá gốc (₫)</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={variant.compareAtPrice}
            onChange={(e) => onUpdate({ compareAtPrice: e.target.value })}
            placeholder="Để trống nếu không có"
            className={inputClassName()}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-brand-900">Số lượng tồn *</span>
          <input
            type="number"
            min={0}
            value={variant.stockQuantity}
            onChange={(e) => onUpdate({ stockQuantity: e.target.value })}
            placeholder="0"
            className={inputClassName()}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-brand-900">Tình trạng *</span>
          <select
            value={variant.conditionGrade}
            onChange={(e) => onUpdate({ conditionGrade: e.target.value as VariantRowState["conditionGrade"] })}
            className={inputClassName()}
          >
            {CONDITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-xs font-medium text-brand-900">Ghi chú tình trạng</span>
          <textarea
            value={variant.conditionNote}
            onChange={(e) => onUpdate({ conditionNote: e.target.value.slice(0, 500) })}
            rows={2}
            placeholder='vd: "ố nhẹ gáy, còn bìa rời"'
            className={inputClassName()}
          />
        </label>

        <div className="sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-xs font-medium text-brand-900">Ảnh riêng của tập</span>
          <ImageDropzone
            value={variant.imageUrl}
            onChange={(url) => onUpdate({ imageUrl: url })}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-brand-900">
          <input
            type="checkbox"
            checked={variant.isActive}
            onChange={(e) => onUpdate({ isActive: e.target.checked })}
            className="h-4 w-4 rounded border-brand-100"
          />
          Đang bán tập này
        </label>

        {confirmingRemove ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-700">Xóa tập này khỏi sản phẩm?</span>
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              className="rounded-full border border-brand-100 px-3 py-1 text-brand-900 hover:bg-brand-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full bg-red-600 px-3 py-1 text-white hover:bg-red-700"
            >
              Xác nhận xóa
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRemoveClick}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} aria-hidden="true" />
            Xóa tập
          </button>
        )}
      </div>
    </div>
  );
}
