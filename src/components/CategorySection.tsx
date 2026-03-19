"use client";

import ProductCard from "./ProductCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
}

interface CategorySectionProps {
  title: string;
  category: string;
  products: Product[];
}

export default function CategorySection({ title, category, products }: CategorySectionProps) {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-outfit text-2xl font-black text-slate-900 flex items-center gap-2">
          <span className="h-8 w-1.5 bg-[var(--color-primary-green)] rounded-full" />
          {title}
        </h2>
        <Link 
          href={`/categories/${category}`}
          className="flex items-center gap-1 text-sm font-bold text-[var(--color-primary-green)] hover:underline"
        >
          See All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <div key={product.id} className="min-w-[280px] w-[280px] flex-shrink-0">
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </section>
  );
}
