"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import { createSeries, updateSeries } from "@/features/series/services/series";
import type { Series } from "@/features/series/types/series.types";
import { slugify } from "@/features/series/utils/slugify";
import { SeriesPreviewCard } from "@/features/series/components/SeriesPreviewCard";
import { ImageDropzone } from "@/features/series/components/ImageDropzone";

const DESCRIPTION_SOFT_LIMIT = 2000;

interface FormValues {
  name: string;
  slug: string;
  author: string;
  publisher: string;
  description: string;
  coverUrl: string | null;
  totalVolumes: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function toFormValues(series?: Series): FormValues {
  return {
    name: series?.name ?? "",
    slug: series?.slug ?? "",
    author: series?.author ?? "",
    publisher: series?.publisher ?? "",
    description: series?.description ?? "",
    coverUrl: series?.coverUrl ?? null,
    totalVolumes: series?.totalVolumes ? String(series.totalVolumes) : "",
    isActive: series?.isActive ?? true,
  };
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "Vui lòng nhập tên bộ truyện";
  if (!values.slug.trim()) errors.slug = "Vui lòng nhập slug";
  if (values.totalVolumes && Number(values.totalVolumes) <= 0) {
    errors.totalVolumes = "Số tập phải lớn hơn 0";
  }
  return errors;
}

export function SeriesForm({
  mode,
  series,
}: {
  mode: "create" | "edit";
  series?: Series;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(series));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(name: string) {
    updateField("name", name);
    if (!slugTouched) {
      updateField("slug", slugify(name));
    }
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
        name: values.name.trim(),
        author: values.author.trim() || undefined,
        publisher: values.publisher.trim() || undefined,
        description: values.description.trim() || undefined,
        coverUrl: values.coverUrl ?? undefined,
        totalVolumes: values.totalVolumes ? Number(values.totalVolumes) : undefined,
        isActive: values.isActive,
      };

      if (mode === "create") {
        await createSeries({ ...payload, slug: values.slug.trim() });
      } else {
        await updateSeries(series!.id, payload);
      }

      router.push("/admin/series");
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setFormError(error instanceof Error ? error.message : "Lưu bộ truyện thất bại");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="font-serif text-lg font-bold text-text">
          Thông tin bộ truyện
        </h2>

        <Field label="Tên bộ truyện" required error={errors.name}>
          <input
            type="text"
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nhập tên bộ truyện"
            className={inputClassName(Boolean(errors.name))}
          />
          <p className="mt-1 text-xs text-text-secondary">Tên hiển thị của bộ truyện.</p>
        </Field>

        <Field label="Slug" required error={errors.slug}>
          <input
            type="text"
            value={values.slug}
            readOnly={mode === "edit"}
            onChange={(e) => {
              setSlugTouched(true);
              updateField("slug", e.target.value);
            }}
            placeholder="ten-bo-truyen"
            className={`${inputClassName(Boolean(errors.slug))} ${
              mode === "edit" ? "cursor-not-allowed opacity-70" : ""
            }`}
          />
          <p className="mt-1 text-xs text-text-secondary">
            {mode === "edit"
              ? "Slug không thể thay đổi sau khi tạo."
              : "Đường dẫn thân thiện, viết thường, không dấu và không có khoảng trắng."}
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tác giả">
            <input
              type="text"
              value={values.author}
              onChange={(e) => updateField("author", e.target.value)}
              placeholder="Nhập tên tác giả"
              className={inputClassName(false)}
            />
          </Field>

          <Field label="Nhà xuất bản">
            <input
              type="text"
              value={values.publisher}
              onChange={(e) => updateField("publisher", e.target.value)}
              placeholder="Nhập tên nhà xuất bản"
              className={inputClassName(false)}
            />
          </Field>
        </div>

        <Field label="Mô tả">
          <textarea
            value={values.description}
            onChange={(e) =>
              updateField("description", e.target.value.slice(0, DESCRIPTION_SOFT_LIMIT))
            }
            maxLength={DESCRIPTION_SOFT_LIMIT}
            rows={4}
            placeholder="Nhập mô tả về bộ truyện..."
            className={inputClassName(false)}
          />
          <p className="mt-1 text-right text-xs text-text-secondary">
            {values.description.length}/{DESCRIPTION_SOFT_LIMIT}
          </p>
        </Field>

        <Field label="Ảnh bìa">
          <ImageDropzone
            value={values.coverUrl}
            onChange={(url) => updateField("coverUrl", url)}
          />
        </Field>

        <Field label="Số tập" error={errors.totalVolumes}>
          <input
            type="number"
            min={1}
            value={values.totalVolumes}
            onChange={(e) => updateField("totalVolumes", e.target.value)}
            placeholder="Nhập tổng số tập (nếu biết)"
            className={inputClassName(Boolean(errors.totalVolumes))}
          />
          <p className="mt-1 text-xs text-text-secondary">
            Tổng số tập của bộ truyện, có thể để trống nếu chưa rõ.
          </p>
        </Field>

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
            href="/admin/series"
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
            {mode === "create" ? "Lưu bộ truyện" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <SeriesPreviewCard
          name={values.name}
          slug={values.slug}
          description={values.description}
          coverUrl={values.coverUrl}
          author={values.author}
          totalVolumes={values.totalVolumes}
        />
      </div>
    </form>
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
