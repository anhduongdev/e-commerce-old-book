"use client";

import { useState } from "react";
import type { CatalogFilters } from "@/features/catalog/types/catalog.types";
import { CONDITION_OPTIONS } from "@/features/products/components/ConditionGradeBadge";
import type { ConditionGrade } from "@/features/products/types/product.types";

export interface CurrentCatalogFilters {
  categoryId?: string;
  author?: string;
  publisher?: string;
  conditionGrade?: ConditionGrade;
  minPrice?: number;
  maxPrice?: number;
}

const selectClassName =
  "w-full rounded-lg border border-brand-100 bg-cream-dark px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-700";

export function FilterSidebar({
  filters,
  filtersError,
  current,
  hasActiveFilters,
  onChange,
  onClear,
}: {
  filters: CatalogFilters | null;
  filtersError: string | null;
  current: CurrentCatalogFilters;
  hasActiveFilters: boolean;
  onChange: (patch: Record<string, string | undefined>) => void;
  onClear: () => void;
}) {
  const [trackedMinPrice, setTrackedMinPrice] = useState(current.minPrice);
  const [minPriceInput, setMinPriceInput] = useState(
    current.minPrice !== undefined ? String(current.minPrice) : "",
  );
  const [trackedMaxPrice, setTrackedMaxPrice] = useState(current.maxPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(
    current.maxPrice !== undefined ? String(current.maxPrice) : "",
  );

  // Đồng bộ khi filter giá đổi từ bên ngoài (vd "Xóa bộ lọc") — điều chỉnh
  // state ngay trong lúc render thay vì dùng effect.
  if (current.minPrice !== trackedMinPrice) {
    setTrackedMinPrice(current.minPrice);
    setMinPriceInput(current.minPrice !== undefined ? String(current.minPrice) : "");
  }
  if (current.maxPrice !== trackedMaxPrice) {
    setTrackedMaxPrice(current.maxPrice);
    setMaxPriceInput(current.maxPrice !== undefined ? String(current.maxPrice) : "");
  }

  function applyPriceRange() {
    onChange({
      minPrice: minPriceInput.trim() || undefined,
      maxPrice: maxPriceInput.trim() || undefined,
    });
  }

  const topLevelCategories = filters?.categories.filter((c) => c.level === 1) ?? [];

  return (
    <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-brand-900">Bộ lọc</h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-brand-700 underline"
          >
            Xóa bộ lọc
          </button>
        ) : null}
      </div>

      {filtersError ? <p className="text-sm text-red-600">{filtersError}</p> : null}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-brand-900">Danh mục</h3>
        {!filters ? (
          <p className="text-sm text-brand-600">Đang tải...</p>
        ) : topLevelCategories.length === 0 ? (
          <p className="text-sm text-brand-600">Chưa có danh mục.</p>
        ) : (
          <div className="space-y-1">
            {topLevelCategories.map((parent) => {
              const children = filters.categories.filter((c) => c.parentId === parent.id);
              return (
                <div key={parent.id}>
                  <CategoryRadioRow
                    label={parent.name}
                    active={current.categoryId === parent.id}
                    onSelect={() =>
                      onChange({
                        categoryId: current.categoryId === parent.id ? undefined : parent.id,
                      })
                    }
                  />
                  {children.length > 0 ? (
                    <div className="ml-4 space-y-1">
                      {children.map((child) => (
                        <CategoryRadioRow
                          key={child.id}
                          label={child.name}
                          active={current.categoryId === child.id}
                          onSelect={() =>
                            onChange({
                              categoryId: current.categoryId === child.id ? undefined : child.id,
                            })
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-brand-900">Tác giả</h3>
        <select
          value={current.author ?? ""}
          onChange={(e) => onChange({ author: e.target.value || undefined })}
          className={selectClassName}
        >
          <option value="">Tất cả tác giả</option>
          {(filters?.authors ?? []).map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-brand-900">Nhà xuất bản</h3>
        <select
          value={current.publisher ?? ""}
          onChange={(e) => onChange({ publisher: e.target.value || undefined })}
          className={selectClassName}
        >
          <option value="">Tất cả nhà xuất bản</option>
          {(filters?.publishers ?? []).map((publisher) => (
            <option key={publisher} value={publisher}>
              {publisher}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-brand-900">Khoảng giá (₫)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            onBlur={applyPriceRange}
            placeholder="Từ"
            className={selectClassName}
          />
          <span className="text-brand-600">–</span>
          <input
            type="number"
            min={0}
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            onBlur={applyPriceRange}
            placeholder="Đến"
            className={selectClassName}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-brand-900">Tình trạng</h3>
        <div className="flex flex-wrap gap-2">
          {CONDITION_OPTIONS.map((option) => {
            const active = current.conditionGrade === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ conditionGrade: active ? undefined : option.value })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-brand-700 text-white"
                    : "border border-brand-100 text-brand-900 hover:bg-brand-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CategoryRadioRow({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm ${
        active ? "bg-brand-100 font-medium text-brand-900" : "text-brand-600 hover:bg-brand-50"
      }`}
    >
      {label}
    </button>
  );
}
