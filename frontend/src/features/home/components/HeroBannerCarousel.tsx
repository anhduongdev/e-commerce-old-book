"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { CatalogBanner } from "@/features/catalog/types/catalog.types";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

function resolveImageUrl(url: string) {
  return url.startsWith("http") ? url : `${BACKEND_ORIGIN}${url}`;
}

export function HeroBannerCarousel({ banners }: { banners: CatalogBanner[] }) {
  const [index, setIndex] = useState(0);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-b from-secondary-light via-bg to-primary-lightest px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-lightest">
          <BookOpen size={32} className="text-primary-dark" aria-hidden="true" />
        </span>
        <h1 className="font-serif text-3xl font-bold text-text">
          Sách cũ – Truyện tranh – Giá trị mới
        </h1>
        <p className="max-w-xl text-text-secondary">
          Mỗi cuốn sách cũ đều được kiểm tra kỹ và ghi rõ tình trạng thật, kèm
          ảnh chụp thật trước khi lên kệ.
        </p>
        <Link
          href="/san-pham"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Khám phá ngay
        </Link>
      </div>
    );
  }

  const current = banners[index];
  const imageBroken = brokenIds.has(current.id);

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-2xl bg-primary-lightest">
      <Link href={current.linkUrl ?? "/san-pham"} className="block">
        {imageBroken ? (
          <div className="flex h-[280px] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-lightest via-bg to-secondary-light md:h-[360px]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
              <BookOpen size={28} className="text-primary-dark" aria-hidden="true" />
            </span>
            {current.title ? (
              <p className="font-serif text-xl font-bold text-text md:text-2xl">
                {current.title}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImageUrl(current.imageUrl)}
              alt={current.title ?? ""}
              onError={() =>
                setBrokenIds((prev) => new Set(prev).add(current.id))
              }
              className="h-[280px] w-full object-cover md:h-[360px]"
            />
            {current.title ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <p className="font-serif text-xl font-bold text-white md:text-2xl">
                  {current.title}
                </p>
              </div>
            ) : null}
          </>
        )}
      </Link>

      {banners.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Xem banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
