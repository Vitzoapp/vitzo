"use server";

import { createClient } from "@/utils/supabase/server";

export async function searchProducts(query: string) {
  if (!query || query.trim() === "") return [];
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, image_url, category_id, categories(name)')
    .ilike('name', `%${query}%`)
    .limit(5);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
    category: (p.categories as any)?.name || 'Uncategorized'
  }));
}
