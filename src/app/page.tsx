import Link from "next/link";
import { ShoppingBag, Zap, ShieldCheck, MapPin } from "lucide-react";
import CategorySection from "@/components/CategorySection";
import CountdownTimer from "@/components/CountdownTimer";

const MOCK_CATEGORIES = [
  {
    title: "Fresh Fruits & Vegetables",
    slug: "fruits-veg",
    products: [
      { id: "f1", name: "Organic Bananas", price: 40, image: "/product-1.png", category: "Produce", rating: 4.8 },
      { id: "f2", name: "Red Apples", price: 120, image: "/product-1.png", category: "Produce", rating: 4.9 },
      { id: "f3", name: "Fresh Spinach", price: 20, image: "/product-1.png", category: "Produce", rating: 4.7 },
      { id: "f4", name: "Carrots (Local)", price: 30, image: "/product-1.png", category: "Produce", rating: 4.5 },
    ]
  },
  {
    title: "Dairy, Bread & Eggs",
    slug: "dairy-bread",
    products: [
      { id: "d1", name: "Fresh Milk (1L)", price: 60, image: "/product-1.png", category: "Dairy", rating: 4.9 },
      { id: "d2", name: "Brown Bread", price: 45, image: "/product-1.png", category: "Bakery", rating: 4.8 },
      { id: "d3", name: "Greek Yogurt", price: 80, image: "/product-1.png", category: "Dairy", rating: 4.7 },
      { id: "d4", name: "Large Eggs (6pk)", price: 55, image: "/product-1.png", category: "Produce", rating: 4.6 },
    ]
  }
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Dynamic Banner Section */}
      <section className="bg-[var(--color-primary-gold)] pt-8 pb-20 relative overflow-hidden">
        {/* Abstract Background pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 skew-x-12 translate-x-1/2" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex flex-col space-y-8 max-w-2xl">
              <CountdownTimer />
              
              <h1 className="font-outfit text-6xl font-black leading-[0.9] sm:text-8xl text-slate-900 tracking-tighter">
                ORDER BY <br />
                <span className="text-white drop-shadow-2xl">11:00 AM</span>
              </h1>
              
              <p className="text-2xl font-black text-slate-900/80 italic tracking-tight">
                For delivery today at <span className="text-white underline decoration-4 decoration-white/50 underline-offset-8">1:00 PM</span>
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center rounded-3xl bg-slate-900 px-10 py-5 text-lg font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95 hover:bg-slate-800"
                >
                  Start Shopping
                </Link>
              </div>
            </div>
            
            {/* Visual element (Grocery Bag) */}
            <div className="relative group">
               <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse group-hover:bg-white/40 transition-all" />
               <div className="relative flex h-80 w-80 md:h-[450px] md:w-[450px] items-center justify-center rounded-[60px] border-8 border-white/30 bg-white/10 backdrop-blur-md shadow-2xl transform rotate-3 transition-transform hover:rotate-0">
                 <div className="absolute -top-8 -right-8 h-24 w-24 bg-[var(--color-secondary-green)] rounded-full border-4 border-white flex items-center justify-center shadow-xl rotate-12">
                    <span className="text-white font-black text-xl italic leading-none text-center">FRESH<br/>PICK</span>
                 </div>
                 <ShoppingBag className="h-48 w-48 text-white drop-shadow-2xl" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <div className="mx-auto max-w-7xl px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
             <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
               <Zap className="h-8 w-8 text-orange-500" />
             </div>
             <div>
               <h3 className="font-black text-slate-900 text-lg">Community Prices</h3>
               <p className="text-sm font-bold text-slate-400">Save up to 30% by batching orders.</p>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
             <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
               <ShieldCheck className="h-8 w-8 text-green-500" />
             </div>
             <div>
               <h3 className="font-black text-slate-900 text-lg">Eco-Friendly</h3>
               <p className="text-sm font-bold text-slate-400">1 Truck. 1 Trip. Zero Emissions.</p>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
             <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
               <MapPin className="h-8 w-8 text-blue-500" />
             </div>
             <div>
               <h3 className="font-black text-slate-900 text-lg">Farm Fresh</h3>
               <p className="text-sm font-bold text-slate-400">Direct from farm to your door.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-20">
        {MOCK_CATEGORIES.map((cat) => (
          <CategorySection 
            key={cat.slug}
            title={cat.title}
            category={cat.slug}
            products={cat.products}
          />
        ))}
      </main>
    </div>
  );
}
