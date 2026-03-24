import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import ProductPageClient from "./ProductPageClient";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_catalog")
    .select("id, name, description, image_url, category_name, price")
    .eq("id", id)
    .single();

  if (!data) {
    return {
      title: "Product unavailable",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const image = data.image_url || FALLBACK_IMAGE;
  const title = `${data.name} ${data.category_name ? `| ${data.category_name}` : ""}`;
  const description =
    data.description ||
    `Order ${data.name} from Vitzo with weight-based pricing and local grocery batch delivery.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `/products/${id}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: data.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProductPageClient id={id} />;
}
