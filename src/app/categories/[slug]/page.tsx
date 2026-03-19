"use client";

import { use, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductGrid from "@/components/ProductGrid";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params);
  const [category, setCategory] = useState<Category | null>(null);

  interface Category {
    id: string;
    name: string;
    slug: string;
  }

  useEffect(() => {
    const fetchCategory = async () => {
      const { data } = await supabase.from('categories').select('*').eq('slug', slug).single();
      if (data) setCategory(data);
    };
    fetchCategory();
  }, [slug]);

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Link 
          href="/categories" 
          className="inline-flex items-center gap-2 mb-8 text-sm font-black text-slate-400 hover:text-[var(--color-primary-green)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Categories
        </Link>

        {category && (
          <div className="flex flex-col space-y-4 mb-12">
            <h1 className="font-outfit text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {category.name}
            </h1>
            <p className="max-w-xl text-lg font-bold text-slate-500 italic">
              Premium selection of {category.name.toLowerCase()}.
            </p>
          </div>
        )}

        <div className="mt-12">
          {category && <ProductGrid categoryId={category.id} />}
        </div>
      </div>
    </div>
  );
}
