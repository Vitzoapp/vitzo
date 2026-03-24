"use server";

import { createClient } from "@/utils/supabase/server";

export async function searchProducts(query: string) {
  if (!query || query.trim() === "") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_catalog")
    .select("id, name, price, image_url, category_name")
    .ilike("name", `%${query}%`)
    .limit(5);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    category: product.category_name || "Uncategorized",
  }));
}
