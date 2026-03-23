"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  image?: string;
  category: string;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

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

  const cartItem = cart.find((item) => item.id === id);
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
      return;
    }

    updateQuantity(id, quantity - 1);
  };

  return (
    <article className="group">
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-[4/4.85] overflow-hidden rounded-[2rem] bg-white/82 shadow-[0_24px_50px_rgba(33,55,47,0.08)] transition-transform duration-500 group-hover:-translate-y-1">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">
            {category}
          </p>
          <Link href={`/products/${id}`}>
            <h3 className="mt-2 line-clamp-2 font-body text-[1.35rem] font-semibold leading-6 tracking-[-0.04em] text-[var(--forest-950)] transition-colors duration-300 group-hover:text-[var(--accent-deep)]">
              {name}
            </h3>
          </Link>
        </div>

        {quantity > 0 ? (
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/86 p-1">
            <button
              type="button"
              onClick={handleDecrement}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--forest-950)] hover:bg-[var(--surface-soft)]"
              aria-label={`Decrease ${name} quantity`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-5 text-center text-sm font-semibold text-[var(--forest-950)]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forest-950)] text-white"
              aria-label={`Increase ${name} quantity`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/86 text-[var(--forest-950)] hover:border-[var(--accent-deep)] hover:bg-[var(--accent)]"
            aria-label={`Add ${name} to cart`}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-[var(--forest-950)]">
          {currencyFormatter.format(price)}
        </span>
        <span className="text-[var(--forest-700)]">
          {quantity > 0 ? `${quantity} in bag` : "Add to bag"}
        </span>
      </div>
    </article>
  );
}
