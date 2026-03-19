"use client";

import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  category,
  rating = 4.5,
}: ProductCardProps) {
  const { addToCart } = useCart();
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all hover:shadow-2xl hover:shadow-slate-200">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Category Badge */}
        <div className="absolute top-4 left-4 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-900 backdrop-blur-md">
          {category}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-outfit text-lg font-bold text-slate-900 group-hover:text-[var(--color-primary-indigo)] transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
            <Star className="h-4 w-4 fill-amber-500" />
            {rating}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-2xl font-black text-slate-900">
            ₹{price.toLocaleString("en-IN")}
          </div>
          <button 
            onClick={() => addToCart({ id, name, price, image, category })}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition-all hover:bg-[var(--color-primary-gold)] hover:shadow-lg hover:shadow-[var(--color-primary-gold)]/20 active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
