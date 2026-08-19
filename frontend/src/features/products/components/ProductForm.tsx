"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import { createProduct, updateProduct } from "@/features/products/services/products";
import type {
  ProductDetail,
  ProductImagePayload,
  ProductStatus,
  ProductVariantPayload,
} from "@/features/products/types/product.types";
import { slugify } from "@/features/products/utils/slugify";
import {
  PRODUCT_STATUS_OPTIONS,
} from "@/features/products/components/ProductStatusBadge";
import { SeriesPicker } from "@/features/products/components/SeriesPicker";
import { CategoryMultiSelect } from "@/features/products/components/CategoryMultiSelect";
import { ImageGallery, type GalleryImage } from "@/features/products/components/ImageGallery";
import {
  VariantListEditor,
  createEmptyVariant,
  validateVariants,
  type VariantRowState,
} from "@/features/products/components/VariantListEditor";
import { ProductPreviewCard, formatPriceRange } from "@/features/products/components/ProductPreviewCard";

interface FormValues {
  name: string;
  slug: string;
  standalone: boolean;
  seriesId: string | null;
  author: string;
  publisher: string;
  publishYear: string;
  isbn: string;
  language: string;
  shortDescription: string;
  description: string;
  status: ProductStatus;
  isFeatured: boolean;
}

function toFormValues(product?: ProductDetail): FormValues {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    standalone: product ? !product.seriesId : true,
    seriesId: product?.seriesId ?? null,
    author: product?.author ?? "",
    publisher: product?.publisher ?? "",
    publishYear: product?.publishYear ? String(product.publishYear) : "",
    isbn: product?.isbn ?? "",
    language: product?.language ?? "Tiếng Việt",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    status: product?.status ?? "DRAFT",
    isFeatured: product?.isFeatured ?? false,
  };
}

function toVariantRows(product?: ProductDetail): VariantRowState[] {
  if (!product || product.variants.length === 0) {
    return [createEmptyVariant(product?.slug ?? "")];
  }
  return product.variants.map((v) => ({
    key: v.id,
    id: v.id,
    sku: v.sku,
    volumeNumber: v.volumeNumber ? String(v.volumeNumber) : "",
    name: v.name ?? "",
    price: v.price,
    compareAtPrice: v.compareAtPrice ?? "",
    conditionGrade: v.conditionGrade,
    conditionNote: v.conditionNote ?? "",
    stockQuantity: String(v.stockQuantity),
    isActive: v.isActive,
    imageUrl: v.imageUrl,
  }));
}

function toGalleryImages(product?: ProductDetail): GalleryImage[] {
  if (!product) return [];
  return product.images.map((img) => ({
    key: img.id,
    id: img.id,
    url: img.url,
    isRealPhoto: img.isRealPhoto,
  }));
}

type FieldErrors = Partial<Record<"name" | "slug", string>>;

function inputClassName(hasError: boolean) {
  return `w-full rounded-lg border bg-cream-dark px-4 py-2.5 text-sm text-brand-900 outline-none placeholder:text-brand-600/60 focus:border-brand-700 ${
    hasError ? "border-red-400" : "border-brand-100"
  }`;
}

