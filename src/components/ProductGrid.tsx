"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearch } from "@/context/SearchContext";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id?: string | null;
  categories?: { name: string; slug: string } | null;
}

interface ProductGridProps {
  products?: Product[];
  categoryId?: string;
}

export default function ProductGrid({
  products: initialProducts,
  categoryId,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const { searchQuery } = useSearch();

  useEffect(() => {
    if (!initialProducts) {
      const fetchProducts = async () => {
        setLoading(true);
        let query = supabase.from("products").select("*, categories(name, slug)");

        if (categoryId) {
          query = query.eq("category_id", categoryId);
        }

        const { data } = await query;
        if (data) {
          setProducts(data);
        }
        setLoading(false);
      };

      fetchProducts();
    }
  }, [initialProducts, categoryId]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse space-y-4">
            <div className="aspect-[4/4.85] rounded-[2rem] bg-white/70" />
            <div className="h-3 w-20 rounded-full bg-white/70" />
            <div className="h-6 w-2/3 rounded-full bg-white/70" />
            <div className="h-4 w-1/3 rounded-full bg-white/70" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/58 px-6 py-16 text-center">
        <p className="font-display text-5xl tracking-[0.14em] text-[var(--forest-950)]">
          EMPTY
        </p>
        <p className="mt-3 text-sm text-[var(--forest-700)]">
          No products matched that search. Try a different ingredient or category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          price={product.price}
          image={
            product.image_url ??
            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
          }
          category={product.categories?.name || "Uncategorized"}
        />
      ))}
    </div>
  );
}
