"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import {
  createCategory,
  updateCategory,
} from "@/features/categories/services/categories";
import type { Category } from "@/features/categories/types/category.types";
import { slugify } from "@/features/categories/utils/slugify";
import { CategoryPreviewCard } from "@/features/categories/components/CategoryPreviewCard";
import { ImageDropzone } from "@/features/categories/components/ImageDropzone";
import { TagInput } from "@/features/categories/components/TagInput";

interface FormValues {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  searchKeywords: string[];
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function toFormValues(category?: Category): FormValues {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    parentId: category?.parentId ?? "",
    description: category?.description ?? "",
    imageUrl: category?.imageUrl ?? null,
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
    isFeatured: category?.isFeatured ?? false,
    searchKeywords: category?.searchKeywords ?? [],
  };
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "Vui lòng nhập tên danh mục";
  if (!values.slug.trim()) errors.slug = "Vui lòng nhập slug";
  if (values.sortOrder < 0) errors.sortOrder = "Thứ tự phải từ 0 trở lên";
  return errors;
}

export function CategoryForm({
  mode,
  category,
  allCategories,
}: {
  mode: "create" | "edit";
  category?: Category;
  allCategories: Category[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(category));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const parentOptions = allCategories.filter(
    (c) => c.level === 1 && c.id !== category?.id,
  );

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
        parentId: values.parentId || null,
        description: values.description.trim() || undefined,
        imageUrl: values.imageUrl ?? undefined,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        isFeatured: values.isFeatured,
        searchKeywords: values.searchKeywords.length ? values.searchKeywords : undefined,
      };

      if (mode === "create") {
        await createCategory({ ...payload, slug: values.slug.trim() });
      } else {
        await updateCategory(category!.id, payload);
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setFormError(error instanceof Error ? error.message : "Lưu danh mục thất bại");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="font-serif text-lg font-bold text-brand-900">
          Thông tin danh mục
        </h2>

        <Field label="Tên danh mục" required error={errors.name}>
          <input
            type="text"
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nhập tên danh mục"
            className={inputClassName(Boolean(errors.name))}
          />
          <p className="mt-1 text-xs text-brand-600">Tên hiển thị của danh mục.</p>
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
            placeholder="url-danh-muc"
            className={`${inputClassName(Boolean(errors.slug))} ${
              mode === "edit" ? "cursor-not-allowed opacity-70" : ""
            }`}
          />
          <p className="mt-1 text-xs text-brand-600">
            {mode === "edit"
              ? "Slug không thể thay đổi sau khi tạo."
              : "Đường dẫn thân thiện, viết thường, không dấu và không có khoảng trắng."}
          </p>
        </Field>

        <Field label="Danh mục cha">
          <select
            value={values.parentId}
            onChange={(e) => updateField("parentId", e.target.value)}
            className={inputClassName(false)}
          >
            <option value="">Không có</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-brand-600">
            Chọn danh mục cha nếu danh mục này là danh mục con.
          </p>
        </Field>

        <Field label="Mô tả ngắn">
          <textarea
            value={values.description}
            onChange={(e) => updateField("description", e.target.value.slice(0, 255))}
            maxLength={255}
            rows={3}
            placeholder="Nhập mô tả ngắn về danh mục (tối đa 255 ký tự)..."
            className={inputClassName(false)}
          />
          <p className="mt-1 text-right text-xs text-brand-600">
            {values.description.length}/255
          </p>
        </Field>

        <Field label="Ảnh đại diện">
          <ImageDropzone
            value={values.imageUrl}
            onChange={(url) => updateField("imageUrl", url)}
          />
        </Field>

        <Field label="Thứ tự hiển thị" required error={errors.sortOrder}>
          <input
            type="number"
            min={0}
            value={values.sortOrder}
            onChange={(e) => updateField("sortOrder", Number(e.target.value))}
            className={inputClassName(Boolean(errors.sortOrder))}
          />
          <p className="mt-1 text-xs text-brand-600">Số thứ tự càng nhỏ thì hiển thị càng cao.</p>
        </Field>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-brand-900">Trạng thái hiển thị</span>
          <ToggleSwitch
            checked={values.isActive}
            onChange={(checked) => updateField("isActive", checked)}
            label={values.isActive ? "Hiển thị" : "Ẩn"}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-brand-900">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => updateField("isFeatured", e.target.checked)}
            className="h-4 w-4 rounded border-brand-100"
          />
          Hiển thị danh mục này ở vị trí nổi bật trên trang chủ
        </label>

        <Field label="Từ khóa tìm kiếm">
          <TagInput
            value={values.searchKeywords}
            onChange={(tags) => updateField("searchKeywords", tags)}
            placeholder="Nhập từ khóa và nhấn Enter..."
          />
          <p className="mt-1 text-xs text-brand-600">
            Thêm các từ khóa liên quan để hỗ trợ tìm kiếm.
          </p>
        </Field>

        {formError ? (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/categories"
            className="rounded-full border border-brand-100 px-5 py-2.5 text-sm font-medium text-brand-900 hover:bg-brand-50"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {status === "submitting" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {mode === "create" ? "Lưu danh mục" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <CategoryPreviewCard
          name={values.name}
          slug={values.slug}
          description={values.description}
          imageUrl={values.imageUrl}
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
          checked ? "bg-brand-700" : "bg-brand-100"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
      <span className="text-sm text-brand-900">{label}</span>
    </button>
  );
}

function inputClassName(hasError: boolean) {
  return `w-full rounded-lg border bg-cream-dark px-4 py-2.5 text-sm text-brand-900 outline-none placeholder:text-brand-600/60 focus:border-brand-700 ${
    hasError ? "border-red-400" : "border-brand-100"
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
      <span className="mb-1.5 block text-sm font-medium text-brand-900">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
