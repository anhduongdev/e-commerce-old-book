"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { reorderBanners } from "@/features/banners/services/banners";
import type { Banner, BannerPosition } from "@/features/banners/types/banner.types";

const POSITION_OPTIONS: { value: BannerPosition; label: string }[] = [
  { value: "HOME_HERO", label: "Banner chính trang chủ" },
  { value: "HOME_SUB", label: "Banner phụ trang chủ" },
  { value: "SIDEBAR", label: "Banner thanh bên" },
];

function sortByPosition(banners: Banner[], position: BannerPosition): Banner[] {
  return banners
    .filter((banner) => banner.position === position)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function BannerReorderPanel({
  banners,
  onReordered,
}: {
  banners: Banner[];
  onReordered: () => void;
}) {
  const [position, setPosition] = useState<BannerPosition>("HOME_HERO");
  const [items, setItems] = useState<Banner[]>(() => sortByPosition(banners, position));
  const [dragId, setDragId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-derive local drag state from the latest `banners` prop whenever it
  // changes, without a useEffect — adjusting state during render per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevBanners, setPrevBanners] = useState(banners);
  if (banners !== prevBanners) {
    setPrevBanners(banners);
    setItems(sortByPosition(banners, position));
  }

  function handlePositionChange(next: BannerPosition) {
    setPosition(next);
    setItems(sortByPosition(banners, next));
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
      await reorderBanners(next.map((item, index) => ({ id: item.id, sortOrder: index })));
      onReordered();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-text">Sắp xếp banner</h3>
      <select
        value={position}
        onChange={(e) => handlePositionChange(e.target.value as BannerPosition)}
        className="mt-3 w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text outline-none focus:border-primary"
      >
        {POSITION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
            <span className="flex-1 truncate">{item.title ?? "(Không có tiêu đề)"}</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-xs font-medium text-primary">
              {index + 1}
            </span>
          </li>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-text-secondary">Chưa có banner ở vị trí này.</p>
        ) : null}
      </ul>
      <p className="mt-3 text-xs text-text-secondary">
        {saving ? "Đang lưu thứ tự..." : "Kéo thả để sắp xếp thứ tự hiển thị."}
      </p>
    </div>
  );
}
