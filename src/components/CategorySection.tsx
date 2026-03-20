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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

        {/* Navigation Arrows */}
        <div className="hidden sm:flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-[var(--color-primary-green)] hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-[var(--color-primary-green)] hover:text-white transition-all active:scale-90"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar scroll-smooth px-4 sm:px-0"
      >
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 snap-start w-[80vw] sm:w-[280px]">
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </section>
  );
}
