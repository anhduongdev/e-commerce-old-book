"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import type { CatalogVariantImage } from "@/features/catalog/types/catalog.types";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

// Nhận key={variant.id} từ component cha — đổi tập sẽ remount component này
// nên selectedIndex tự reset về 0, không cần effect đồng bộ state.
export function ProductGallery({ images }: { images: CatalogVariantImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = images[selectedIndex] ?? images[0] ?? null;

  return (
    <div>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-brand-50">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${BACKEND_ORIGIN}${current.url}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Package size={64} className="text-brand-600" aria-hidden="true" />
        )}
        {current && !current.isRealPhoto ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-brand-700">
            Ảnh minh họa
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Xem ảnh ${index + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                index === selectedIndex ? "border-brand-700" : "border-brand-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BACKEND_ORIGIN}${image.url}`}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
