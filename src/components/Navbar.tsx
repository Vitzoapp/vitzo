"use client";

import Link from "next/link";
import { ShoppingCart, User, Search, Menu, LogOut, Settings } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { totalItems } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = user?.email === "vitzo.hq@gmail.com";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tighter text-slate-900 font-outfit uppercase italic">
              <span className="text-[var(--color-primary-gold)]">V</span>
              itzo
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden space-x-8 md:flex">
            <Link
              href="/products"
              className="text-sm font-bold text-slate-600 transition-colors hover:text-[var(--color-primary-gold)]"
            >
              Shop Grocery
            </Link>
            <Link
              href="/categories"
              className="text-sm font-bold text-slate-600 transition-colors hover:text-[var(--color-primary-gold)]"
            >
              Categories
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-extrabold text-slate-900 transition-colors hover:text-[var(--color-primary-gold)] flex items-center gap-1"
              >
                <Settings className="h-3 w-3" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-4">
          <div className="relative hidden items-center md:flex group">
            <Search className="absolute left-3 h-4 w-4 text-slate-400 group-focus-within:text-[var(--color-primary-gold)] transition-colors" />
            <input
              type="text"
              placeholder="Search groceries..."
              className="h-10 w-64 rounded-xl border border-gray-100 bg-gray-50 pl-10 pr-4 text-sm outline-none ring-[var(--color-primary-gold)] transition-all focus:ring-2 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 mr-2">
                <div className="hidden lg:block text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Logged in as</p>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-slate-600 transition-colors hover:bg-[var(--color-primary-gold)] hover:text-slate-900"
                title="Login"
              >
                <User className="h-5 w-5" />
              </button>
            )}
            
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition-all hover:scale-105"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-gold)] text-[10px] font-black text-slate-900 shadow-lg border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Link>
            <button className="flex h-10 w-10 items-center justify-center rounded-full md:hidden">
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
