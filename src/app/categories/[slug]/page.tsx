import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import CategoryPageClient from "./CategoryPageClient";

const categoryImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", slug)
    .single();

  if (!data) {
    return {
      title: "Category unavailable",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${data.name} Groceries`;
  const description = `Shop ${data.name.toLowerCase()} on Vitzo with live batch delivery and weight-based ordering.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/categories/${data.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/categories/${data.slug}`,
      images: [
        {
          url: categoryImage,
          width: 1600,
          height: 900,
          alt: `${data.name} groceries on Vitzo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [categoryImage],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <CategoryPageClient slug={slug} />;
}
