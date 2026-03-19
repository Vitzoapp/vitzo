"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Package, Users, Settings, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = "vitzo.hq@gmail.com";

export default function AdminPortal() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email !== ADMIN_EMAIL) {
        // Not authorized
        setLoading(false);
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <div className="p-20 text-center font-black animate-pulse">VERIFYING AUTH...</div>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-red-500 mb-4 uppercase italic">Access Denied</h1>
        <p className="text-slate-400 font-bold mb-8">Only authorized administrators can access this portal.</p>
        <Link href="/" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-sm">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-8 flex flex-col">
          <h1 className="text-2xl font-black italic uppercase mb-12">
            <span className="text-[var(--color-primary-gold)]">V</span>-Admin
          </h1>
          
          <nav className="flex-1 space-y-4">
             <button className="flex items-center gap-3 w-full p-4 bg-white/10 rounded-2xl text-[var(--color-primary-gold)] font-black uppercase text-xs italic">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
             </button>
             <button className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-2xl text-slate-400 font-black uppercase text-xs italic transition-colors">
                <Package className="h-4 w-4" />
                Products
             </button>
             <button className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-2xl text-slate-400 font-black uppercase text-xs italic transition-colors">
                <Users className="h-4 w-4" />
                Team members
             </button>
          </nav>

          <button className="flex items-center gap-3 w-full p-4 text-red-400 font-black uppercase text-xs italic mt-auto" onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
         <header className="flex justify-between items-center mb-12">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Inventory Overview</h2>
               <p className="text-slate-400 font-bold">Manage your grocery catalog and team.</p>
            </div>
            <button className="bg-[var(--color-primary-gold)] text-slate-900 px-6 py-3 rounded-2xl font-black uppercase text-sm italic shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
               <Plus className="h-4 w-4" />
               Add Product
            </button>
         </header>

         {/* Stats */}
         <div className="grid grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Sales</span>
               <p className="text-4xl font-black text-slate-900 mt-2 italic tracking-tighter">₹12,45,000</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Orders</span>
               <p className="text-4xl font-black text-slate-900 mt-2 italic tracking-tighter">48</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Team Size</span>
               <p className="text-4xl font-black text-slate-900 mt-2 italic tracking-tighter">12</p>
            </div>
         </div>

         {/* Product List Table Mock */}
         <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50 border-b border-gray-50">
                  <tr>
                     <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Product</th>
                     <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                     <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Stock</th>
                     <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {[
                    { name: 'Organic Bananas', cat: 'Produce', stock: '45 kgs' },
                    { name: 'Fresh Milk 1L', cat: 'Dairy', stock: '120 units' },
                    { name: 'Potato Chips', cat: 'Snacks', stock: '84 pkgs' }
                  ].map((p) => (
                    <tr key={p.name}>
                       <td className="p-6 font-black text-slate-900">{p.name}</td>
                       <td className="p-6 text-sm font-bold text-slate-400">{p.cat}</td>
                       <td className="p-6 text-sm font-bold text-slate-900">{p.stock}</td>
                       <td className="p-6 text-right space-x-2">
                          <button className="p-2 bg-gray-50 rounded-xl hover:bg-[var(--color-primary-gold)] hover:text-white transition-colors"><Edit className="h-4 w-4" /></button>
                          <button className="p-2 bg-gray-50 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="h-4 w-4" /></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </main>
    </div>
  );
}
