"use client";

import { useRef, useState, type DragEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadSeriesImage } from "@/features/series/services/series";

const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
).replace(/\/api\/?$/, "");

export function ImageDropzone({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: string } | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadSeriesImage(file);
      onChange(url);
      setFileMeta({ name: file.name, size: `${(file.size / 1024).toFixed(0)} KB` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-brand-100 bg-cream-dark p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${BACKEND_ORIGIN}${value}`}
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-brand-900">
            {fileMeta?.name ?? value.split("/").pop()}
          </p>
          {fileMeta ? (
            <p className="text-xs text-brand-600">{fileMeta.size}</p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setFileMeta(null);
            }}
            className="mt-1 text-xs font-medium text-brand-700 underline"
          >
            Thay đổi ảnh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-100 bg-cream-dark px-6 py-8 text-center hover:border-brand-600"
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-brand-700" />
        ) : (
          <Upload size={24} className="text-brand-600" aria-hidden="true" />
        )}
        <p className="text-sm text-brand-900">
          {uploading ? "Đang tải lên..." : "Kéo thả ảnh vào đây hoặc nhấp để chọn"}
        </p>
        <p className="text-xs text-brand-600">
          Định dạng: JPG, PNG, WEBP. Kích thước tối đa 2MB.
        </p>
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
