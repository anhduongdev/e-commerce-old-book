"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import { createPost, updatePost } from "@/features/posts/services/posts";
import type { Post, PostStatus } from "@/features/posts/types/post.types";
import { slugify } from "@/features/posts/utils/slugify";
import { ImageDropzone } from "@/features/posts/components/ImageDropzone";

interface FormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string | null;
  status: PostStatus;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function toFormValues(post?: Post): FormValues {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    thumbnailUrl: post?.thumbnailUrl ?? null,
    status: post?.status ?? "DRAFT",
  };
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.title.trim()) errors.title = "Vui lòng nhập tiêu đề bài viết";
  if (!values.slug.trim()) errors.slug = "Vui lòng nhập slug";
  return errors;
}

export function PostForm({
  mode,
  post,
}: {
  mode: "create" | "edit";
  post?: Post;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(post));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleTitleChange(title: string) {
    updateField("title", title);
    if (!slugTouched) {
      updateField("slug", slugify(title));
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
        title: values.title.trim(),
        excerpt: values.excerpt.trim() || undefined,
        content: values.content.trim() || undefined,
        thumbnailUrl: values.thumbnailUrl ?? undefined,
        status: values.status,
      };

      if (mode === "create") {
        await createPost({ ...payload, slug: values.slug.trim() });
      } else {
        await updatePost(post!.id, payload);
      }

      router.push("/admin/posts");
      router.refresh();
    } catch (error) {
      setStatus("idle");
      setFormError(error instanceof Error ? error.message : "Lưu bài viết thất bại");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-text">Thông tin bài viết</h2>

      <Field label="Tiêu đề" required error={errors.title}>
        <input
          type="text"
          value={values.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Nhập tiêu đề bài viết"
          className={inputClassName(Boolean(errors.title))}
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
          placeholder="url-bai-viet"
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

      <Field label="Mô tả ngắn">
        <textarea
          value={values.excerpt}
          onChange={(e) => updateField("excerpt", e.target.value.slice(0, 500))}
          maxLength={500}
          rows={3}
          placeholder="Nhập mô tả ngắn cho bài viết (tối đa 500 ký tự)..."
          className={inputClassName(false)}
        />
        <p className="mt-1 text-right text-xs text-text-secondary">
          {values.excerpt.length}/500
        </p>
      </Field>

      <Field label="Nội dung">
        <textarea
          value={values.content}
          onChange={(e) => updateField("content", e.target.value)}
          rows={14}
          placeholder="Nhập nội dung bài viết..."
          className={inputClassName(false)}
        />
      </Field>

      <Field label="Ảnh đại diện">
        <ImageDropzone
          value={values.thumbnailUrl}
          onChange={(url) => updateField("thumbnailUrl", url)}
        />
      </Field>

      <Field label="Trạng thái">
        <select
          value={values.status}
          onChange={(e) => updateField("status", e.target.value as PostStatus)}
          className={inputClassName(false)}
        >
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
        </select>
      </Field>

      {formError ? (
        <p className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{formError}</p>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <Link
          href="/admin/posts"
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
          {mode === "create" ? "Lưu bài viết" : "Lưu thay đổi"}
        </button>
      </div>
    </form>
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
