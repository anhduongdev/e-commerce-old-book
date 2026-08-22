"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import { createBanner, updateBanner } from "@/features/banners/services/banners";
import type { Banner, BannerPosition } from "@/features/banners/types/banner.types";
import { ImageDropzone } from "@/features/banners/components/ImageDropzone";

const POSITION_OPTIONS: { value: BannerPosition; label: string }[] = [
  { value: "HOME_HERO", label: "Banner chính trang chủ" },
  { value: "HOME_SUB", label: "Banner phụ trang chủ" },
  { value: "SIDEBAR", label: "Banner thanh bên" },
];

interface FormValues {
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  startAt: string;
  endAt: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toFormValues(banner?: Banner): FormValues {
  return {
    title: banner?.title ?? "",
    imageUrl: banner?.imageUrl ?? null,
    linkUrl: banner?.linkUrl ?? "",
    position: banner?.position ?? "HOME_HERO",
    sortOrder: banner?.sortOrder ?? 0,
    isActive: banner?.isActive ?? true,
    startAt: isoToLocalInput(banner?.startAt ?? null),
    endAt: isoToLocalInput(banner?.endAt ?? null),
  };
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.imageUrl) errors.imageUrl = "Vui lòng tải lên ảnh banner";
  if (values.sortOrder < 0) errors.sortOrder = "Thứ tự phải từ 0 trở lên";
  if (values.startAt && values.endAt) {
    const start = new Date(values.startAt);
    const end = new Date(values.endAt);
    if (end.getTime() <= start.getTime()) {
      errors.endAt = "Thời điểm kết thúc phải sau thời điểm bắt đầu";
    }
  }
  return errors;
}

export function BannerForm({
  mode,
  banner,
}: {
  mode: "create" | "edit";
  banner?: Banner;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(banner));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setStatus("submitting");
    try {
      const payload = {
        title: values.title.trim() || null,
        imageUrl: values.imageUrl!,
        linkUrl: values.linkUrl.trim() || null,
        position: values.position,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        startAt: localInputToIso(values.startAt),
        endAt: localInputToIso(values.endAt),
      };

      if (mode === "create") {
        await createBanner(payload);
      } else {
        await updateBanner(banner!.id, payload);
      }

      router.push("/admin/banners");
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setFormError(error instanceof Error ? error.message : "Lưu banner thất bại");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="font-serif text-lg font-bold text-text">Thông tin banner</h2>

        <Field label="Tiêu đề">
          <input
            type="text"
            value={values.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Nhập tiêu đề banner (không bắt buộc)"
            className={inputClassName(false)}
          />
        </Field>

        <Field label="Ảnh banner" required error={errors.imageUrl}>
          <ImageDropzone
            value={values.imageUrl}
            onChange={(url) => updateField("imageUrl", url)}
          />
        </Field>

        <Field label="Đường dẫn liên kết">
          <input
            type="text"
            value={values.linkUrl}
            onChange={(e) => updateField("linkUrl", e.target.value)}
            placeholder="/san-pham"
            className={inputClassName(false)}
          />
          <p className="mt-1 text-xs text-text-secondary">
            Đường dẫn được mở khi người dùng nhấp vào banner.
          </p>
        </Field>

        <Field label="Vị trí hiển thị" required>
          <select
            value={values.position}
            onChange={(e) => updateField("position", e.target.value as BannerPosition)}
            className={inputClassName(false)}
          >
            {POSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Thứ tự hiển thị" required error={errors.sortOrder}>
          <input
            type="number"
            min={0}
            value={values.sortOrder}
            onChange={(e) => updateField("sortOrder", Number(e.target.value))}
            className={inputClassName(Boolean(errors.sortOrder))}
          />
          <p className="mt-1 text-xs text-text-secondary">Số thứ tự càng nhỏ thì hiển thị càng cao.</p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bắt đầu hiển thị">
            <input
              type="datetime-local"
              value={values.startAt}
              onChange={(e) => updateField("startAt", e.target.value)}
              className={inputClassName(false)}
            />
          </Field>
          <Field label="Kết thúc hiển thị" error={errors.endAt}>
            <input
              type="datetime-local"
              value={values.endAt}
              onChange={(e) => updateField("endAt", e.target.value)}
              className={inputClassName(Boolean(errors.endAt))}
            />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-text-secondary">
          Để trống nếu banner luôn hiển thị khi đang bật.
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">Trạng thái hiển thị</span>
          <ToggleSwitch
            checked={values.isActive}
            onChange={(checked) => updateField("isActive", checked)}
            label={values.isActive ? "Hiển thị" : "Ẩn"}
          />
        </div>

        {formError ? (
          <p className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/banners"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-primary-lightest"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {status === "submitting" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {mode === "create" ? "Lưu banner" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <BannerPreviewCard
          title={values.title}
          imageUrl={values.imageUrl}
          position={values.position}
        />
      </div>
    </form>
  );
}

function BannerPreviewCard({
  title,
  imageUrl,
  position,
}: {
  title: string;
  imageUrl: string | null;
  position: BannerPosition;
}) {
  const BACKEND_ORIGIN = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"
  ).replace(/\/api\/?$/, "");
  const positionLabel =
    POSITION_OPTIONS.find((option) => option.value === position)?.label ?? position;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-text">Xem trước</h3>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-bg-secondary">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${BACKEND_ORIGIN}${imageUrl}`}
            alt=""
            className="h-32 w-full object-cover"
          />
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-text-secondary">
            Chưa có ảnh
          </div>
        )}
      </div>
      <p className="mt-3 truncate text-sm font-medium text-text">
        {title.trim() || "Chưa có tiêu đề"}
      </p>
      <p className="mt-1 text-xs text-text-secondary">{positionLabel}</p>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
      aria-pressed={checked}
    >
      <span
        className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
      <span className="text-sm text-text">{label}</span>
    </button>
  );
}

function inputClassName(hasError: boolean) {
  return `w-full rounded-lg border bg-bg-secondary px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary ${
    hasError ? "border-error" : "border-border"
  }`;
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </label>
  );
}
