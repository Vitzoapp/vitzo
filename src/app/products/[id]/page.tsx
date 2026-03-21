"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Plus, Minus, ArrowLeft, Star, ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description?: string;
  specifications?: Record<string, string | number | boolean>;
  category_id?: string;
  categories?: { name: string; slug: string };
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, updateQuantity } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('id', id)
        .single();

      if (data) setProduct(data);
      setLoading(false);
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-square bg-gray-100 rounded-[40px]" />
            <div className="space-y-6">
              <div className="h-4 w-1/4 bg-gray-100 rounded" />
              <div className="h-10 w-3/4 bg-gray-100 rounded" />
              <div className="h-6 w-1/2 bg-gray-100 rounded" />
              <div className="h-32 w-full bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-2xl font-black text-slate-300 italic uppercase">Product not found</p>
        <button onClick={() => router.back()} className="mt-4 text-[var(--color-primary-green)] font-bold">Go Back</button>
      </div>
    );
  }

  const cartItem = cart.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    addToCart({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      image: product.image_url || FALLBACK_IMAGE, 
      category: product.categories?.name || "Premium" 
    });
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-bold uppercase tracking-widest text-xs">Back to Collection</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="relative aspect-square overflow-hidden rounded-[40px] border border-gray-100 bg-gray-50 group">
            <Image
              src={product.image_url || FALLBACK_IMAGE}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          {/* Content */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-green-50 text-[var(--color-primary-green)] text-[10px] font-black uppercase tracking-widest rounded-full">
                {product.categories?.name || "Premium Selection"}
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-black text-slate-900">4.8</span>
                <span className="text-xs text-slate-400 font-bold">(120+ Reviews)</span>
              </div>
            </div>

            <h1 className="font-outfit text-4xl md:text-5xl font-black text-slate-950 uppercase tracking-tighter italic mb-4">
              {product.name}
            </h1>

            <div className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">
              ₹{product.price.toLocaleString("en-IN")}
              <span className="text-sm text-slate-400 ml-2 font-bold uppercase italic tracking-widest">Incl. all taxes</span>
            </div>

            <div className="space-y-6 mb-8">
              <p className="text-slate-600 leading-relaxed font-medium">
                {product.description || "Experience the pinnacle of freshness with Vitzo's premium selection. Handpicked and quality guaranteed for your kitchen."}
              </p>

              {/* USP's */}
              <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-100">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="h-6 w-6 text-[var(--color-primary-green)]" />
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">10 Min Delivery</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-[var(--color-primary-green)]" />
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">Quality Assured</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RefreshCcw className="h-6 w-6 text-[var(--color-primary-green)]" />
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">Easy Returns</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {quantity > 0 ? (
                <div className="flex flex-1 items-center justify-between bg-slate-900 text-white p-2 rounded-2xl shadow-xl">
                  <button 
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="text-xl font-black">{quantity}</span>
                  <button 
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--color-primary-green)] shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAdd}
                  className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 hover:bg-[var(--color-primary-green)] transition-all shadow-xl active:scale-95"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
              )}
              <button className="flex-1 h-14 bg-white border-2 border-slate-900 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] italic hover:bg-slate-50 transition-all active:scale-95">
                Buy Now
              </button>
            </div>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="font-outfit text-xl font-black text-slate-950 uppercase tracking-tighter italic mb-4">Product Details</h3>
                <div className="space-y-3 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-wider font-outfit">{key}</span>
                      <span className="text-sm font-bold text-slate-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
