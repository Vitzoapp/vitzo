"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  interface Category {
    id: string;
    slug: string;
    name: string;
  }

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-4 mb-12">
          <h1 className="font-outfit text-4xl font-black tracking-tight text-slate-900 sm:text-5xl flex items-center gap-4">
            <LayoutGrid className="h-10 w-10 text-[var(--color-primary-green)]" />
            Shop by Category
          </h1>
          <p className="max-w-xl text-lg font-bold text-slate-500 italic">
            Find exactly what you need, organized and fresh.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/categories/${cat.slug}`}
              className="group relative overflow-hidden rounded-[32px] bg-slate-50 p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-[var(--color-primary-green)]/10"
            >
              <div className="relative z-10">
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-[var(--color-primary-green)] transition-colors">
                  {cat.name}
                </h2>
                <p className="mt-2 text-sm font-bold text-slate-400">
                  Explore fresh {cat.name.toLowerCase()} items.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-[var(--color-primary-green)]/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
