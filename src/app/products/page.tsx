import ProductGrid from "@/components/ProductGrid";
import { SlidersHorizontal } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-8 md:flex-row md:items-end md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-4">
            <h1 className="font-outfit text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              All Products
            </h1>
            <p className="max-w-xl text-lg text-slate-500">
              Browse our complete collection of premium essentials designed for the modern lifestyle.
            </p>
          </div>
          
          <button className="flex h-12 items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-6 font-bold text-slate-900 transition-all hover:bg-white hover:shadow-lg active:scale-95">
            <SlidersHorizontal className="h-4 w-4" />
            Filter & Sort
          </button>
        </div>

        <div className="mt-12">
          <ProductGrid />
        </div>
      </div>
    </div>
  );
}
