"use client";

import React from "react";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Package, Users, Plus, Edit, Trash2, X } from "lucide-react";
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

export default function AdminPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [team, setTeam] = useState<{email: string, role: string}[]>([
    { email: "vitzo.hq@gmail.com", role: "Owner" }
  ]);
  const [inviteEmail, setInviteEmail] = useState("");

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
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*')
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      setTeam([...team, { email: inviteEmail, role: "Member" }]);
      setInviteEmail("");
      alert(`Invitation sent to ${inviteEmail}`);
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
          <h1 className="text-2xl font-black italic uppercase mb-12 flex items-center gap-2">
            <span className="text-[var(--color-secondary-green)]">V</span>-Admin
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
                <div className="h-8 w-8 bg-[var(--color-secondary-green)] rounded-full flex items-center justify-center text-slate-900 font-black italic text-xs">A</div>
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
                 className="bg-[var(--color-secondary-green)] text-white px-8 py-4 rounded-3xl font-black uppercase text-sm italic shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
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
                                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-[var(--color-secondary-green)] font-black italic overflow-hidden">
                                  {p.image_url ? (
                                    <div className="relative h-full w-full">
                                      <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                                    </div>
                                  ) : "V"}
                                </div>
                                <span className="font-black text-slate-900 text-lg uppercase italic tracking-tighter">{p.name}</span>
                             </div>
                          </td>
                          <td className="p-8">
                             <span className="px-4 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black uppercase text-slate-400">{p.categories?.name || 'Uncategorized'}</span>
                          </td>
                          <td className="p-8">
                             <span className={`font-black uppercase italic ${p.stock <= 0 ? 'text-red-500' : 'text-[var(--color-secondary-green)]'}`}>{p.stock} units</span>
                          </td>
                          <td className="p-8 font-black text-slate-900">₹{p.price.toLocaleString()}</td>
                          <td className="p-8 text-right space-x-2">
                             <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-[var(--color-secondary-green)] hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
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
                 <h3 className="text-2xl font-black italic uppercase text-[var(--color-secondary-green)] mb-8">Deploy Invitation</h3>
                 <form onSubmit={handleInvite} className="flex gap-4">
                    <input 
                      type="email" 
                      placeholder="Enter collaborator email..." 
                      className="flex-1 bg-white/10 border border-white/20 rounded-3xl px-8 py-4 outline-none focus:bg-white/20 transition-all font-bold"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="bg-[var(--color-secondary-green)] text-white px-10 py-4 rounded-3xl font-black uppercase italic shadow-lg hover:scale-105 active:scale-95 transition-all">
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
                   <label className="text-[11px] font-black uppercase text-slate-900 tracking-widest ml-4">Product Nomenclature</label>
                   <input 
                     name="name" 
                     className="w-full px-8 py-4 bg-slate-100 border-2 border-slate-200 rounded-3xl font-bold text-slate-900 outline-none focus:bg-white focus:border-[var(--color-secondary-green)] transition-all" 
                     defaultValue={editingProduct?.name} 
                     required 
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-900 tracking-widest ml-4">Price (INR)</label>
                      <input 
                        name="price" 
                        type="number" 
                        className="w-full px-8 py-4 bg-slate-100 border-2 border-slate-200 rounded-3xl font-bold text-slate-900 outline-none focus:bg-white focus:border-[var(--color-secondary-green)] transition-all" 
                        defaultValue={editingProduct?.price} 
                        required 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-900 tracking-widest ml-4">Classification</label>
                      <select 
                        name="category_id" 
                        className="w-full px-8 py-4 bg-slate-100 border-2 border-slate-200 rounded-3xl font-bold text-slate-900 outline-none focus:bg-white focus:border-[var(--color-secondary-green)] transition-all appearance-none" 
                        defaultValue={editingProduct?.category_id}
                        required
                      >
                         <option value="">Select Category</option>
                         {categories.map(cat => (
                           <option key={cat.id} value={cat.id}>{cat.name}</option>
                         ))}
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-900 tracking-widest ml-4">Stock Level</label>
                    <input 
                      name="stock" 
                      type="number"
                      className="w-full px-8 py-4 bg-slate-100 border-2 border-slate-200 rounded-3xl font-bold text-slate-900 outline-none focus:bg-white focus:border-[var(--color-secondary-green)] transition-all" 
                      placeholder="e.g., 50" 
                      defaultValue={editingProduct?.stock} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-700 tracking-widest ml-4">Product Visual</label>
                    <div className="flex items-center gap-4">
                       <div className="h-20 w-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                          {imagePreview || editingProduct?.image_url ? (
                            <Image src={imagePreview || editingProduct?.image_url || ""} alt="Preview" fill className="object-cover" />
                          ) : (
                            <Plus className="h-6 w-6 text-slate-300" />
                          )}
                          {uploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                               <div className="h-5 w-5 border-2 border-[var(--color-primary-green)] border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                       </div>
                       <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden" 
                            id="image-upload"
                          />
                          <label 
                            htmlFor="image-upload"
                            className="inline-block px-6 py-3 bg-[var(--color-primary-green)] text-white text-[10px] font-black uppercase italic rounded-xl cursor-pointer hover:scale-105 transition-transform"
                          >
                            {uploading ? 'Processing...' : 'Upload New Asset'}
                          </label>
                          <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">PNG, JPG up to 5MB</p>
                       </div>
                    </div>
                    <input 
                      type="hidden"
                      name="image_url" 
                      defaultValue={editingProduct?.image_url} 
                    />
                  </div>
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
      <div className={`${active ? 'text-[var(--color-secondary-green)]' : 'text-slate-500 group-hover:text-white'} transition-colors`}>
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