export function ProductForm({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: ProductDetail;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(product));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [variants, setVariants] = useState<VariantRowState[]>(() => toVariantRows(product));
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() =>
    toGalleryImages(product),
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    () => product?.categories.map((c) => c.id) ?? [],
  );
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(
    () => product?.primaryCategoryId ?? null,
  );
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

  function handleSeriesChange(standalone: boolean, seriesId: string | null) {
    if (standalone && variants.length > 1) {
      setFormError(
        "Sản phẩm thuộc bộ truyện có nhiều tập không thể chuyển thành sách lẻ. Hãy xóa bớt tập trước.",
      );
      return;
    }
    setFormError(null);
    setValues((prev) => ({ ...prev, standalone, seriesId: standalone ? null : seriesId }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const fieldErrors: FieldErrors = {};
    if (!values.name.trim()) fieldErrors.name = "Vui lòng nhập tên sản phẩm";
    if (!values.slug.trim()) fieldErrors.slug = "Vui lòng nhập slug";
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const variantError = validateVariants(variants, !values.standalone);
    if (variantError) {
      setFormError(variantError);
      return;
    }

    if (categoryIds.length === 0) {
      setFormError("Vui lòng chọn ít nhất một danh mục");
      return;
    }
    if (!primaryCategoryId || !categoryIds.includes(primaryCategoryId)) {
      setFormError("Vui lòng chọn một danh mục chính");
      return;
    }

    setStatus("submitting");
    try {
      const variantPayloads: ProductVariantPayload[] = variants.map((v, index) => ({
        id: v.id,
        tempKey: v.id ? undefined : v.tempKey,
        sku: v.sku.trim(),
        volumeNumber: !values.standalone && v.volumeNumber ? Number(v.volumeNumber) : undefined,
        name: v.name.trim() || undefined,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
        conditionGrade: v.conditionGrade,
        conditionNote: v.conditionNote.trim() || undefined,
        stockQuantity: Number(v.stockQuantity),
        imageUrl: v.imageUrl ?? undefined,
        isActive: v.isActive,
        sortOrder: index,
      }));

      const imagePayloads: ProductImagePayload[] = galleryImages.map((img, index) => ({
        id: img.id,
        url: img.url,
        isRealPhoto: img.isRealPhoto,
        sortOrder: index,
      }));

      const payload = {
        name: values.name.trim(),
        seriesId: values.standalone ? null : values.seriesId,
        author: values.author.trim() || undefined,
        publisher: values.publisher.trim() || undefined,
        publishYear: values.publishYear ? Number(values.publishYear) : undefined,
        isbn: values.isbn.trim() || undefined,
        language: values.language.trim() || undefined,
        shortDescription: values.shortDescription.trim() || undefined,
        description: values.description.trim() || undefined,
        status: values.status,
        isFeatured: values.isFeatured,
        variants: variantPayloads,
        images: imagePayloads,
        categoryIds,
        primaryCategoryId,
      };

      if (mode === "create") {
        await createProduct({ ...payload, slug: values.slug.trim() });
      } else {
        await updateProduct(product!.id, payload);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setFormError(error instanceof Error ? error.message : "Lưu sản phẩm thất bại");
    }
  }

  const priceRange = formatPriceRange(
    variants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n) && n > 0),
  );
  const thumbnail = galleryImages[0]?.url ?? variants.find((v) => v.imageUrl)?.imageUrl ?? null;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-brand-900">Thông tin cơ bản</h2>

          <Field label="Tên sản phẩm" required error={errors.name}>
            <input
              type="text"
              value={values.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nhập tên sản phẩm"
              className={inputClassName(Boolean(errors.name))}
            />
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
              placeholder="ten-san-pham"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tác giả">
              <input
                type="text"
                value={values.author}
                onChange={(e) => updateField("author", e.target.value)}
                className={inputClassName(false)}
              />
            </Field>
            <Field label="Nhà xuất bản">
              <input
                type="text"
                value={values.publisher}
                onChange={(e) => updateField("publisher", e.target.value)}
                className={inputClassName(false)}
              />
            </Field>
            <Field label="Năm xuất bản">
              <input
                type="number"
                value={values.publishYear}
                onChange={(e) => updateField("publishYear", e.target.value)}
                className={inputClassName(false)}
              />
            </Field>
            <Field label="ISBN">
              <input
                type="text"
                value={values.isbn}
                onChange={(e) => updateField("isbn", e.target.value)}
                className={inputClassName(false)}
              />
            </Field>
            <Field label="Ngôn ngữ">
              <input
                type="text"
                value={values.language}
                onChange={(e) => updateField("language", e.target.value)}
                className={inputClassName(false)}
              />
            </Field>
            <Field label="Trạng thái">
              <select
                value={values.status}
                onChange={(e) => updateField("status", e.target.value as ProductStatus)}
                className={inputClassName(false)}
              >
                {PRODUCT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Mô tả ngắn">
            <textarea
              value={values.shortDescription}
              onChange={(e) => updateField("shortDescription", e.target.value.slice(0, 500))}
              maxLength={500}
              rows={2}
              className={inputClassName(false)}
            />
            <p className="mt-1 text-right text-xs text-brand-600">
              {values.shortDescription.length}/500
            </p>
          </Field>

          <Field label="Mô tả chi tiết">
            <textarea
              value={values.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              className={inputClassName(false)}
            />
          </Field>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-brand-900">Sản phẩm nổi bật</span>
            <ToggleSwitch
              checked={values.isFeatured}
              onChange={(checked) => updateField("isFeatured", checked)}
              label={values.isFeatured ? "Có" : "Không"}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-brand-900">Bộ truyện</h2>
          <SeriesPicker
            standalone={values.standalone}
            seriesId={values.seriesId}
            onChange={handleSeriesChange}
          />
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-brand-900">Danh mục</h2>
          <CategoryMultiSelect
            selectedIds={categoryIds}
            primaryId={primaryCategoryId}
            onChange={(ids, primary) => {
              setCategoryIds(ids);
              setPrimaryCategoryId(primary);
            }}
          />
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-brand-900">Ảnh sản phẩm</h2>
          <p className="text-xs text-brand-600">
            Ảnh dùng chung cho sản phẩm. Ưu tiên ảnh chụp thật hơn ảnh bìa nhà xuất bản.
          </p>
          <ImageGallery images={galleryImages} onChange={setGalleryImages} />
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-brand-900">Các tập / phiên bản</h2>
          <VariantListEditor
            variants={variants}
            onChange={setVariants}
            allowMultiple={!values.standalone}
            slug={values.slug || "san-pham"}
          />
        </div>

        {formError ? (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{formError}</p>
        ) : null}

        <div className="flex justify-end gap-3 pb-6">
          <Link
            href="/admin/products"
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
            {mode === "create" ? "Lưu sản phẩm" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <ProductPreviewCard
          name={values.name}
          slug={values.slug}
          thumbnailUrl={thumbnail}
          author={values.author}
          status={values.status}
          priceRange={priceRange}
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
