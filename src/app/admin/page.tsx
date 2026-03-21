"use client";

import React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Truck,
  Star
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";

const ADMIN_EMAIL = "vitzo.hq@gmail.com";

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  stock: number;
  image_url: string;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  full_name: string;
  phone_number: string;
  status: string;
  area: string;
  salary: number;
  total_orders: number;
  average_rating: number;
  is_active: boolean;
}

export default function AdminPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [_team, _setTeam] = useState<{email: string, role: string}[]>([
    { email: "vitzo.hq@gmail.com", role: "Owner" }
  ]);
  const [_inviteEmail, _setInviteEmail] = useState("");

  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email !== ADMIN_EMAIL) {
        setLoading(false);
      } else {
        setUser(session.user);
        fetchData();
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [productsRes, categoriesRes, agentsRes] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('agents').select('*').order('created_at', { ascending: false })
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (agentsRes.data) setAgents(agentsRes.data);
    setLoading(false);
  };

  const updateAgentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('agents').update({ status }).eq('id', id);
    if (!error) fetchData();
  };

  const setAgentSalary = async (id: string, salary: number) => {
    const { error } = await supabase.from('agents').update({ salary }).eq('id', id);
    if (!error) fetchData();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    setImagePreview(publicUrl);
    setUploading(false);
  };

  const handleAddEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      category_id: formData.get("category_id") as string,
      stock: Number(formData.get("stock")),
      image_url: imagePreview || (formData.get("image_url") as string),
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
      
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData]);
      
      if (error) alert(error.message);
    }

    fetchData();
    setIsModalOpen(false);
    setEditingProduct(null);
    setImagePreview(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) alert(error.message);
      else fetchData();
    }
  };

  if (loading && !user) return <div className="p-20 text-center font-black animate-pulse text-[var(--color-primary-green)]">SECURE VERIFICATION...</div>;

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
          <Link href="/" className="text-2xl font-black italic uppercase mb-12 flex items-center gap-2">
            <span className="text-[var(--color-secondary-green)]">V</span>-Admin
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full NOT-italic tracking-widest font-bold">CORE</span>
          </Link>
          
          <nav className="flex-1 space-y-2">
             <SidebarItem 
               icon={<LayoutDashboard />} 
               label="Status View" 
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
               icon={<Truck />} 
               label="Delivery Agent Control" 
               active={activeTab === "agents"} 
               onClick={() => setActiveTab("agents")} 
             />
             <SidebarItem 
               icon={<Users />} 
               label="Administrative" 
               active={activeTab === "team"} 
               onClick={() => setActiveTab("team")} 
             />
          </nav>

          <div className="mt-auto border-t border-white/10 pt-8">
             <button className="flex items-center gap-3 w-full p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black uppercase text-xs italic transition-all" onClick={() => supabase.auth.signOut()}>
                Terminate Session
             </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        {activeTab === "dashboard" && (
           <DashboardContent productsCount={products.length} agentsCount={agents.length} />
        )}

        {activeTab === "products" && (
           <>
            <header className="flex justify-between items-center mb-12">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Inventory Flux</h2>
                  <p className="text-slate-400 font-bold">Manage real-time grocery synchronization.</p>
               </div>
               <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black uppercase text-sm italic shadow-xl hover:scale-105 active:scale-95 transition-all">Register Product</button>
            </header>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                     <tr>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Identification</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Classification</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Stock</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-right">Operations</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {products.map((p) => (
                       <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-8">
                             <div className="flex items-center gap-4">
                                <span className="font-black text-slate-900 uppercase italic">{p.name}</span>
                             </div>
                          </td>
                          <td className="p-8">
                             <span className="px-3 py-1 bg-white border rounded-full text-[10px] font-black uppercase text-slate-400">{p.categories?.name}</span>
                          </td>
                          <td className="p-8 font-black">{p.stock}</td>
                          <td className="p-8 text-right space-x-2">
                             <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-3 bg-white border rounded-xl hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                             <button onClick={() => handleDeleteProduct(p.id)} className="p-3 bg-white border rounded-xl hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
           </>
        )}

        {activeTab === "agents" && (
           <>
            <header className="mb-12">
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Fleet Control</h2>
               <p className="text-slate-400 font-bold">Monitor and authorize delivery agent activity.</p>
            </header>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                     <tr>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Agent Details</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Zone / Area</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Status</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Performance</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-right">Clearance</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {agents.map((a) => (
                       <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-8">
                             <p className="font-black text-slate-900 uppercase italic">{a.full_name}</p>
                             <p className="text-xs font-bold text-slate-400">{a.phone_number}</p>
                          </td>
                          <td className="p-8">
                             <span className="font-black text-xs uppercase tracking-widest">{a.area}</span>
                          </td>
                          <td className="p-8">
                             <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                a.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                             }`}>
                                <div className={`h-1.5 w-1.5 rounded-full ${a.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                {a.status}
                             </div>
                          </td>
                          <td className="p-8">
                             <div className="flex items-center gap-4">
                                <div>
                                   <p className="text-[10px] font-black uppercase text-slate-400">Rating</p>
                                   <p className="font-black text-slate-900 flex items-center gap-1">{a.average_rating || '5.0'} <Star className="h-3 w-3 fill-amber-400 text-amber-400" /></p>
                                </div>
                                <div className="pl-4 border-l">
                                   <p className="text-[10px] font-black uppercase text-slate-400">Payout</p>
                                   <p className="font-black text-slate-900">₹{a.salary}</p>
                                </div>
                             </div>
                          </td>
                          <td className="p-8 text-right space-x-2">
                             {a.status === 'pending' && (
                               <button onClick={() => updateAgentStatus(a.id, 'approved')} className="p-3 bg-green-500 text-white rounded-xl shadow-lg hover:scale-105 transition-all"><CheckCircle2 className="h-4 w-4" /></button>
                             )}
                             {a.status !== 'terminated' && (
                               <button onClick={() => updateAgentStatus(a.id, 'terminated')} className="p-3 bg-red-500 text-white rounded-xl shadow-lg hover:scale-105 transition-all"><XCircle className="h-4 w-4" /></button>
                             )}
                             <button 
                               onClick={() => {
                                 const s = prompt("Set Agent Salary/Incentive (INR):", a.salary.toString());
                                 if (s) setAgentSalary(a.id, parseFloat(s));
                               }} 
                               className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-105 transition-all"
                             >
                                <DollarSign className="h-4 w-4" />
                             </button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
           </>
        )}

        {/* Modal for adding/editing products */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[40px] w-full max-w-2xl p-10 relative overflow-hidden">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-all"><X className="h-6 w-6 text-slate-400" /></button>
               <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-8">{editingProduct ? "Modify Product" : "New Registration"}</h3>
               
               <form onSubmit={handleAddEditProduct} className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product Name</label>
                       <input name="name" required defaultValue={editingProduct?.name} className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price (INR)</label>
                       <input name="price" type="number" step="0.01" required defaultValue={editingProduct?.price} className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                       <select name="category_id" required defaultValue={editingProduct?.category_id} className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Units</label>
                       <input name="stock" type="number" required defaultValue={editingProduct?.stock} className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product Image</label>
                    <div className="flex gap-4">
                       <div className="h-32 w-32 border-2 border-dashed border-gray-200 rounded-3xl overflow-hidden relative group">
                          {imagePreview || editingProduct?.image_url ? (
                            <Image src={imagePreview || editingProduct!.image_url} alt="Preview" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Plus className="h-8 w-8" /></div>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                       <div className="flex-1 flex flex-col justify-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">Drop high-res asset or click to upload. <br/> Supported: JPG, PNG, WEBP.</p>
                          {uploading && <div className="mt-2 text-[10px] font-black text-[var(--color-primary-green)] animate-pulse uppercase">Syncing to Cloud...</div>}
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest italic shadow-xl hover:bg-[var(--color-primary-green)] transition-all">Execute Registration</button>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-5 rounded-[20px] font-black uppercase text-[11px] italic transition-all group ${active ? 'bg-white text-slate-900 shadow-xl border border-gray-100' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
    >
      <div className={`${active ? 'text-slate-900' : 'text-slate-500 group-hover:text-white'} transition-colors`}>{icon}</div>
      {label}
    </button>
  );
}

function DashboardContent({ productsCount, agentsCount }: { productsCount: number, agentsCount: number }) {
  return (
    <>
      <header className="mb-12">
         <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Control Node</h2>
         <p className="text-slate-400 font-bold">System metrics and operational status overview.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatCard label="Product Inventory" value={productsCount.toString()} sub="Unique Assets" />
         <StatCard label="Active Fleet" value={agentsCount.toString()} sub="Delivery Units" />
         <StatCard label="Service Score" value="4.9" sub="Average Rating" />
      </div>
    </>
  );
}

function StatCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
       <p className="text-5xl font-black text-slate-900 italic tracking-tighter mt-2">{value}</p>
       <p className="text-xs font-bold text-slate-400 mt-4 uppercase italic">{sub}</p>
    </div>
  );
}
