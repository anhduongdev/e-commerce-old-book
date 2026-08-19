"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, X } from "lucide-react";
import { uploadProductImage } from "@/features/products/services/products";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

export interface GalleryImage {
  key: string;
  id?: string;
  url: string;
  isRealPhoto: boolean;
}

export function ImageGallery({
  images,
  onChange,
}: {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadProductImage(file);
      onChange([
        ...images,
        { key: crypto.randomUUID(), url, isRealPhoto: true },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function toggleRealPhoto(index: number) {
    const next = images.map((image, i) =>
      i === index ? { ...image, isRealPhoto: !image.isRealPhoto } : image,
    );
    onChange(next);
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={image.key}
            className="w-36 space-y-2 rounded-lg border border-brand-100 bg-cream-dark p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BACKEND_ORIGIN}${image.url}`}
              alt=""
              className="h-24 w-full rounded object-cover"
            />
            <button
              type="button"
              onClick={() => toggleRealPhoto(index)}
              className={`w-full rounded-full px-2 py-1 text-[11px] font-medium ${
                image.isRealPhoto
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-brand-100 text-brand-700"
              }`}
            >
              {image.isRealPhoto ? "Ảnh thật" : "Ảnh bìa NXB"}
            </button>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Đưa lên trước"
                  className="rounded p-1 text-brand-700 hover:bg-brand-50 disabled:opacity-30"
                >
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Đưa xuống sau"
                  className="rounded p-1 text-brand-700 hover:bg-brand-50 disabled:opacity-30"
                >
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label="Xóa ảnh"
                className="rounded p-1 text-red-600 hover:bg-red-50"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-[152px] w-36 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-100 bg-cream-dark text-brand-600 hover:border-brand-600 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Plus size={20} aria-hidden="true" />
          )}
          <span className="text-xs">Thêm ảnh</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
