import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vitzo | Modern E-commerce",
  description: "Experience the next generation of e-commerce with Vitzo.",
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
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
