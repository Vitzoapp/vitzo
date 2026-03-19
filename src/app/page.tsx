"use client";

import Link from "next/link";
import { ShoppingBag, Zap, ShieldCheck, MapPin } from "lucide-react";
import CategorySection from "@/components/CategorySection";
import CountdownTimer from "@/components/CountdownTimer";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSearch } from "@/context/SearchContext";

import ProductCard from "@/components/ProductCard";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category_id: string;
  categories?: { name: string };
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { searchQuery } = useSearch();

  useEffect(() => {
    const fetchHomeData = async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('products').select('*, categories(name, slug)')
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    };

    fetchHomeData();
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Dynamic Banner Section */}
      <section className="bg-[var(--color-primary-green)] pt-8 pb-20 relative overflow-hidden">
        {/* Abstract Background pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 skew-x-12 translate-x-1/2" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex flex-col space-y-8 max-w-2xl">
              <CountdownTimer />
              
              <h1 className="font-outfit text-6xl font-black leading-[0.9] sm:text-8xl text-white tracking-tighter">
                ORDER BY <br />
                <span className="text-white drop-shadow-2xl">11:00 AM</span>
              </h1>
              
              <p className="text-2xl font-black text-white/80 italic tracking-tight">
                For delivery today at <span className="text-white underline decoration-4 decoration-white/50 underline-offset-8">1:00 PM</span>
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center rounded-3xl bg-slate-900 px-10 py-5 text-lg font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95 hover:bg-slate-800"
                >
                  Start Shopping
                </Link>
              </div>
            </div>
            
            {/* Visual element (Grocery Bag) */}
            <div className="relative group">
               <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse group-hover:bg-white/40 transition-all" />
               <div className="relative flex h-80 w-80 md:h-[450px] md:w-[450px] items-center justify-center rounded-[60px] border-8 border-white/30 bg-white/10 backdrop-blur-md shadow-2xl transform rotate-3 transition-transform hover:rotate-0">
                 <div className="absolute -top-8 -right-8 h-24 w-24 bg-[var(--color-secondary-green)] rounded-full border-4 border-white flex items-center justify-center shadow-xl rotate-12">
                    <span className="text-white font-black text-xl italic leading-none text-center">FRESH<br/>PICK</span>
                 </div>
                 <ShoppingBag className="h-48 w-48 text-white drop-shadow-2xl" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <div className="mx-auto max-w-7xl px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
             <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
               <Zap className="h-8 w-8 text-orange-500" />
             </div>
             <div>
               <h3 className="font-black text-slate-900 text-lg">Community Prices</h3>
               <p className="text-sm font-bold text-slate-400">Save up to 30% by batching orders.</p>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
             <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
               <ShieldCheck className="h-8 w-8 text-green-500" />
             </div>
             <div>
               <h3 className="font-black text-slate-900 text-lg">Eco-Friendly</h3>
               <p className="text-sm font-bold text-slate-400">1 Truck. 1 Trip. Zero Emissions.</p>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
             <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
               <MapPin className="h-8 w-8 text-blue-500" />
             </div>
             <div>
               <h3 className="font-black text-slate-900 text-lg">Farm Fresh</h3>
               <p className="text-sm font-bold text-slate-400">Direct from farm to your door.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-20">
        {searchQuery ? (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-slate-900">Found {filteredProducts.length} products for &quot;{searchQuery}&quot;</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map(p => (
                <ProductCard 
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image_url}
                  category={p.categories?.name || 'Uncategorized'}
                />
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-2xl font-bold text-slate-400 italic">No products matched your search.</p>
              </div>
            )}
          </div>
        ) : (
          categories.map((cat) => {
            const catProducts = products.filter(p => p.category_id === cat.id);
            if (catProducts.length === 0) return null;
            return (
              <CategorySection 
                key={cat.id}
                title={cat.name}
                category={cat.slug}
                products={catProducts.map(p => ({
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  image: p.image_url,
                  category: cat.name
                }))}
              />
            );
          })
        )}
      </main>
    </div>
  );
}
