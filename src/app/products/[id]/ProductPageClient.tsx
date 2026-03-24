"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import WeightSelector from "@/components/WeightSelector";
import type { ProductUnitType, WeightUnit } from "@/lib/pricing";
import {
  getUnitPriceLabel,
  normalizeAllowedUnitsForProduct,
  normalizeProductUnitType,
} from "@/lib/pricing";

interface Product {
  id: string;
  name: string;
  price: number;
  final_price: number;
  image_url: string | null;
  description?: string | null;
  specifications?: Json | null;
  category_id?: string | null;
  category_name: string | null;
  category_slug: string | null;
  unit_type?: ProductUnitType | null;
  allowed_units?: WeightUnit[] | null;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const highlights = [
  {
    icon: Truck,
    label: "Next drop",
    copy: "Neighborhood delivery windows throughout the day.",
  },
  {
    icon: ShieldCheck,
    label: "Fresh handling",
    copy: "Picked to move fast from shelf to doorstep.",
  },
];

export default function ProductPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("product_catalog")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setProduct({
          ...data,
          unit_type: normalizeProductUnitType(data.unit_type),
          allowed_units: normalizeAllowedUnitsForProduct(data.allowed_units, data.unit_type),
        });
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-[2.5rem] bg-white/70" />
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/70" />
            <div className="h-14 w-3/4 animate-pulse rounded-full bg-white/70" />
            <div className="h-6 w-40 animate-pulse rounded-full bg-white/70" />
            <div className="h-32 w-full animate-pulse rounded-[2rem] bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[calc(100svh-5rem)] flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
        <p className="font-display text-6xl tracking-[0.14em] text-[var(--forest-950)]">
          MISSING
        </p>
        <p className="mt-3 text-sm text-[var(--forest-700)]">
          This product is not available right now.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    );
  }

  const image = product.image_url || FALLBACK_IMAGE;
  const allowedUnits = normalizeAllowedUnitsForProduct(product.allowed_units, product.unit_type);

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)]">
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest-700)] transition-colors duration-300 hover:text-[var(--forest-950)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shopping
        </button>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="relative aspect-[1/1.02] overflow-hidden rounded-[2.75rem] bg-white/80 shadow-[0_28px_65px_rgba(33,55,47,0.08)]">
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="vitzo-kicker">
              {product.category_name || "Fresh selection"}
            </p>
            <h1 className="mt-3 max-w-xl font-body text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--forest-950)]">
              {product.name}
            </h1>
            <p className="mt-4 text-2xl font-semibold text-[var(--forest-950)] sm:text-3xl">
              {currencyFormatter.format(product.price)} {getUnitPriceLabel(allowedUnits[0] ?? "g")}
            </p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--forest-700)] sm:text-base">
              {product.description ||
                "A fresh grocery pick chosen for quick household restocks and steady local delivery windows."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {highlights.map(({ icon: Icon, label, copy }) => (
                <div
                  key={label}
                  className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white/68 p-5"
                >
                  <Icon className="h-5 w-5 text-[var(--accent-deep)]" />
                  <h2 className="mt-3 font-semibold text-[var(--forest-950)]">
                    {label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--forest-700)]">
                    {copy}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <WeightSelector
                productId={product.id}
                productName={product.name}
                category={product.category_name || "Fresh pick"}
                image={image}
                pricePerKg={product.price}
                allowedUnits={allowedUnits}
              />
            </div>

            {product.specifications &&
              !Array.isArray(product.specifications) &&
              typeof product.specifications === "object" &&
              Object.keys(product.specifications).length > 0 && (
                <div className="mt-10 rounded-[2rem] border border-[var(--line-soft)] bg-white/64 p-6">
                  <h2 className="font-body text-xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                    Product details
                  </h2>
                  <div className="mt-5 space-y-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 border-t border-[var(--line-soft)] pt-3 first:border-t-0 first:pt-0"
                      >
                        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-deep)]">
                          {key}
                        </span>
                        <span className="text-sm text-[var(--forest-950)]">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
