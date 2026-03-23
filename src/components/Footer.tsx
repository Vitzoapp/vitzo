import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(255,245,224,0.86)_0%,rgba(255,250,242,0.94)_100%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-md">
          <p className="font-display text-4xl tracking-[0.18em] text-[var(--forest-950)]">
            VITZO
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--forest-700)]">
            Fresh groceries, pantry staples, and neighborhood delivery runs that feel lighter, cleaner, and more local.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-[var(--forest-700)]">
          <Link href="/products" className="hover:text-[var(--forest-950)]">
            Shop
          </Link>
          <Link href="/categories" className="hover:text-[var(--forest-950)]">
            Categories
          </Link>
          <Link href="/orders" className="hover:text-[var(--forest-950)]">
            Orders
          </Link>
          <Link href="/agent/register" className="hover:text-[var(--forest-950)]">
            Become an agent
          </Link>
          <Link href="/login" className="hover:text-[var(--forest-950)]">
            Account
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--line-soft)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-[var(--forest-700)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>(c) {new Date().getFullYear()} Vitzo. All rights reserved.</p>
          <p>Built for calmer grocery runs and cleaner local delivery.</p>
        </div>
      </div>
    </footer>
  );
}
