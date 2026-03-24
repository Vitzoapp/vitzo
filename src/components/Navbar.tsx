"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock3,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { useSearch } from "@/context/SearchContext";

interface Agent {
  id: string;
  user_id: string | null;
  status: string | null;
  is_active: boolean | null;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, lastAddedItem } = useCart();
  const { searchQuery, setSearchQuery } = useSearch();
  const [user, setUser] = useState<User | null>(null);
  const [profileRole, setProfileRole] = useState("customer");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showCartToast, setShowCartToast] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [bagPulse, setBagPulse] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    const fetchAgent = async (userId: string) => {
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", userId)
        .single();

      setAgent(data);
    };

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (data) {
        setProfileRole(data.role ?? "customer");
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchAgent(session.user.id);
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchAgent(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setAgent(null);
        setProfileRole("customer");
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!lastAddedItem) {
      return;
    }

    setShowCartToast(true);
    setBagPulse(true);
    const timeoutId = window.setTimeout(() => setShowCartToast(false), 2200);
    const pulseTimeoutId = window.setTimeout(() => setBagPulse(false), 700);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(pulseTimeoutId);
    };
  }, [lastAddedItem]);

  const isAdmin = profileRole === "admin";

  const handleSearch = (event?: FormEvent) => {
    event?.preventDefault();

    if (!searchQuery.trim()) {
      return;
    }

    if (pathname !== "/products") {
      router.push("/products");
    }

    setIsMobileSearchOpen(false);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.replace("/");
    router.refresh();
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        isScrolled
          ? "border-[rgba(24,49,40,0.08)] bg-[rgba(255,246,234,0.96)] shadow-[0_16px_40px_rgba(24,49,40,0.08)]"
          : "border-[var(--line-soft)] bg-[rgba(255,246,234,0.82)]"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex items-center gap-3 text-[var(--forest-950)]">
            <span className="font-display text-4xl tracking-[0.18em]">VITZO</span>
            <span className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)] sm:block">
              Quiet grocery delivery
            </span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            <NavLink href="/products" label="Shop" />
            <NavLink href="/categories" label="Categories" />
            {user && <NavLink href="/orders" label="Orders" icon={<Clock3 className="h-4 w-4" />} />}
            {agent && (
              <NavLink
                href="/agent/dashboard"
                label={agent.is_active ? "Agent online" : "Agent panel"}
                icon={
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      agent.is_active ? "bg-[var(--accent-deep)]" : "bg-amber-500"
                    }`}
                  />
                }
              />
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--forest-950)] hover:bg-white/60"
              >
                <Settings className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden max-w-sm flex-1 md:block">
          <form onSubmit={handleSearch} className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--forest-700)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search fruit, pantry, produce..."
              className="h-11 w-full rounded-full border border-[var(--line-soft)] bg-white/65 pl-11 pr-4 text-sm text-[var(--forest-950)] outline-none placeholder:text-[var(--forest-700)] focus:border-[var(--accent-deep)]"
            />
          </form>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/55 text-[var(--forest-950)] md:hidden"
            aria-label="Open search"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/profile"
                className="inline-flex items-center gap-3 rounded-full border border-[var(--line-soft)] bg-white/55 px-3 py-2 text-sm text-[var(--forest-950)]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--forest-950)] text-xs font-semibold text-white">
                  {user.email?.[0]?.toUpperCase() ?? "V"}
                </span>
                <span className="max-w-24 truncate">{user.email?.split("@")[0]}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/55 text-[var(--forest-950)]"
                aria-label="Log out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/55 text-[var(--forest-950)]"
              aria-label="Log in"
            >
              <UserRound className="h-4.5 w-4.5" />
            </Link>
          )}

          <Link
            href="/cart"
            className={`relative inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(242,106,46,0.22)] transition-transform duration-300 ${
              bagPulse ? "scale-110 -translate-y-0.5" : ""
            }`}
          >
            <ShoppingBag className={`h-4.5 w-4.5 transition-transform duration-300 ${bagPulse ? "rotate-[-8deg]" : ""}`} />
            <span className="hidden sm:inline">Bag</span>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[0.68rem] font-semibold text-[var(--forest-950)]">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/55 text-[var(--forest-950)] lg:hidden"
            aria-label="Open menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {showCartToast && lastAddedItem && (
        <div className="pointer-events-none absolute inset-x-0 top-full z-50 flex justify-center px-4">
          <div className="mt-3 inline-flex items-center gap-3 rounded-full border border-[var(--line-soft)] bg-[var(--forest-950)] px-5 py-3 text-sm text-white shadow-[0_20px_45px_rgba(24,49,40,0.22)]">
            <ShoppingBag className="h-4 w-4 text-[var(--accent)]" />
            <span className="font-semibold">
              Added {lastAddedItem.name} to bag
            </span>
          </div>
        </div>
      )}

      {isMobileSearchOpen && (
        <div className="border-t border-[var(--line-soft)] bg-[rgba(247,243,233,0.96)] px-4 py-4 md:hidden">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--forest-700)]" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search fruit, pantry, produce..."
                className="h-12 w-full rounded-full border border-[var(--line-soft)] bg-white/70 pl-11 pr-4 text-sm text-[var(--forest-950)] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--forest-700)]"
            >
              Close
            </button>
          </form>
        </div>
      )}

      {isMenuOpen && (
        <div className="border-t border-[var(--line-soft)] bg-[rgba(247,243,233,0.96)] px-4 py-5 lg:hidden">
          <nav className="flex flex-col gap-2">
            <MobileNavItem href="/" label="Home" onClick={() => setIsMenuOpen(false)} />
            <MobileNavItem href="/products" label="Shop" onClick={() => setIsMenuOpen(false)} />
            <MobileNavItem href="/categories" label="Categories" onClick={() => setIsMenuOpen(false)} />
            {user && <MobileNavItem href="/orders" label="Orders" onClick={() => setIsMenuOpen(false)} />}
            {user && <MobileNavItem href="/profile" label="Profile" onClick={() => setIsMenuOpen(false)} />}
            {agent && (
              <MobileNavItem
                href="/agent/dashboard"
                label="Agent panel"
                onClick={() => setIsMenuOpen(false)}
              />
            )}
            {isAdmin && <MobileNavItem href="/admin" label="Admin" onClick={() => setIsMenuOpen(false)} />}
            {!user && <MobileNavItem href="/login" label="Login" onClick={() => setIsMenuOpen(false)} />}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-12 items-center justify-between rounded-[1.5rem] border border-[var(--line-soft)] bg-white/72 px-4 text-sm font-semibold text-[var(--forest-950)]"
              >
                Logout
                <LogOut className="h-4 w-4 text-[var(--accent-deep)]" />
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest-700)] hover:text-[var(--forest-950)]"
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavItem({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex min-h-12 items-center justify-between rounded-[1.5rem] border border-[var(--line-soft)] bg-white/72 px-4 text-sm font-semibold text-[var(--forest-950)]"
    >
      {label}
      <LayoutGrid className="h-4 w-4 text-[var(--accent-deep)]" />
    </Link>
  );
}
