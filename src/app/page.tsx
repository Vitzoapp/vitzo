// src/app/page.tsx
import Link from "next/link";
import { ShoppingBag, Zap, ShieldCheck, MapPin } from "lucide-react";
import CategorySection from "@/components/CategorySection";
import CountdownTimer from "@/components/CountdownTimer";
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
  categories?: { name: string };
}

function getDeliverySchedule() {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(11, 0, 0, 0);
  
  const isAfterCutoff = now > cutoff;
  
  return {
    deliveryDay: isAfterCutoff ? "Tomorrow" : "Today",
    cutoffTime: "11:00 AM",
    deliveryWindow: "1:00 PM",
  };
}

export default async function Home() {
  const supabase = await createClient();
  
  const [catRes, prodRes] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('products').select('*, categories(name, slug)').limit(50)
  ]);

  const categories = (catRes.data || []) as Category[];
  const products = (prodRes.data || []) as Product[];
  const schedule = getDeliverySchedule();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <section className="bg-[var(--color-primary-green)] pt-12 pb-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            <div className="flex flex-col space-y-6 max-w-2xl text-white">
              <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 w-fit backdrop-blur-sm">
                <CountdownTimer />
                <span className="text-sm font-medium tracking-wide">
                  Order by {schedule.cutoffTime} for {schedule.deliveryDay} delivery
                </span>
              </div>
              
              <h1 className="font-outfit text-5xl font-bold tracking-tight sm:text-7xl leading-tight">
                Fresh Groceries,<br />
                Delivered Smart.
              </h1>
              
              <p className="text-lg text-white/90 max-w-lg leading-relaxed">
                Experience high-quality produce and daily essentials delivered at {schedule.deliveryWindow}. Shop now and benefit from our eco-friendly batch routing.
              </p>

              <div className="pt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-slate-800 shadow-sm"
                >
                  Shop All Categories
                </Link>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
               <div className="flex h-96 w-96 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md shadow-lg border border-white/20">
                 <ShoppingBag className="h-32 w-32 text-white/90" strokeWidth={1.5} />
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-start gap-4">
             <div className="bg-orange-50 p-3 rounded-xl flex-shrink-0">
               <Zap className="h-6 w-6 text-orange-600" />
             </div>
             <div>
               <h3 className="font-semibold text-slate-900">Smart Batching</h3>
               <p className="text-sm text-slate-500 mt-1">Unlock up to 30% savings by joining community delivery routes.</p>
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-start gap-4">
             <div className="bg-green-50 p-3 rounded-xl flex-shrink-0">
               <ShieldCheck className="h-6 w-6 text-green-600" />
             </div>
             <div>
               <h3 className="font-semibold text-slate-900">Sustainable Operations</h3>
               <p className="text-sm text-slate-500 mt-1">Optimized logistics mean fewer trucks on the road and zero wasted trips.</p>
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-start gap-4">
             <div className="bg-blue-50 p-3 rounded-xl flex-shrink-0">
               <MapPin className="h-6 w-6 text-blue-600" />
             </div>
             <div>
               <h3 className="font-semibold text-slate-900">Farm to Door</h3>
               <p className="text-sm text-slate-500 mt-1">Source tracking ensures your produce arrives fresh and fully inspected.</p>
             </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
        {categories.map((cat) => {
          const catProducts = products.filter(p => p.category_id === cat.id);
          if (catProducts.length === 0) return null;
          
          return (
            <CategorySection 
              key={cat.id}
              title={cat.name}
              category={cat.slug}
              products={catProducts.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.image_url,
                category: cat.name
              }))}
            />
          );
        })}
      </main>
    </div>
  );
}
