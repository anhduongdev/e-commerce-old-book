"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  function clamp(next: number) {
    return Math.min(max, Math.max(1, next));
  }

  return (
    <div className="flex w-fit items-center rounded-lg border border-border">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        aria-label="Giảm số lượng"
        className="flex h-10 w-10 items-center justify-center text-primary hover:bg-primary-lightest disabled:opacity-40"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (Number.isNaN(next)) return;
          onChange(clamp(next));
        }}
        className="h-10 w-14 border-x border-border text-center text-sm text-text outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Tăng số lượng"
        className="flex h-10 w-10 items-center justify-center text-primary hover:bg-primary-lightest disabled:opacity-40"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
