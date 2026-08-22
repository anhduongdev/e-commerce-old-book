import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/features/pages/services/pages-public";
import { PageContentView } from "@/features/pages/components/PageContentView";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("gioi-thieu");
  return {
    title: page?.title ?? "Giới thiệu",
    description: page?.metaDescription ?? undefined,
  };
}

export default async function GioiThieuPage() {
  const page = await getPageBySlug("gioi-thieu");
  if (!page) {
    notFound();
  }

  return <PageContentView page={page} />;
}
