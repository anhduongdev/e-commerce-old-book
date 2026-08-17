import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { RegisterIllustration } from "@/features/auth/components/RegisterIllustration";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 text-sm text-brand-600">
        <Link href="/" className="hover:text-brand-900">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-900">Đăng ký</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <RegisterForm />
        <RegisterIllustration />
      </div>
    </div>
  );
}
