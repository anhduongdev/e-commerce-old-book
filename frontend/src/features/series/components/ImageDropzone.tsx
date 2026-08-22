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
      <div className="flex items-center gap-3 rounded-lg border border-border bg-bg-secondary p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${BACKEND_ORIGIN}${value}`}
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">
            {fileMeta?.name ?? value.split("/").pop()}
          </p>
          {fileMeta ? (
            <p className="text-xs text-text-secondary">{fileMeta.size}</p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setFileMeta(null);
            }}
            className="mt-1 text-xs font-medium text-primary underline"
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
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg-secondary px-6 py-8 text-center hover:border-primary"
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-primary" />
        ) : (
          <Upload size={24} className="text-text-secondary" aria-hidden="true" />
        )}
        <p className="text-sm text-text">
          {uploading ? "Đang tải lên..." : "Kéo thả ảnh vào đây hoặc nhấp để chọn"}
        </p>
        <p className="text-xs text-text-secondary">
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
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}
