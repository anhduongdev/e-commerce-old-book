import Link from "next/link";
import type { PublicPage } from "@/features/pages/types/page-public.types";

export function PageContentView({ page }: { page: PublicPage }) {
  const paragraphs = (page.content ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 text-sm text-text-secondary">
        <Link href="/" className="hover:text-text">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">{page.title}</span>
      </nav>

      <h1 className="font-serif text-3xl font-bold text-text">{page.title}</h1>

      <div className="mt-6 space-y-4">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <p key={index} className="text-text-secondary leading-relaxed">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-text-secondary leading-relaxed">
            Nội dung đang được cập nhật.
          </p>
        )}
      </div>
    </div>
  );
}
