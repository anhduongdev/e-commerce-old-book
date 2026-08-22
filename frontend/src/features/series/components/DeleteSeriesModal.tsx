"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteSeries } from "@/features/series/services/series";
import type { Series } from "@/features/series/types/series.types";

export function DeleteSeriesModal({
  series,
  onClose,
  onDeleted,
}: {
  series: Series;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteSeries(series.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa bộ truyện thất bại");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-lg">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
          <Trash2 size={24} aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-serif text-xl font-bold text-text">
          Xóa series
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Bạn có chắc chắn muốn xóa bộ truyện &quot;{series.name}&quot; không?
          Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các sản phẩm
          liên quan.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-left text-xs text-warning">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {series.productCount > 0
            ? `Bộ truyện này hiện có ${series.productCount} sản phẩm liên kết. Nếu xóa, các sản phẩm đó sẽ không bị xóa nhưng sẽ mất liên kết với bộ truyện này.`
            : "Nếu bộ truyện này đang có sản phẩm liên kết, các sản phẩm đó sẽ không bị xóa nhưng sẽ mất liên kết với bộ truyện này."}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-primary-lightest disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex items-center gap-2 rounded-full bg-error hover:bg-error/90 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : null}
            Xóa series
          </button>
        </div>
      </div>
    </div>
  );
}
