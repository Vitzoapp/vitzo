"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  slug: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*");
      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <section className="border-b border-[var(--line-soft)] pb-10">
          <p className="vitzo-kicker">Category market</p>
          <h1 className="mt-3 max-w-3xl font-body text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--forest-950)]">
            Start with an aisle that fits tonight&apos;s basket.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--forest-700)] sm:text-base">
            Each section keeps the assortment focused, so users land faster on the groceries they actually came to buy.
          </p>
        </section>

        <section className="grid gap-6 pt-10 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group rounded-[2.25rem] border border-[var(--line-soft)] bg-white/72 p-8 shadow-[0_20px_45px_rgba(33,55,47,0.05)] transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">
                Fresh aisle
              </p>
              <h2 className="mt-4 font-body text-3xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                {category.name}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--forest-700)]">
                Explore {category.name.toLowerCase()} selected for quick local shopping and repeat basket building.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest-950)] transition-colors duration-300 group-hover:text-[var(--accent-deep)]">
                View aisle
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
