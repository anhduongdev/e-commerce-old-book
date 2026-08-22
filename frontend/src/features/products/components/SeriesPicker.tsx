"use client";

import { useEffect, useState } from "react";
import { listSeries } from "@/features/series/services/series";
import type { Series } from "@/features/series/types/series.types";

export function SeriesPicker({
  standalone,
  seriesId,
  onChange,
  blockedReason,
}: {
  standalone: boolean;
  seriesId: string | null;
  onChange: (standalone: boolean, seriesId: string | null) => void;
  blockedReason?: string | null;
}) {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await listSeries({ pageSize: 500 });
        if (!cancelled) setSeriesList(result.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được bộ truyện");
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

  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? seriesList.filter((s) => s.name.toLowerCase().includes(keyword))
    : seriesList;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true, null)}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
            standalone
              ? "border-primary bg-primary-lightest text-text"
              : "border-border text-text-secondary hover:bg-primary-lightest"
          }`}
        >
          Sách lẻ
        </button>
        <button
          type="button"
          onClick={() => onChange(false, seriesId)}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
            !standalone
              ? "border-primary bg-primary-lightest text-text"
              : "border-border text-text-secondary hover:bg-primary-lightest"
          }`}
        >
          Thuộc bộ truyện
        </button>
      </div>

      {blockedReason ? (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">{blockedReason}</p>
      ) : null}

      {!standalone ? (
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bộ truyện..."
            className="mb-2 w-full rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
          />
          {loading ? (
            <p className="text-sm text-text-secondary">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-error">{error}</p>
          ) : (
            <select
              value={seriesId ?? ""}
              onChange={(e) => onChange(false, e.target.value || null)}
              size={Math.min(6, Math.max(3, filtered.length || 1))}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text outline-none focus:border-primary"
            >
              {filtered.length === 0 ? (
                <option value="" disabled>
                  Không tìm thấy bộ truyện
                </option>
              ) : null}
              {filtered.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : null}
    </div>
  );
}
