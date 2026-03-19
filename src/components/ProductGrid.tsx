"use client";

import ProductCard from "./ProductCard";

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Vitzo Core X1",
    price: 12999,
    image: "/product-1.png",
    category: "GADGETS",
    rating: 4.9,
  },
  {
    id: "2",
    name: "Aura Smart Hub",
    price: 8499,
    image: "/product-1.png", // Reusing image for now
    category: "HOME",
    rating: 4.7,
  },
  {
    id: "3",
    name: "Nebula Flow Buds",
    price: 4599,
    image: "/product-1.png",
    category: "AUDIO",
    rating: 4.8,
  },
  {
    id: "4",
    name: "Titan Charge Dock",
    price: 2999,
    image: "/product-1.png",
    category: "ACCESSORIES",
    rating: 4.5,
  },
];

export default function ProductGrid() {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
      {MOCK_PRODUCTS.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
