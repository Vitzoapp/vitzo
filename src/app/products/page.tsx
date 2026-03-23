import ProductGrid from "@/components/ProductGrid";
import { SearchCheck } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <section className="border-b border-[var(--line-soft)] pb-10">
          <p className="vitzo-kicker">All products</p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-body text-[clamp(2.4rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--forest-950)]">
                Fill the basket with fresh groceries, pantry staples, and everyday picks.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--forest-700)] sm:text-base">
                Search from the header, skim the aisle, and add what you need without leaving the rhythm of the storefront.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line-soft)] bg-white/62 px-5 py-3 text-sm text-[var(--forest-700)]">
              <SearchCheck className="h-4 w-4 text-[var(--accent-deep)]" />
              Browse what is ready for the next neighborhood drop
            </div>
          </div>
        </section>

        <section className="pt-10">
          <ProductGrid />
        </section>
      </div>
    </div>
  );
}
