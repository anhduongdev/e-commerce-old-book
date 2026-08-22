"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CircleCheck, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { registerUser } from "@/features/auth/services/register";
import type { RegisterFormValues } from "@/features/auth/types/register.types";

const EMPTY_VALUES: RegisterFormValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

const PHONE_REGEX = /^(0|\+84)\d{9,10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

function validate(values: RegisterFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ và tên";
  }

  if (!values.email.trim() && !values.phone.trim()) {
    errors.email = "Cần nhập email hoặc số điện thoại";
    errors.phone = "Cần nhập email hoặc số điện thoại";
  }
  if (values.email.trim() && !EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Email không hợp lệ";
  }
  if (values.phone.trim() && !PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = "Số điện thoại không hợp lệ";
  }

  if (values.password.length < 8) {
    errors.password = "Mật khẩu cần ít nhất 8 ký tự";
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  if (!values.agreeTerms) {
    errors.agreeTerms = "Bạn cần đồng ý với điều khoản sử dụng";
  }

  return errors;
}

export function RegisterForm() {
  const [values, setValues] = useState<RegisterFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function updateField<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
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
      await registerUser({
        fullName: values.fullName.trim(),
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
        password: values.password,
      });
      setStatus("success");
    } catch (error) {
      setStatus("idle");
      const message =
        error instanceof Error ? error.message : "Đăng ký thất bại";

      if (message.includes("Email")) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else if (message.includes("Số điện thoại")) {
        setErrors((prev) => ({ ...prev, phone: message }));
      } else {
        setFormError(message);
      }
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm">
        <CircleCheck size={48} className="text-primary" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-2xl font-bold text-text">
          Tạo tài khoản thành công
        </h2>
        <p className="mt-2 text-text-secondary">
          Bạn có thể đăng nhập ngay để bắt đầu mua sắm.
        </p>
        <Link
          href="/login"
          className="mt-6 rounded-full bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-10">
      <h1 className="text-center font-serif text-3xl font-bold text-text">
        Đăng ký tài khoản
      </h1>
      <p className="mt-2 text-center text-sm text-text-secondary">
        Tạo tài khoản để mua sắm dễ dàng hơn và nhận nhiều ưu đãi dành riêng
        cho bạn.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Họ và tên" error={errors.fullName}>
          <input
            type="text"
            value={values.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="Nhập họ và tên của bạn"
            className={inputClassName(Boolean(errors.fullName))}
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            type="email"
            value={values.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="example@email.com"
            className={inputClassName(Boolean(errors.email))}
          />
        </Field>

        <Field label="Số điện thoại" error={errors.phone}>
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="Nhập số điện thoại"
            className={inputClassName(Boolean(errors.phone))}
          />
        </Field>

        <Field label="Mật khẩu" error={errors.password}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Tạo mật khẩu"
              className={inputClassName(Boolean(errors.password))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <Field label="Xác nhận mật khẩu" error={errors.confirmPassword}>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={values.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className={inputClassName(Boolean(errors.confirmPassword))}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              aria-label={
                showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
              }
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <div>
          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={values.agreeTerms}
              onChange={(e) => updateField("agreeTerms", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            Tôi đã đọc và đồng ý với{" "}
            <Link href="#" className="text-primary underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="#" className="text-primary underline">
              Chính sách bảo mật
            </Link>
          </label>
          {errors.agreeTerms ? (
            <p className="mt-1 text-xs text-error">{errors.agreeTerms}</p>
          ) : null}
        </div>

        {formError ? (
          <p className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus size={18} aria-hidden="true" />
          )}
          Tạo tài khoản
        </button>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="h-px flex-1 bg-border" />
          HOẶC
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="text-center text-sm text-text-secondary">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-primary underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
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
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </label>
  );
}
