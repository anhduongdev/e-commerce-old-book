import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/features/pages/services/pages-public";
import { PageContentView } from "@/features/pages/components/PageContentView";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("bao-mat");
  return {
    title: page?.title ?? "Chính sách bảo mật",
    description: page?.metaDescription ?? undefined,
  };
}

export default async function BaoMatPage() {
  const page = await getPageBySlug("bao-mat");
  if (!page) {
    notFound();
  }

  return <PageContentView page={page} />;
}
