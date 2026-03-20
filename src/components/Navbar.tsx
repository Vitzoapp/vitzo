"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, User as UserIcon, Search, Menu, Package, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSearch } from "@/context/SearchContext";

const SEARCH_PLACEHOLDERS = ["Search 'tomato'...", "Search 'fresh milk'...", "Search 'organic eggs'...", "Search 'brown bread'...", "Search 'green apples'..."];

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export default function Navbar() {
  const { totalItems } = useCart();
  const { searchQuery, setSearchQuery } = useSearch();
  const [user, setUser] = useState<User | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Fetch products for search suggestions
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      if (data) setProducts(data);
    };
    fetchProducts();

    return () => subscription.unsubscribe();
  }, []);

  // Search Placeholder Animation - removed as searchIndex is unused


  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const isAdmin = user?.email === "vitzo.hq@gmail.com";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-12">
          <Link href="/" className="group flex items-center gap-1 transition-transform hover:scale-105 active:scale-95">
            <span className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 group-hover:text-[var(--color-primary-green)] transition-colors">
              <span className="text-[var(--color-primary-green)]">V</span>ITZO
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary-green)] mt-3 animate-pulse" />
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden space-x-8 md:flex items-center">
            <Link
              href="/products"
              className="group flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[var(--color-primary-green)]"
            >
              <Package className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              Shop Grocery
            </Link>
            <Link
              href="/categories"
              className="group flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[var(--color-primary-green)]"
            >
              <Menu className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
              Categories
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary-green)] px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-[var(--color-primary-green)]/20 transition-all hover:scale-105 active:scale-95"
              >
                <Settings className="h-3 w-3 animate-spin-slow" />
                ADMIN CORE
              </Link>
            )}
          </nav>
        </div>

        {/* Search Bar */}
        <div className="hidden flex-1 max-w-lg mx-8 lg:block">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
              <div className={`absolute h-9 w-9 rounded-full border-2 border-dashed border-[var(--color-secondary-green)]/40 animate-spin-slow transition-all duration-500 ${isSearchFocused ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
              <Search className={`h-5 w-5 transition-colors duration-300 ${isSearchFocused ? 'text-[var(--color-secondary-green)]' : 'text-slate-400'}`} />
            </div>
            
            <label className={`absolute left-12 transition-all duration-500 pointer-events-none z-10 ${isSearchFocused || searchQuery ? '-top-2.5 left-6 bg-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary-green)] shadow-sm' : 'top-1/2 -translate-y-1/2 text-sm font-black uppercase tracking-widest text-slate-400'}`}>
              Inventory Network
            </label>

            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isSearchFocused ? "Enter coordinates for fresh goods..." : ""}
              className="h-14 w-full rounded-[24px] border-2 border-gray-100 bg-gray-50 pl-14 pr-4 text-sm font-black text-slate-900 outline-none transition-all duration-500 focus:border-[var(--color-secondary-green)] focus:bg-white focus:ring-[12px] focus:ring-[var(--color-secondary-green)]/5 placeholder:text-slate-500 placeholder:font-bold italic"
            />
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-3 overflow-hidden rounded-[32px] border border-gray-100 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-700 italic border-b border-slate-50">Pulse Synchronized Results</p>
                <div className="space-y-1">
                  {filteredProducts.length > 0 ? filteredProducts.map((p) => (
                    <button 
                      key={p.id} 
                      onClick={() => setSearchQuery(p.name)}
                      className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all hover:bg-gray-50 group"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-gray-100 border border-gray-50">
                        {p.image_url ? (
                          <div className="relative h-full w-full scale-110 group-hover:scale-125 transition-all duration-500">
                            <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-black text-xs text-[var(--color-primary-green)]">V</div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 group-hover:text-[var(--color-primary-green)] transition-colors line-clamp-1">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">₹{p.price.toLocaleString("en-IN")}</p>
                      </div>
                    </button>
                  )) : (
                    <div className="p-8 text-center">
                       <p className="text-sm font-bold text-slate-400 italic">No products found for &quot;{searchQuery}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user ? (
              <Link 
                href="/profile"
                className="group flex items-center gap-3 rounded-2xl bg-gray-50 p-1.5 pr-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-green)] text-white font-black italic shadow-lg shadow-[var(--color-primary-green)]/20 transition-transform group-hover:scale-110">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="hidden xl:block">
                  <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Wallet & Profile</p>
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">{user.email?.split('@')[0]}</p>
                </div>
              </Link>
            ) : (
              <Link 
                href="/login"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-slate-600 transition-all hover:bg-[var(--color-primary-green)] hover:text-white hover:shadow-lg hover:shadow-[var(--color-primary-green)]/20 active:scale-95"
                title="Login"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
            )}
            
            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white transition-all hover:scale-110 active:scale-95 shadow-xl shadow-slate-900/10"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary-green)] text-[10px] font-black text-white shadow-lg border-2 border-white animate-bounce-subtle">
                  {totalItems}
                </span>
              )}
            </Link>
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-slate-600 md:hidden hover:bg-gray-100 transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

    </header>
  );
}
