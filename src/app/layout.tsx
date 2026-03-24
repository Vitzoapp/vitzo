import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Sora } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { SearchProvider } from "@/context/SearchContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ReferralAttribution from "@/components/ReferralAttribution";
import "./globals.css";

const display = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const body = Sora({
  variable: "--font-body",
  subsets: ["latin"],
});

const siteUrl = "https://vitzo.com";
const defaultOgImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vitzo | Fresh groceries batched for your block",
    template: "%s | Vitzo",
  },
  description:
    "Vitzo brings fresh groceries, pantry staples, and daily essentials together in calmer neighborhood delivery batches.",
  keywords: ["Vitzo", "grocery delivery", "fresh produce", "batch delivery"],
  authors: [{ name: "Vitzo" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vitzo | Fresh groceries batched for your block",
    description:
      "Shop fresh produce and daily essentials with quieter, smarter neighborhood delivery runs.",
    url: siteUrl,
    siteName: "Vitzo",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: defaultOgImage,
        width: 1600,
        height: 900,
        alt: "Vitzo grocery delivery storefront",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitzo | Fresh groceries batched for your block",
    description:
      "Fresh produce and neighborhood delivery rhythms designed to feel lighter, cleaner, and more local.",
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5ecd6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <CartProvider>
          <SearchProvider>
            <Suspense fallback={null}>
              <ReferralAttribution />
            </Suspense>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </SearchProvider>
        </CartProvider>
      </body>
    </html>
  );
}
