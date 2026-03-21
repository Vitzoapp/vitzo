"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, User as UserIcon, Search, Menu, Package, Settings, X, Clock } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSearch } from "@/context/SearchContext";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

interface Agent {
  id: string;
  user_id: string;
  status: string;
  is_active: boolean;
  full_name?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { searchQuery, setSearchQuery } = useSearch();
  const [user, setUser] = useState<User | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [_isSearchFocused, _setIsSearchFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [_isSearching, _setIsSearching] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchAgent(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchAgent(session.user.id);
      else setAgent(null);
    });

    const fetchAgent = async (userId: string) => {
      const { data } = await supabase.from('agents').select('*').eq('user_id', userId).single();
      setAgent(data);
    };

    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      if (data) setSearchResults(data);
    };
    fetchProducts();

    return () => subscription.unsubscribe();
  }, []);

  const _filteredProducts = searchResults.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const isAdmin = user?.email === "vitzo.hq@gmail.com";

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      if (pathname !== '/products') {
        router.push('/products');
      }
      setIsMobileSearchOpen(false);
    }
  };

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
          <nav className="hidden space-x-6 md:flex items-center">
            <Link
              href="/products"
              className="group flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[var(--color-primary-green)]"
            >
              <Package className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              Shop
            </Link>
            {user && (
              <Link
                href="/orders"
                className="group flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[var(--color-primary-green)]"
              >
                <Clock className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                Orders
              </Link>
            )}
            {agent && (
              <Link
                href="/agent/dashboard"
                className="group flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[var(--color-primary-green)]"
              >
                <div className="relative">
                  <UserIcon className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  <div className={`absolute -top-1 -right-1 h-2 w-2 rounded-full border-2 border-white ${agent.is_active ? 'bg-[var(--color-primary-green)] animate-pulse' : 'bg-red-500'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="leading-none">Agent Panel</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${agent.is_active ? 'text-[var(--color-primary-green)]' : 'text-red-500'}`}>
                    {agent.is_active ? 'Online' : 'Offline'}
                  </span>
                </div>
              </Link>
            )}
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
                className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-[10px] font-black text-white shadow-lg transition-all hover:bg-[var(--color-primary-green)] hover:scale-105 active:scale-95 uppercase tracking-widest italic"
              >
                <Settings className="h-3 w-3 animate-spin-slow" />
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden flex-1 max-w-xs mx-4 lg:mx-8 md:flex">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="h-11 w-full rounded-2xl bg-gray-50 pl-11 pr-4 text-xs font-bold outline-none border border-gray-100 focus:border-[var(--color-primary-green)] transition-all"
            />
          </form>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-slate-600 md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {user ? (
              <Link 
                href="/profile"
                className="group flex items-center gap-3 rounded-2xl bg-gray-50 p-1.5 pr-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary-green)] text-white text-xs font-black italic shadow-lg shadow-[var(--color-primary-green)]/20 transition-transform group-hover:scale-110">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="hidden xl:block">
                  <p className="text-[10px] font-bold text-slate-900 leading-tight truncate max-w-[80px]">{user.email?.split('@')[0]}</p>
                </div>
              </Link>
            ) : (
              <Link 
                href="/login"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-slate-600 transition-all hover:bg-[var(--color-primary-green)] hover:text-white"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
            )}
            
            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white transition-all hover:scale-110 shadow-xl"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-secondary-green)] text-[10px] font-black text-white shadow-lg border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-slate-600 md:hidden"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-white p-4 md:hidden animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="h-12 w-full rounded-2xl bg-gray-50 pl-11 pr-4 text-sm font-bold outline-none border border-gray-100 focus:border-[var(--color-primary-green)]"
              />
            </form>
            <button 
              onClick={() => setIsMobileSearchOpen(false)}
              className="h-12 px-4 font-black uppercase tracking-widest text-xs text-slate-400 italic"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-2xl z-50 flex flex-col py-4 border-t border-gray-50 md:hidden">
           <nav className="flex flex-col">
              <MobileNavItem href="/" label="Home" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem href="/products" label="Shop" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem href="/orders" label="My Orders" onClick={() => setIsMenuOpen(false)} />
              {agent && <MobileNavItem href="/agent/dashboard" label="Agent Panel" onClick={() => setIsMenuOpen(false)} />}
              <MobileNavItem href="/categories" label="Categories" onClick={() => setIsMenuOpen(false)} />
              {isAdmin && <MobileNavItem href="/admin" label="Admin Panel" onClick={() => setIsMenuOpen(false)} />}
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
