"use client";

import Image from "next/image";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  image?: string;
  category: string;
  rating?: number;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

export default function ProductCard({
  id,
  name,
  price,
  image_url,
  image: propImage,
  category,
}: ProductCardProps) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const image = image_url || propImage || FALLBACK_IMAGE;
  
  const cartItem = cart.find(item => item.id === id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    addToCart({ id, name, price, image, category });
  };

  const handleIncrement = () => {
    updateQuantity(id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      removeFromCart(id);
    } else {
      updateQuantity(id, quantity - 1);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[32px] border border-gray-100 bg-white transition-all duration-500 hover:shadow-[0_20px_50px_rgba(6,78,59,0.1)] hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50/50">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = FALLBACK_IMAGE;
          }}
        />
        {/* Category Badge */}
        <div className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-primary-green)] shadow-sm">
          {category}
        </div>
        
        {/* Quick Add Overlay (Mobile Friendly) */}
        {quantity === 0 && (
          <button 
            onClick={handleAdd}
            className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-green)] text-white shadow-xl opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 active:scale-95 lg:flex hidden"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col p-6">
        <h3 className="font-outfit text-xl font-bold text-slate-900 group-hover:text-[var(--color-primary-green)] transition-colors line-clamp-1">
          {name}
        </h3>
        <p className="mt-1 text-xs font-black text-slate-600 uppercase tracking-widest italic">V-Fresh Premium</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-600 leading-none mb-1">Standard Rate</span>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">
              ₹{price.toLocaleString("en-IN")}
            </div>
          </div>

          {quantity > 0 ? (
            <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
              <button 
                onClick={handleDecrement}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-black text-slate-900 animate-in fade-in zoom-in duration-300">
                {quantity}
              </span>
              <button 
                onClick={handleIncrement}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-green)] text-white shadow-md transition-all hover:scale-105 active:scale-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAdd}
              className="flex h-11 px-4 sm:px-6 items-center gap-2 rounded-2xl bg-slate-900 text-white transition-all hover:bg-[var(--color-primary-green)] hover:shadow-lg hover:shadow-[var(--color-primary-green)]/20 active:scale-95 text-[10px] sm:text-sm font-black uppercase italic tracking-widest"
            >
              <ShoppingCart className="h-4 w-4" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
