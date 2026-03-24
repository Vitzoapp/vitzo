"use client";

import Image from "next/image";
import Link from "next/link";
import WeightSelector from "@/components/WeightSelector";

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
  const image = image_url || propImage || FALLBACK_IMAGE;

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

      <div className="mt-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">
          {category}
        </p>
        <Link href={`/products/${id}`}>
          <h3 className="mt-2 line-clamp-2 font-body text-[1.35rem] font-semibold leading-6 tracking-[-0.04em] text-[var(--forest-950)] transition-colors duration-300 group-hover:text-[var(--accent-deep)]">
            {name}
          </h3>
        </Link>
        <p className="mt-3 text-sm font-semibold text-[var(--forest-950)]">
          {currencyFormatter.format(price)} / kg
        </p>
      </div>

      <div className="mt-5">
        <WeightSelector
          compact
          productId={id}
          productName={name}
          category={category}
          image={image}
          pricePerKg={price}
        />
      </div>
    </article>
  );
}
