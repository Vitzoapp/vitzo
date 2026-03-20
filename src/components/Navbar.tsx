"use client";

import React from "react";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, User as UserIcon, Search, Menu, Package, Settings, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSearch } from "@/context/SearchContext";



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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

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
        <div className="hidden flex-1 max-w-lg mx-4 lg:mx-8 md:flex">
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
              <div className="absolute top-[110%] left-0 w-full bg-white rounded-xl shadow-2xl z-[100] max-h-[60vh] overflow-y-auto flex flex-col">
                <p className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-700 italic border-b border-slate-50">Pulse Synchronized Results</p>
                <div className="flex flex-col">
                  {filteredProducts.length > 0 ? filteredProducts.map((p) => (
                    <button 
                      key={p.id} 
                      onClick={() => setSearchQuery(p.name)}
                      className="flex items-center gap-4 p-3 border-b border-gray-100 bg-white text-gray-900 transition-all hover:bg-gray-50 group"
                    >
                       <div className="h-12 w-12 overflow-hidden rounded-xl bg-gray-100 border border-gray-100 shadow-inner relative flex-shrink-0">
                        <Image 
                          src={p.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"} 
                          alt={p.name} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";
                          }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-[var(--color-primary-green)] transition-colors line-clamp-1 truncate">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase italic">₹{p.price.toLocaleString("en-IN")}</p>
                      </div>
                    </button>
                  )) : (
                    <div className="p-8 text-center bg-white">
                       <p className="text-sm font-bold text-slate-400 italic">No products found for &quot;{searchQuery}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-slate-600 md:hidden hover:bg-gray-100 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
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
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-slate-600 md:hidden hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-white p-4 animate-in slide-in-from-top duration-300 md:hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fresh goods..."
                className="w-full h-12 bg-slate-100 border-none rounded-2xl pl-12 pr-4 font-bold text-slate-900 focus:ring-2 focus:ring-[var(--color-primary-green)]"
              />
            </div>
            <button onClick={() => setIsMobileSearchOpen(false)} className="text-sm font-black text-slate-600 uppercase tracking-widest hover:text-[var(--color-primary-green)]">Cancel</button>
          </div>
          
          <div className="space-y-4">
             {filteredProducts.map(p => (
               <button 
                 key={p.id}
                 onClick={() => { setSearchQuery(p.name); setIsMobileSearchOpen(false); }}
                 className="flex items-center gap-4 w-full p-3 bg-white border border-gray-50 rounded-2xl shadow-sm hover:bg-slate-50 transition-all"
               >
                 <div className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden relative border-2 border-gray-50">
                    <Image 
                      src={p.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"} 
                      alt={p.name} 
                      fill 
                      className="object-cover" 
                    />
                 </div>
                 <div className="flex-1 text-left">
                    <p className="font-black text-slate-900 uppercase italic text-sm leading-tight">{p.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase italic mt-1">₹{p.price}</p>
                 </div>
               </button>
             ))}
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-2xl z-50 flex flex-col py-4 rounded-b-2xl border-t border-gray-50 md:hidden animate-in slide-in-from-top duration-300">
           <div className="px-6 mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black italic uppercase text-slate-400 tracking-[0.2em]">Menu NODE</h2>
           </div>
           
           <nav className="flex flex-col">
              <MobileNavItem href="/" label="Home Base" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem href="/products" label="Shop Inventory" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem href="/categories" label="Categories" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem href="/profile" label="Control Panel" onClick={() => setIsMenuOpen(false)} />
              {isAdmin && (
                 <Link 
                   href="/admin" 
                   onClick={() => setIsMenuOpen(false)}
                   className="w-full text-left px-6 py-4 text-[var(--color-primary-green)] font-black uppercase italic text-sm tracking-widest border-b border-gray-100 hover:bg-gray-50 transition-all"
                 >
                   ADMIN CORE
                 </Link>
              )}
              <Link 
                href="/cart" 
                onClick={() => setIsMenuOpen(false)} 
                className="w-full text-left px-6 py-4 text-gray-900 font-bold text-lg flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-all"
              >
                 <span>Shopping Cart</span>
                 <span className="h-7 w-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black">{totalItems}</span>
              </Link>
           </nav>
        </div>
      )}
    </header>
  );
}

function MobileNavItem({ href, label, onClick }: { href: string, label: string, onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="w-full text-left px-6 py-4 text-gray-900 font-bold text-lg border-b border-gray-100 hover:bg-gray-50 transition-all"
    >
      {label}
    </Link>
  );
}
