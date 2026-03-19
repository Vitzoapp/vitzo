import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSearch } from "@/context/SearchContext";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category_id?: string;
  categories?: { name: string };
}

interface ProductGridProps {
  products?: any[];
  categoryId?: string;
}

export default function ProductGrid({ products: initialProducts, categoryId }: ProductGridProps) {
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const { searchQuery } = useSearch();

  useEffect(() => {
    if (!initialProducts) {
      const fetchProducts = async () => {
        setLoading(true);
        let query = supabase.from('products').select('*, categories(name, slug)');
        
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data } = await query;
        if (data) setProducts(data);
        setLoading(false);
      };
      fetchProducts();
    }
  }, [initialProducts, categoryId]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="aspect-square w-full rounded-3xl bg-gray-100" />
            <div className="h-4 w-2/3 rounded-full bg-gray-100" />
            <div className="h-4 w-1/3 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-2xl font-black text-slate-300 italic uppercase tracking-widest">No products found</p>
        <p className="mt-2 text-sm font-bold text-slate-400">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
      {filteredProducts.map((product) => (
        <ProductCard 
          key={product.id} 
          id={product.id}
          name={product.name}
          price={product.price}
          image={product.image_url}
          category={product.categories?.name || "Uncategorized"}
        />
      ))}
    </div>
  );
}
