"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

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
    <section className="py-8 relative group/section">
      <div className="flex items-center justify-between mb-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-1.5 bg-[var(--color-primary-green)] rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
          <div>
             <h2 className="font-outfit text-2xl font-black text-slate-950 uppercase tracking-tighter italic">
               {title}
             </h2>
             <Link 
               href={`/categories/${category}`}
               className="text-[10px] font-black text-[var(--color-primary-green)] uppercase tracking-[0.3em] hover:text-slate-900 transition-colors"
             >
               Visit {title} Collection &rarr;
             </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-full">
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </section>
  );
}
