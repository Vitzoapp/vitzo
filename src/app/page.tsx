import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import LiveBatchCounter from "@/components/LiveBatchCounter";
import { getCategoryVisual } from "@/lib/categoryVisuals";
import type { ProductUnitType, WeightUnit } from "@/lib/pricing";
import { normalizeAllowedUnitsForProduct, normalizeProductUnitType } from "@/lib/pricing";
import { createClient } from "@/utils/supabase/server";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  unit_type: ProductUnitType | null;
  allowed_units: WeightUnit[] | null;
}

interface BatchSnapshot {
  active_orders: number;
  batch_date: string;
  delivery_batch: string;
}

const heroImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vitzo Grocery Delivery in Kozhikode",
  description:
    "Order vegetables, fruits, pantry staples, and daily groceries from Vitzo with live batch timing, fast local drops, and weight-based ordering.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vitzo Grocery Delivery in Kozhikode",
    description:
      "Shop the live grocery batch, see closing countdowns, and build your basket with weight-based ordering on Vitzo.",
    url: "/",
    images: [
      {
        url: heroImage,
        width: 1600,
        height: 900,
        alt: "Vitzo live grocery batch homepage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitzo Grocery Delivery in Kozhikode",
    description:
      "Live grocery batches, fresh daily essentials, and weight-based ordering from Vitzo.",
    images: [heroImage],
  },
};

export default async function Home() {
  const supabase = await createClient();

  const [catRes, prodRes, batchRes] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("product_catalog").select("*").limit(12),
    supabase.rpc("get_current_batch_snapshot"),
  ]);

  const categories = catRes.data || [];
  const products = ((prodRes.data || []) as Product[]).map((product) => ({
    ...product,
    unit_type: normalizeProductUnitType(product.unit_type),
    allowed_units: normalizeAllowedUnitsForProduct(product.allowed_units, product.unit_type),
  }));
  const batchSnapshot = (batchRes.data?.[0] ?? null) as BatchSnapshot | null;

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Fresh groceries laid out for the current neighborhood batch."
            fill
            priority
            className="vitzo-hero-pan object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(98deg,rgba(24,49,40,0.92)_0%,rgba(24,49,40,0.76)_34%,rgba(24,49,40,0.2)_72%,rgba(24,49,40,0.08)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,216,77,0.34),transparent_36%),radial-gradient(circle_at_76%_24%,rgba(242,106,46,0.26),transparent_24%)]" />

        <div className="relative flex min-h-[calc(100svh-5rem)] items-end px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-end justify-between gap-10">
            <div className="max-w-[34rem] text-white">
              <p className="animate-reveal font-display text-[clamp(5.25rem,17vw,11.5rem)] leading-[0.78] tracking-[0.12em] text-[var(--cream-100)]">
                VITZO
              </p>
              <h1 className="animate-reveal animation-delay-150 mt-3 font-body text-[clamp(2.45rem,5vw,4.8rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-white">
                Build tonight&apos;s basket while the batch is filling.
              </h1>
              <p className="animate-reveal animation-delay-300 mt-5 max-w-md text-sm leading-7 text-white/82 sm:text-base">
                Fresh vegetables, fruit, pantry picks, and daily staples arranged for one faster neighborhood run.
              </p>
              <div className="animate-reveal animation-delay-450 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#gallery"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--forest-950)] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Shop this batch
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/categories"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/28 px-6 text-sm font-semibold text-white/92 transition-colors duration-300 hover:bg-white/10"
                >
                  Browse aisles
                </Link>
              </div>
              <div className="mt-8 lg:hidden">
                <LiveBatchCounter initialSnapshot={batchSnapshot} />
              </div>
            </div>

            <div className="hidden max-w-[24rem] self-center lg:block">
              <LiveBatchCounter initialSnapshot={batchSnapshot} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(255,248,236,0.98)_0%,rgba(255,252,245,0.92)_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex snap-x snap-mandatory gap-3">
              {categories.map((category) => {
                const { icon: Icon, tintClass } = getCategoryVisual(
                  category.slug,
                  category.name,
                );

                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group min-w-[10.5rem] snap-start rounded-[1.9rem] border border-[var(--line-soft)] bg-white px-4 py-4 shadow-[0_16px_32px_rgba(24,49,40,0.05)] transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${tintClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-semibold tracking-[-0.02em] text-[var(--forest-950)]">
                      {category.name}
                    </p>
                    <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-deep)]">
                      View aisle
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-[var(--line-soft)] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="vitzo-kicker">Current gallery</p>
            <h2 className="mt-2 font-body text-[clamp(2.1rem,4vw,3.7rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-[var(--forest-950)]">
              Pick weights right here and keep the basket moving.
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-deep)]"
          >
            View full market
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image_url={product.image_url ?? heroImage}
              category={product.category_name || "Fresh pick"}
              allowedUnits={normalizeAllowedUnitsForProduct(product.allowed_units, product.unit_type)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
