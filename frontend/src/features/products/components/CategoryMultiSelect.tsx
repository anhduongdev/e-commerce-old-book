"use client";

import { useEffect, useState } from "react";
import { listCategories } from "@/features/categories/services/categories";
import type { Category } from "@/features/categories/types/category.types";

export function CategoryMultiSelect({
  selectedIds,
  primaryId,
  onChange,
}: {
  selectedIds: string[];
  primaryId: string | null;
  onChange: (selectedIds: string[], primaryId: string | null) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await listCategories({ pageSize: 500 });
        if (!cancelled) setCategories(result.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được danh mục");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(id: string) {
    const isSelected = selectedIds.includes(id);
    let nextSelected: string[];
    let nextPrimary = primaryId;

    if (isSelected) {
      nextSelected = selectedIds.filter((s) => s !== id);
      if (nextPrimary === id) {
        nextPrimary = nextSelected[0] ?? null;
      }
    } else {
      nextSelected = [...selectedIds, id];
      if (!nextPrimary || nextSelected.length === 1) {
        nextPrimary = id;
      }
    }
    onChange(nextSelected, nextPrimary);
  }

  function setPrimary(id: string) {
    if (!selectedIds.includes(id)) return;
    onChange(selectedIds, id);
  }

  if (loading) {
    return <p className="text-sm text-text-secondary">Đang tải danh mục...</p>;
  }
  if (error) {
    return <p className="text-sm text-error">{error}</p>;
  }
  if (categories.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Chưa có danh mục nào. Hãy tạo danh mục trước ở trang Danh mục.
      </p>
    );
  }

  const topLevel = categories.filter((c) => c.level === 1);

  return (
    <div className="space-y-4">
      {topLevel.map((parent) => {
        const children = categories.filter((c) => c.parentId === parent.id);
        return (
          <div key={parent.id} className="space-y-1.5">
            <CategoryCheckboxRow
              category={parent}
              checked={selectedIds.includes(parent.id)}
              isPrimary={primaryId === parent.id}
              onToggle={() => toggle(parent.id)}
              onSetPrimary={() => setPrimary(parent.id)}
            />
            {children.length > 0 ? (
              <div className="ml-6 space-y-1.5 border-l border-border pl-4">
                {children.map((child) => (
                  <CategoryCheckboxRow
                    key={child.id}
                    category={child}
                    checked={selectedIds.includes(child.id)}
                    isPrimary={primaryId === child.id}
                    onToggle={() => toggle(child.id)}
                    onSetPrimary={() => setPrimary(child.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CategoryCheckboxRow({
  category,
  checked,
  isPrimary,
  onToggle,
  onSetPrimary,
}: {
  category: Category;
  checked: boolean;
  isPrimary: boolean;
  onToggle: () => void;
  onSetPrimary: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-border"
      />
      <span className="flex-1">{category.name}</span>
      {checked ? (
        <button
          type="button"
          onClick={onSetPrimary}
          className={`rounded-full px-2 py-0.5 text-xs ${
            isPrimary
              ? "bg-primary text-white"
              : "border border-border text-text-secondary hover:bg-primary-lightest"
          }`}
        >
          Danh mục chính
        </button>
      ) : null}
    </label>
  );
}
