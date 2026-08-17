"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { loginUser } from "@/features/auth/services/login";
import type { LoginFormValues } from "@/features/auth/types/login.types";

const EMPTY_VALUES: LoginFormValues = {
  identifier: "",
  password: "",
};

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

function validate(values: LoginFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.identifier.trim()) {
    errors.identifier = "Vui lòng nhập email hoặc số điện thoại";
  }
  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu";
  }

  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [showPassword, setShowPassword] = useState(false);

  function updateField<K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setStatus("submitting");
    try {
      await loginUser({
        identifier: values.identifier.trim(),
        password: values.password,
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      setStatus("idle");
      // Backend trả cùng 1 message chung cho "không tìm thấy tài khoản" và
      // "sai mật khẩu" để tránh lộ tài khoản nào tồn tại — nên luôn hiện lỗi
      // chung, không gán vào field cụ thể như RegisterForm.
      setFormError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-10">
      <h1 className="text-center font-serif text-3xl font-bold text-brand-900">
        Đăng nhập
      </h1>
      <p className="mt-2 text-center text-sm text-brand-600">
        Đăng nhập để tiếp tục mua sắm và theo dõi đơn hàng của bạn.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Email hoặc số điện thoại" error={errors.identifier}>
          <input
            type="text"
            value={values.identifier}
            onChange={(e) => updateField("identifier", e.target.value)}
            placeholder="Nhập email hoặc số điện thoại"
            className={inputClassName(Boolean(errors.identifier))}
          />
        </Field>

        <Field label="Mật khẩu" error={errors.password}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Nhập mật khẩu"
              className={inputClassName(Boolean(errors.password))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <div className="text-right text-sm">
          <Link href="/forgot-password" className="text-brand-700 underline">
            Quên mật khẩu?
          </Link>
        </div>

        {formError ? (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 py-3 font-medium text-white transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <LogIn size={18} aria-hidden="true" />
          )}
          Đăng nhập
        </button>

        <div className="flex items-center gap-3 text-xs text-brand-600">
          <span className="h-px flex-1 bg-brand-100" />
          HOẶC
          <span className="h-px flex-1 bg-brand-100" />
        </div>

        <p className="text-center text-sm text-brand-600">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-700 underline"
          >
            Đăng ký
          </Link>
        </p>
      </form>
    </div>
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
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-brand-900">
        {label}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
