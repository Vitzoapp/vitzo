// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { SearchProvider } from "@/context/SearchContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vitzo | Fresh Groceries & Daily Essentials Delivered",
  description: "Shop farm-fresh produce, household essentials, and daily needs. Enjoy smart, eco-friendly batch delivery right to your door.",
  keywords: ["grocery delivery", "fresh produce", "online supermarket", "Vitzo"],
  authors: [{ name: "Vitzo" }],
  openGraph: {
    title: "Vitzo | Fresh Groceries Delivered Fast",
    description: "Your daily essentials delivered efficiently. Save up to 30% with our smart batching system.",
    url: "https://vitzo.com",
    siteName: "Vitzo",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.jpg", // Ensure you add an 1200x630 promotional image in the public folder
        width: 1200,
        height: 630,
        alt: "Vitzo Groceries",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitzo | Fresh Groceries Delivered",
    description: "Your daily essentials delivered efficiently directly to your door.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981", // Matches your primary green for mobile browser headers
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <CartProvider>
          <SearchProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </SearchProvider>
        </CartProvider>
      </body>
    </html>
  );
}
