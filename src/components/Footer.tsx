import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 font-outfit">
              <span className="text-[var(--color-primary-gold)]">V</span>
              itzo
            </h3>
            <p className="text-sm text-slate-500">
              Modern e-commerce for the next generation. Premium quality, 
              personalized experiences, and rapid delivery.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Shop
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/products" className="hover:text-[var(--color-primary-gold)]">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-[var(--color-primary-gold)]">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/new" className="hover:text-[var(--color-primary-gold)]">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/faq" className="hover:text-[var(--color-primary-gold)]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-[var(--color-primary-gold)]">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[var(--color-primary-gold)]">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/about" className="hover:text-[var(--color-primary-gold)]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--color-primary-gold)]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--color-primary-gold)]">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-100 pt-8 text-center text-sm text-slate-400">
          <p>© {new Date().getFullYear()} Vitzo E-commerce. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
