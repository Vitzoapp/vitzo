"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ProductRailItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface LandingProductRailProps {
  title: string;
  href: string;
  products: ProductRailItem[];
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

export default function LandingProductRail({
  title,
  href,
  products,
}: LandingProductRailProps) {
  return (
    <article className="border-t border-[var(--line-soft)] pt-8 first:border-t-0 first:pt-0">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">
            {title}
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--forest-700)]">
            Picked for the current neighborhood run with just enough range to keep browsing calm.
          </p>
        </div>
        <Link
          href={href}
          className="hidden items-center gap-2 text-sm font-semibold text-[var(--forest-950)] transition-colors duration-300 hover:text-[var(--accent-deep)] sm:inline-flex"
        >
          View aisle
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="no-scrollbar overflow-x-auto pb-2">
        <ul className="flex snap-x snap-mandatory gap-5 pr-4 lg:grid lg:grid-cols-4 lg:gap-8">
          {products.map((product) => {
            return (
              <li
                key={product.id}
                className="group min-w-[15.5rem] max-w-[16rem] snap-start lg:min-w-0 lg:max-w-none"
              >
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative aspect-[4/4.8] overflow-hidden rounded-[2rem] bg-white/78 shadow-[0_20px_45px_rgba(33,55,47,0.06)] transition-transform duration-500 group-hover:-translate-y-1">
                    <Image
                      src={product.image || FALLBACK_IMAGE}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 248px, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </Link>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-[var(--accent-deep)]">
                      {product.category}
                    </p>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="mt-2 line-clamp-2 font-body text-xl font-semibold leading-6 tracking-[-0.04em] text-[var(--forest-950)] transition-colors duration-300 group-hover:text-[var(--accent-deep)]">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/85 text-[var(--forest-950)] transition-all duration-300 hover:border-[var(--accent-deep)] hover:bg-[var(--accent)]"
                    aria-label={`Open ${product.name}`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--forest-950)]">
                    {currencyFormatter.format(product.price)} / kg
                  </span>
                  <span className="text-[var(--forest-700)]">Choose weight</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
