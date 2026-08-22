"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import { createPage, updatePage } from "@/features/pages/services/pages";
import type { Page } from "@/features/pages/types/page.types";

interface FormValues {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function toFormValues(page?: Page): FormValues {
  return {
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    content: page?.content ?? "",
    metaDescription: page?.metaDescription ?? "",
    isActive: page?.isActive ?? true,
  };
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.title.trim()) errors.title = "Vui lòng nhập tiêu đề";
  if (!values.slug.trim()) errors.slug = "Vui lòng nhập slug";
  return errors;
}

export function PageForm({
  mode,
  page,
}: {
  mode: "create" | "edit";
  page?: Page;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(page));
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
        title: values.title.trim(),
        content: values.content.trim() || undefined,
        metaDescription: values.metaDescription.trim() || undefined,
        isActive: values.isActive,
      };

      if (mode === "create") {
        await createPage({ ...payload, slug: values.slug.trim() });
      } else {
        await updatePage(page!.id, payload);
      }

      router.push("/admin/pages");
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setFormError(error instanceof Error ? error.message : "Lưu trang thất bại");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-text">Thông tin trang</h2>

      <Field label="Tiêu đề" required error={errors.title}>
        <input
          type="text"
          value={values.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Nhập tiêu đề trang"
          className={inputClassName(Boolean(errors.title))}
        />
      </Field>

      <Field label="Slug" required error={errors.slug}>
        <input
          type="text"
          value={values.slug}
          readOnly={mode === "edit"}
          onChange={(e) => updateField("slug", e.target.value)}
          placeholder="url-trang"
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

      <Field label="Nội dung">
        <textarea
          value={values.content}
          onChange={(e) => updateField("content", e.target.value)}
          rows={14}
          placeholder="Nhập nội dung trang..."
          className={inputClassName(false)}
        />
      </Field>

      <Field label="Mô tả SEO (meta description)">
        <textarea
          value={values.metaDescription}
          onChange={(e) => updateField("metaDescription", e.target.value.slice(0, 255))}
          maxLength={255}
          rows={3}
          placeholder="Mô tả ngắn gọn dùng cho công cụ tìm kiếm (tối đa 255 ký tự)..."
          className={inputClassName(false)}
        />
        <p className="mt-1 text-right text-xs text-text-secondary">
          {values.metaDescription.length}/255
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
          href="/admin/pages"
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
          {mode === "create" ? "Lưu trang" : "Lưu thay đổi"}
        </button>
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
