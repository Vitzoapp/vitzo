"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ProductGrid from "@/components/ProductGrid";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) {
        setCategory(data);
      }
    };

    fetchCategory();
  }, [slug]);

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest-700)] transition-colors duration-300 hover:text-[var(--forest-950)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Link>

        {category && (
          <section className="mt-8 border-b border-[var(--line-soft)] pb-10">
            <p className="vitzo-kicker">{category.name}</p>
            <h1 className="mt-3 max-w-3xl font-body text-[clamp(2.4rem,5vw,4.3rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--forest-950)]">
              Build your basket from the {category.name.toLowerCase()} aisle.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--forest-700)] sm:text-base">
              Browse the current selection for this category and add straight from the shelf.
            </p>
          </section>
        )}

        <section className="pt-10">
          {category && <ProductGrid categoryId={category.id} />}
        </section>
      </div>
    </div>
  );
}
