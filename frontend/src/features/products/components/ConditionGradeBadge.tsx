import type { ConditionGrade } from "@/features/products/types/product.types";

export const CONDITION_LABELS: Record<ConditionGrade, { label: string; className: string }> = {
  NEW: { label: "Mới", className: "bg-sky-100 text-sky-700" },
  LIKE_NEW: { label: "Như mới", className: "bg-teal-100 text-teal-700" },
  GOOD: { label: "Tốt", className: "bg-lime-100 text-lime-700" },
  FAIR: { label: "Khá", className: "bg-amber-100 text-amber-700" },
  WORN: { label: "Cũ", className: "bg-stone-200 text-stone-700" },
};

export const CONDITION_OPTIONS: { value: ConditionGrade; label: string }[] = (
  Object.keys(CONDITION_LABELS) as ConditionGrade[]
).map((value) => ({ value, label: CONDITION_LABELS[value].label }));

export function ConditionGradeBadge({ grade }: { grade: ConditionGrade }) {
  const { label, className } = CONDITION_LABELS[grade];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>
  );
}
