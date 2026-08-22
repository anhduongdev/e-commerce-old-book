import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthIllustration } from "@/features/auth/components/AuthIllustration";
import { getCurrentUser } from "@/features/auth/services/session";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 text-sm text-text-secondary">
        <Link href="/" className="hover:text-text">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">Đăng nhập</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <LoginForm />
        <AuthIllustration />
      </div>
    </div>
  );
}
