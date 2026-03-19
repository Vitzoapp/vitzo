"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Package, Users, Plus, Edit, Trash2, X } from "lucide-react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

const ADMIN_EMAIL = "vitzo.hq@gmail.com";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: string;
  image?: string;
}

export default function AdminPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, products, team
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Local state for products (simulating DB)
  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "Organic Bananas", price: 40, category: "Produce", stock: "45 kgs" },
    { id: "2", name: "Fresh Milk 1L", price: 60, category: "Dairy", stock: "120 units" },
    { id: "3", name: "Potato Chips", price: 20, category: "Snacks", stock: "84 pkgs" }
  ]);

  // Local state for team members
  const [team, setTeam] = useState<{email: string, role: string}[]>([
    { email: "vitzo.hq@gmail.com", role: "Owner" }
  ]);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email !== ADMIN_EMAIL) {
        setLoading(false);
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAddEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Product = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      category: formData.get("category") as string,
      stock: formData.get("stock") as string,
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? productData : p));
    } else {
      setProducts([...products, productData]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      setTeam([...team, { email: inviteEmail, role: "Member" }]);
      setInviteEmail("");
      alert(`Invitation sent to ${inviteEmail}`);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-[var(--color-primary-gold)]">SECURE VERIFICATION...</div>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
        <h1 className="text-4xl font-black text-red-500 mb-4 uppercase italic tracking-tighter">Access Denied</h1>
        <p className="text-slate-400 font-bold mb-8">Unauthorized access to Vitzo Admin Core.</p>
        <Link href="/" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-sm italic shadow-lg">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-8 flex flex-col sticky top-0 h-screen">
          <h1 className="text-2xl font-black italic uppercase mb-12 flex items-center gap-2">
            <span className="text-[var(--color-primary-gold)]">V</span>-Admin
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full NOT-italic tracking-widest font-bold">CORE</span>
          </h1>
          
          <nav className="flex-1 space-y-2">
             <SidebarItem 
               icon={<LayoutDashboard />} 
               label="Dashboard" 
               active={activeTab === "dashboard"} 
               onClick={() => setActiveTab("dashboard")} 
             />
             <SidebarItem 
               icon={<Package />} 
               label="Inventory" 
               active={activeTab === "products"} 
               onClick={() => setActiveTab("products")} 
             />
             <SidebarItem 
               icon={<Users />} 
               label="Team Network" 
               active={activeTab === "team"} 
               onClick={() => setActiveTab("team")} 
             />
          </nav>

          <div className="mt-auto border-t border-white/10 pt-8">
             <p className="text-[10px] font-black uppercase text-slate-500 mb-4">Instance</p>
             <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-8 bg-[var(--color-primary-gold)] rounded-full flex items-center justify-center text-slate-900 font-black italic text-xs">A</div>
                <div className="overflow-hidden">
                   <p className="text-xs font-black truncate">{user.email}</p>
                   <p className="text-[8px] font-bold text-[var(--color-secondary-green)] uppercase">System Active</p>
                </div>
             </div>
             <button className="flex items-center gap-3 w-full p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black uppercase text-xs italic transition-all" onClick={() => supabase.auth.signOut()}>
                Terminate Session
             </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        {activeTab === "dashboard" && (
           <DashboardContent productsCount={products.length} teamCount={team.length} />
        )}

        {activeTab === "products" && (
           <>
            <header className="flex justify-between items-center mb-12">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Inventory Flux</h2>
                  <p className="text-slate-400 font-bold">Manage your real-time grocery synchronization.</p>
               </div>
               <button 
                 onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                 className="bg-[var(--color-primary-gold)] text-slate-900 px-8 py-4 rounded-3xl font-black uppercase text-sm italic shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
               >
                  <Plus className="h-5 w-5" />
                  Register Product
               </button>
            </header>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-50">
                     <tr>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-widest">Identification</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-widest">Classification</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-widest">Stock Level</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-widest">Value (INR)</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Operations</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {products.map((p) => (
                       <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-8">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-[var(--color-primary-gold)] font-black italic">V</div>
                                <span className="font-black text-slate-900 text-lg uppercase italic tracking-tighter">{p.name}</span>
                             </div>
                          </td>
                          <td className="p-8">
                             <span className="px-4 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black uppercase text-slate-400">{p.category}</span>
                          </td>
                          <td className="p-8">
                             <span className={`font-black uppercase italic ${p.stock.includes('0') ? 'text-red-500' : 'text-[var(--color-secondary-green)]'}`}>{p.stock}</span>
                          </td>
                          <td className="p-8 font-black text-slate-900">₹{p.price.toLocaleString()}</td>
                          <td className="p-8 text-right space-x-2">
                             <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                             <button onClick={() => handleDeleteProduct(p.id)} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
           </>
        )}

        {activeTab === "team" && (
           <div className="max-w-4xl">
              <header className="mb-12">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Team Network</h2>
                 <p className="text-slate-400 font-bold">Manage administrative nodes and access protocols.</p>
              </header>

              <div className="bg-slate-900 rounded-[40px] p-12 text-white mb-12 shadow-2xl">
                 <h3 className="text-2xl font-black italic uppercase text-[var(--color-primary-gold)] mb-8">Deploy Invitation</h3>
                 <form onSubmit={handleInvite} className="flex gap-4">
                    <input 
                      type="email" 
                      placeholder="Enter collaborator email..." 
                      className="flex-1 bg-white/10 border border-white/20 rounded-3xl px-8 py-4 outline-none focus:bg-white/20 transition-all font-bold"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="bg-[var(--color-primary-gold)] text-slate-900 px-10 py-4 rounded-3xl font-black uppercase italic shadow-lg hover:scale-105 active:scale-95 transition-all">
                       Send Pulse
                    </button>
                 </form>
              </div>

              <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-gray-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-50">
                       <tr>
                          <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-widest">Administrator Node</th>
                          <th className="p-8 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Clearance Level</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {team.map((m) => (
                         <tr key={m.email} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-8 font-black text-slate-900 italic uppercase">{m.email}</td>
                            <td className="p-8 text-right">
                               <span className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-extrabold uppercase italic">{m.role}</span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </main>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-12 relative">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><X className="h-6 w-6" /></button>
             <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter mb-8">
                {editingProduct ? 'Update Product' : 'Register Product'}
             </h2>
             <form onSubmit={handleAddEditProduct} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Product Nomenclature</label>
                   <input 
                     name="name" 
                     className="w-full px-8 py-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:bg-white focus:border-[var(--color-primary-gold)] transition-all" 
                     defaultValue={editingProduct?.name} 
                     required 
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Price (INR)</label>
                      <input 
                        name="price" 
                        type="number" 
                        className="w-full px-8 py-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:bg-white focus:border-[var(--color-primary-gold)] transition-all" 
                        defaultValue={editingProduct?.price} 
                        required 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Classification</label>
                      <select 
                        name="category" 
                        className="w-full px-8 py-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:bg-white focus:border-[var(--color-primary-gold)] transition-all appearance-none" 
                        defaultValue={editingProduct?.category}
                      >
                         <option>Produce</option>
                         <option>Dairy</option>
                         <option>Snacks</option>
                         <option>Bakery</option>
                         <option>Beverages</option>
                      </select>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Stock Level Detail</label>
                   <input 
                     name="stock" 
                     className="w-full px-8 py-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold outline-none focus:bg-white focus:border-[var(--color-primary-gold)] transition-all" 
                     placeholder="e.g., 50 units, 20 kgs" 
                     defaultValue={editingProduct?.stock} 
                     required 
                   />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase italic tracking-widest mt-8 hover:scale-105 transition-transform shadow-2xl">
                   Synchronize Data
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-5 rounded-[20px] font-black uppercase text-[11px] italic transition-all group ${active ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
    >
      <div className={`${active ? 'text-[var(--color-primary-gold)]' : 'text-slate-500 group-hover:text-white'} transition-colors`}>
         {icon}
      </div>
      {label}
    </button>
  );
}

function DashboardContent({ productsCount, teamCount }: { productsCount: number, teamCount: number }) {
  return (
    <>
      <header className="mb-12">
         <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Control Node</h2>
         <p className="text-slate-400 font-bold">System metrics and operational status overview.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
         <StatCard label="Net Operations" value="₹12.45L" sub="Monthly Velocity" trend="+14%" />
         <StatCard label="Inventory Nodes" value={productsCount.toString()} sub="Unique Protocols" />
         <StatCard label="Team Capacity" value={teamCount.toString()} sub="Authenticated Units" />
      </div>
      <div className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-[var(--color-primary-gold)]/5 skew-x-12 translate-x-1/4" />
         <div className="relative z-10">
            <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Instance Health: <span className="text-[var(--color-secondary-green)]">OPTIMAL</span></h3>
            <p className="text-slate-400 font-bold max-w-lg">All systems are operational. Real-time grocery synchronization is active across all regional clusters.</p>
         </div>
      </div>
    </>
  );
}

function StatCard({ label, value, sub, trend }: { label: string, value: string, sub: string, trend?: string }) {
  return (
    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
       <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
          {trend && <span className="text-[10px] font-black text-[var(--color-secondary-green)] bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
       </div>
       <p className="text-5xl font-black text-slate-900 italic tracking-tighter">{value}</p>
       <p className="text-xs font-bold text-slate-400 mt-4 uppercase italic">{sub}</p>
    </div>
  );
}
