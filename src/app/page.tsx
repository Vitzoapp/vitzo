import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import LandingProductRail from "@/components/LandingProductRail";
import { createClient } from "@/utils/supabase/server";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category_id: string;
  categories?: { name: string; slug: string };
}

const heroImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getBatchCopy(now: Date) {
  const hour = now.getHours();

  if (hour < 11) {
    return "Order before 11:00 AM for today's 1:00 PM neighborhood drop.";
  }

  if (hour < 18) {
    return "Order before 6:00 PM for tonight's 8:00 PM neighborhood drop.";
  }

  return "Tonight's run is closed. Build your basket now for tomorrow's 1:00 PM drop.";
}

export default async function Home() {
  const supabase = await createClient();

  const [catRes, prodRes] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase.from("products").select("*, categories(name, slug)").limit(24),
  ]);

  const categories = (catRes.data || []) as Category[];
  const products = (prodRes.data || []) as Product[];
  const batchCopy = getBatchCopy(new Date());

  const featuredCategories = categories
    .map((category) => ({
      ...category,
      products: products
        .filter((product) => product.category_id === category.id)
        .slice(0, 4)
        .map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_url,
          category: category.name,
        })),
    }))
    .filter((category) => category.products.length > 0)
    .slice(0, 3);

  const featuredShowcase = featuredCategories.map((category) => ({
    ...category,
    lead: category.products[0],
  }));

  const selectionPreview = products.slice(0, 2);

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Fresh produce arranged across a grocery aisle."
            fill
            priority
            className="vitzo-hero-pan object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,49,40,0.88)_0%,rgba(24,49,40,0.7)_34%,rgba(24,49,40,0.22)_68%,rgba(24,49,40,0.08)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,216,77,0.34),transparent_36%),radial-gradient(circle_at_72%_28%,rgba(242,106,46,0.24),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(125,207,89,0.18),transparent_32%)]" />
        <div className="vitzo-grain absolute inset-0 opacity-50" />

        <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl items-end px-4 pb-14 pt-10 sm:px-6 lg:px-8">
          <div className="max-w-[34rem] text-white">
            <p className="animate-reveal font-display text-[clamp(5.25rem,17vw,11.5rem)] leading-[0.78] tracking-[0.12em] text-[var(--cream-100)]">
              VITZO
            </p>
            <h1 className="animate-reveal animation-delay-150 max-w-xl font-body text-[clamp(2.3rem,5vw,4.5rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-white">
              Fresh groceries, quietly batched for your block.
            </h1>
            <p className="animate-reveal animation-delay-300 mt-4 max-w-md text-sm leading-6 text-white/82 sm:text-base">
              {batchCopy}
            </p>
            <div className="animate-reveal animation-delay-450 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--forest-950)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Start shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/28 px-6 text-sm font-semibold text-white/92 transition-colors duration-300 hover:bg-white/10"
              >
                See categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(255,244,221,0.82)_0%,rgba(255,250,241,0.92)_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="vitzo-kicker">Start with the basket</p>
            <h2 className="mt-3 font-body text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--forest-950)]">
              Make the first click about groceries users want to buy tonight.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--forest-700)] sm:text-base">
              Lead with bright, familiar essentials so the homepage behaves like a market entrance instead of a brand explainer.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {featuredShowcase.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-[var(--line-soft)] bg-white/74 shadow-[0_18px_45px_rgba(242,106,46,0.08)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={category.lead.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">
                    Popular aisle
                  </p>
                  <h3 className="mt-3 font-body text-2xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                    {category.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--forest-700)]">
                    Start with {category.lead.name.toLowerCase()} and keep building from this aisle.
                  </p>
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--forest-950)]">
                      From {currencyFormatter.format(category.lead.price)}
                    </span>
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--accent-deep)]">
                      Shop now
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line-soft)]">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.72fr)_1fr] lg:px-8">
          <div className="h-fit lg:sticky lg:top-28">
            <p className="vitzo-kicker">Browse the drop</p>
            <h2 className="mt-3 font-body text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--forest-950)]">
              Move from produce to pantry without the usual storefront noise.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--forest-700)] sm:text-base">
              Each aisle stays focused so the page reads like a quiet market walk: one shelf at a time, no promo soup, no filler panels.
            </p>

            <div className="mt-10 space-y-5">
              {selectionPreview.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 border-t border-[var(--line-soft)] py-4 first:border-t"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-[1.5rem] bg-white/70">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">
                      Fresh pick
                    </p>
                    <h3 className="mt-1 truncate font-body text-lg font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--forest-700)]">
                      {currencyFormatter.format(product.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            {featuredCategories.map((category) => (
              <LandingProductRail
                key={category.id}
                title={category.name}
                href={`/categories/${category.slug}`}
                products={category.products}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-[var(--line-soft)] bg-[linear-gradient(135deg,rgba(255,216,77,0.2)_0%,rgba(255,242,219,0.9)_38%,rgba(255,255,255,0.84)_100%)]">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_center,rgba(242,106,46,0.18),transparent_62%)] lg:block" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="vitzo-kicker">Ready for the next run</p>
            <h2 className="mt-3 font-display text-[clamp(3.5rem,10vw,6.5rem)] leading-[0.84] tracking-[0.08em] text-[var(--forest-950)]">
              STOCK THE NIGHT
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--forest-700)] sm:text-base">
              Start your basket now or join the local delivery crew that keeps each batch moving with less waste and less rush.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--forest-950)] px-6 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                Shop the market
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/agent/register"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--forest-950)]/15 px-6 text-sm font-semibold text-[var(--forest-950)] transition-colors duration-300 hover:bg-white/55"
              >
                Become an agent
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-3 border-t border-[var(--line-soft)] pt-6 text-sm text-[var(--forest-700)]">
              <ShieldCheck className="h-4 w-4 text-[var(--accent-deep)]" />
              Fewer routes, steadier slots, and a clearer grocery flow from shelf to doorstep.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
