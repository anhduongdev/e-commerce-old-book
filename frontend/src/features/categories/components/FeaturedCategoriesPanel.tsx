"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { reorderCategories } from "@/features/categories/services/categories";
import type { Category } from "@/features/categories/types/category.types";

function sortFeatured(categories: Category[]): Category[] {
  return categories
    .filter((category) => category.isFeatured)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function FeaturedCategoriesPanel({
  categories,
  onReordered,
}: {
  categories: Category[];
  onReordered: () => void;
}) {
  const [items, setItems] = useState<Category[]>(() => sortFeatured(categories));
  const [dragId, setDragId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-derive local drag state from the latest `categories` prop whenever it
  // changes, without a useEffect — adjusting state during render per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevCategories, setPrevCategories] = useState(categories);
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setItems(sortFeatured(categories));
  }

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;

    const fromIndex = items.findIndex((item) => item.id === dragId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
    setDragId(null);

    setSaving(true);
    try {
      await reorderCategories(
        next.map((item, index) => ({ id: item.id, sortOrder: index + 1 })),
      );
      onReordered();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-text">
        Danh mục nổi bật
      </h3>
      <ul className="mt-4 space-y-1">
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void handleDrop(item.id)}
            className="flex cursor-grab items-center gap-2 rounded-lg px-2 py-2 text-sm text-text hover:bg-primary-lightest active:cursor-grabbing"
          >
            <GripVertical size={14} className="text-text-secondary" aria-hidden="true" />
            <span className="flex-1 truncate">{item.name}</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-xs font-medium text-primary">
              {index + 1}
            </span>
          </li>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-text-secondary">Chưa có danh mục nổi bật.</p>
        ) : null}
      </ul>
      <p className="mt-3 text-xs text-text-secondary">
        {saving ? "Đang lưu thứ tự..." : "Kéo thả để sắp xếp thứ tự hiển thị."}
      </p>
    </div>
  );
}
