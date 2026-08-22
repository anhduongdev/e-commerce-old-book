import type { CatalogSort } from "@/features/catalog/types/catalog.types";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

export function SortSelect({
  value,
  onChange,
}: {
  value: CatalogSort;
  onChange: (sort: CatalogSort) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CatalogSort)}
      className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text outline-none"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          Sắp xếp: {option.label}
        </option>
      ))}
    </select>
  );
}
