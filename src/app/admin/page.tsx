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

// Admin access is now controlled by the 'role' column in the profiles table

interface Product {
  id: string;
  name: string;
  real_price: number;
  commission: number;
  final_price: number;
  unit_type: "weight" | "volume" | "discrete";
  allowed_units: string[] | null;
  category_id: string | null;
  image_url: string | null;
  categories?: { name: string } | { name: string }[] | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Agent {
  id: string;
  full_name: string;
  phone_number: string;
  status: string | null;
  working_area: string | null;
  salary: number | null;
  total_orders: number | null;
  average_rating: number | null;
  is_active: boolean | null;
}

interface AdminInvite {
  id: string;
  invited_email: string;
  invite_token: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface ActiveOrder {
  agent_id: string | null;
  assigned_agent_id: string | null;
  delivery_batch: string | null;
  delivery_batch_date: string | null;
  id: string;
  created_at: string | null;
  total_amount: number;
  delivery_status: string | null;
  shipping_area: string | null;
  shipping_house_no: string | null;
  shipping_street: string | null;
  mobile_number: string | null;
  agents: { full_name: string } | null;
  order_items: { id: string; quantity: number }[];
}

type UnitType = "weight" | "volume" | "discrete";
type UnitOption = "g" | "kg" | "ml" | "l" | "pack" | "piece";

export default function AdminPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [draftRealPrice, setDraftRealPrice] = useState(0);
  const [draftCommission, setDraftCommission] = useState(0);
  const [draftUnitType, setDraftUnitType] = useState<UnitType>("weight");
  const [draftAllowedUnits, setDraftAllowedUnits] = useState<UnitOption[]>(["g", "kg"]);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>({});
  const [categoryNameDraft, setCategoryNameDraft] = useState("");
  const [adminInvites, setAdminInvites] = useState<AdminInvite[]>([]);
  const [inviteEmailDraft, setInviteEmailDraft] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        setUser(session.user);
        fetchData();
        realtimeChannel = supabase
          .channel("admin-live-orders")
          .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
            fetchData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, () => {
            fetchData();
          })
          .subscribe();
      }
      setLoading(false);
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    setDraftRealPrice(editingProduct?.real_price ?? 0);
    setDraftCommission(editingProduct?.commission ?? 0);
    setDraftUnitType(editingProduct?.unit_type ?? "weight");
    setDraftAllowedUnits(getNormalizedAllowedUnits(editingProduct?.allowed_units, editingProduct?.unit_type ?? "weight"));
  }, [editingProduct, isModalOpen]);

  const fetchData = async () => {
    setLoading(true);
    setAdminError(null);
    const [productsRes, categoriesRes, agentsRes, activeOrdersRes, profitRes, adminInvitesRes] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('agents').select('*').order('created_at', { ascending: false }),
      supabase
        .from("orders")
        .select(`
          agent_id,
          assigned_agent_id,
          delivery_batch,
          delivery_batch_date,
          id,
          created_at,
          total_amount,
          delivery_status,
          shipping_area,
          shipping_house_no,
          shipping_street,
          mobile_number,
          agents (full_name),
          order_items (id, quantity)
        `)
        .neq("delivery_status", "delivered")
        .neq("delivery_status", "cancelled")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false }),
      supabase.rpc("get_total_delivered_profit"),
      supabase
        .from("admin_invites")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (productsRes.error || categoriesRes.error || agentsRes.error || activeOrdersRes.error || profitRes.error || adminInvitesRes.error) {
      setAdminError(
        productsRes.error?.message ||
          categoriesRes.error?.message ||
          agentsRes.error?.message ||
          activeOrdersRes.error?.message ||
          adminInvitesRes.error?.message ||
          profitRes.error?.message ||
          "Failed to load admin data.",
      );
    }

    if (productsRes.data) setProducts(productsRes.data.map(mapProductRecord));
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (agentsRes.data) setAgents(agentsRes.data);
    if (activeOrdersRes.data) setActiveOrders(activeOrdersRes.data);
    if (typeof profitRes.data === "number") setTotalProfit(profitRes.data);
    if (adminInvitesRes.data) setAdminInvites(adminInvitesRes.data);
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

  const assignOrderToAgent = async (orderId: string) => {
    const agentId = assignmentDrafts[orderId];

    if (!agentId) {
      setAdminError("Select an agent before assigning the order.");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        agent_id: agentId,
        assigned_agent_id: agentId,
        delivery_status: "assigned",
      })
      .eq("id", orderId);

    if (error) {
      setAdminError(error.message);
      return;
    }

    setAssignmentDrafts((prev) => ({ ...prev, [orderId]: "" }));
    fetchData();
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
      real_price: Number(formData.get("real_price")),
      commission: Number(formData.get("commission")),
      unit_type: draftUnitType,
      allowed_units: draftAllowedUnits,
      category_id: formData.get("category_id") as string,
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

  const handleCreateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = categoryNameDraft.trim();

    if (!trimmedName) {
      setAdminError("Category name is required.");
      return;
    }

    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { error } = await supabase.from("categories").insert({
      name: trimmedName,
      slug,
    });

    if (error) {
      setAdminError(error.message);
      return;
    }

    setCategoryNameDraft("");
    setIsCategoryModalOpen(false);
    fetchData();
  };

  const handleCreateAdminInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = inviteEmailDraft.trim().toLowerCase();

    if (!email) {
      setAdminError("Invite email is required.");
      return;
    }

    const { data, error } = await supabase.rpc("create_admin_invite", {
      p_invited_email: email,
    });

    if (error) {
      setAdminError(error.message);
      return;
    }

    if (typeof window !== "undefined" && data?.[0]?.invite_token) {
      setInviteLink(
        `${window.location.origin}/login?admin_invite=${encodeURIComponent(
          data[0].invite_token,
        )}&next=${encodeURIComponent("/admin")}`,
      );
    }

    setInviteEmailDraft("");
    fetchData();
  };

  const copyInviteLink = async () => {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
  };

  if (loading && !user) return <div className="p-20 text-center font-black animate-pulse text-[var(--color-primary-green)]">SECURE VERIFICATION...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
        <h1 className="text-4xl font-black text-red-500 mb-4 uppercase italic tracking-tighter">Access Denied</h1>
        <p className="text-slate-400 font-bold mb-8">Unauthorized access to Vitzo Admin Core.</p>
        <Link href="/" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-sm italic shadow-lg">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ee_0%,#ffffff_100%)] lg:flex">
      {/* Sidebar */}
      <aside className="border-b border-white/8 bg-slate-900 px-4 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:p-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-black uppercase italic sm:text-2xl lg:mb-12">
            <span className="text-[var(--color-secondary-green)]">V</span>-Admin
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full NOT-italic tracking-widest font-bold">CORE</span>
          </Link>
          
          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:mt-0 lg:flex-1 lg:flex-col lg:space-y-2 lg:overflow-visible lg:pb-0">
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

          <div className="mt-5 border-t border-white/10 pt-5 lg:mt-auto lg:pt-8">
             <button className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-red-500/10 p-4 text-xs font-black uppercase italic text-red-400 transition-all hover:bg-red-500/20" onClick={() => supabase.auth.signOut()}>
                Terminate Session
             </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:p-12">
        {adminError && (
          <div className="mb-8 rounded-[1.75rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {adminError}
          </div>
        )}

        {activeTab === "dashboard" && (
           <DashboardContent
             productsCount={products.length}
             agentsCount={agents.length}
             activeOrders={activeOrders}
             totalProfit={totalProfit}
             agents={agents}
             assignmentDrafts={assignmentDrafts}
             setAssignmentDrafts={setAssignmentDrafts}
             assignOrderToAgent={assignOrderToAgent}
           />
        )}

        {activeTab === "products" && (
           <>
            <header className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-center lg:justify-between">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic sm:text-4xl">Inventory Flux</h2>
                  <p className="text-slate-400 font-bold">Manage real-time grocery synchronization.</p>
               </div>
               <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button onClick={() => setIsCategoryModalOpen(true)} className="min-h-12 rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-black uppercase italic text-slate-900 shadow-sm transition-all hover:-translate-y-0.5">
                    New Category
                  </button>
                  <button onClick={() => { setEditingProduct(null); setDraftRealPrice(0); setDraftCommission(0); setDraftUnitType("weight"); setDraftAllowedUnits(["g", "kg"]); setIsModalOpen(true); }} className="min-h-12 rounded-3xl bg-slate-900 px-8 py-4 text-sm font-black uppercase italic text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95">Register Product</button>
               </div>
            </header>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 bg-white shadow-xl shadow-slate-200/60 lg:rounded-[40px]">
               <table className="min-w-[720px] w-full text-left">
                  <thead className="bg-gray-50 border-b">
                     <tr>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Identification</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Classification</th>
                        <th className="p-8 text-[11px] font-black uppercase text-slate-400">Pricing</th>
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
                             <div className="flex flex-wrap items-center gap-2">
                               <span className="px-3 py-1 bg-white border rounded-full text-[10px] font-black uppercase text-slate-400">{getCategoryName(p.categories)}</span>
                               <span className="px-3 py-1 bg-white border rounded-full text-[10px] font-black uppercase text-slate-400">
                                 {formatAllowedUnits(p.allowed_units, p.unit_type)}
                               </span>
                             </div>
                          </td>
                          <td className="p-8">
                             <p className="font-black text-slate-900">₹{p.final_price}</p>
                             <p className="text-xs font-bold text-slate-400">₹{p.real_price} + ₹{p.commission}</p>
                          </td>
                          <td className="p-8 text-right space-x-2">
                             <button onClick={() => { setEditingProduct(p); setDraftRealPrice(p.real_price); setDraftCommission(p.commission); setIsModalOpen(true); }} className="p-3 bg-white border rounded-xl hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
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
            <header className="mb-10 lg:mb-12">
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic sm:text-4xl">Fleet Control</h2>
               <p className="text-slate-400 font-bold">Monitor and authorize delivery agent activity.</p>
            </header>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 bg-white shadow-xl shadow-slate-200/60 lg:rounded-[40px]">
               <table className="min-w-[860px] w-full text-left">
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
                             <span className="font-black text-xs uppercase tracking-widest">{a.working_area ?? "Area pending"}</span>
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
                                   <p className="font-black text-slate-900 flex items-center gap-1">{a.average_rating ?? '5.0'} <Star className="h-3 w-3 fill-amber-400 text-amber-400" /></p>
                                </div>
                                <div className="pl-4 border-l">
                                   <p className="text-[10px] font-black uppercase text-slate-400">Payout</p>
                                   <p className="font-black text-slate-900">₹{a.salary ?? 0}</p>
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
                                 const s = prompt("Set Agent Salary/Incentive (INR):", String(a.salary ?? 0));
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

        {activeTab === "team" && (
          <>
            <header className="mb-10 lg:mb-12">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic sm:text-4xl">Administrative Access</h2>
              <p className="text-slate-400 font-bold">Invite other admins to manage Vitzo operations without touching the database manually.</p>
            </header>

            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[2.2rem] bg-[linear-gradient(135deg,#173127_0%,#29463b_50%,#ffd84d_100%)] p-6 text-white shadow-[0_28px_60px_rgba(23,49,39,0.18)] sm:rounded-[2.8rem] sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">Invite new admin</p>
                <h3 className="mt-3 text-3xl font-black uppercase italic tracking-tight">
                  Create a secure admin invite link
                </h3>
                <p className="mt-4 max-w-xl text-sm font-bold text-white/72">
                  Invite links are email-specific and get applied automatically when the invited person signs in with the same email account.
                </p>

                <form onSubmit={handleCreateAdminInvite} className="mt-8 space-y-4">
                  <input
                    type="email"
                    value={inviteEmailDraft}
                    onChange={(event) => setInviteEmailDraft(event.target.value)}
                    placeholder="admin@example.com"
                    className="h-14 w-full rounded-full border border-white/14 bg-white/12 px-5 text-sm font-semibold text-white outline-none placeholder:text-white/45"
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-black uppercase tracking-[0.18em] text-slate-900 sm:w-auto"
                  >
                    Generate invite
                  </button>
                </form>

                {inviteLink && (
                  <div className="mt-6 rounded-[1.9rem] border border-white/14 bg-white/10 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/56">Latest invite link</p>
                    <p className="mt-3 break-all text-sm font-bold text-white/86">{inviteLink}</p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/56">
                      Share this link with your team member. After sign-in, Vitzo will grant admin access automatically.
                    </p>
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-black uppercase tracking-[0.16em] text-[var(--forest-950)]"
                    >
                      Copy invite link
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-[2.2rem] border border-gray-100 bg-white p-6 shadow-sm sm:rounded-[2.5rem] sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Recent admin invites</p>
                <h3 className="mt-3 text-2xl font-black uppercase italic tracking-tight text-slate-900">
                  Invite activity
                </h3>

                <div className="mt-8 space-y-4">
                  {adminInvites.length === 0 ? (
                    <p className="text-sm font-bold text-slate-400">
                      No admin invites have been created yet.
                    </p>
                  ) : (
                    adminInvites.map((invite) => (
                      <div key={invite.id} className="rounded-[1.8rem] border border-gray-100 bg-gray-50 px-5 py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-slate-900">{invite.invited_email}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                              Created {new Date(invite.created_at).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${
                            invite.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : invite.status === "revoked"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-800"
                          }`}>
                            {invite.status}
                          </span>
                        </div>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                          Expires {new Date(invite.expires_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {/* Modal for adding/editing products */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-white p-6 sm:rounded-[40px] sm:p-10">
               <button onClick={() => setIsCategoryModalOpen(false)} className="absolute right-5 top-5 rounded-full p-2 transition-all hover:bg-gray-100 sm:right-8 sm:top-8"><X className="h-6 w-6 text-slate-400" /></button>
               <h3 className="pr-10 text-2xl font-black uppercase italic tracking-tighter text-slate-900 sm:text-3xl">Create Category</h3>
               <p className="mt-3 text-sm font-bold text-slate-400">
                 Add a new aisle so products can be organized immediately in the storefront and admin inventory flow.
               </p>

               <form onSubmit={handleCreateCategory} className="mt-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Name</label>
                     <input
                       value={categoryNameDraft}
                       onChange={(event) => setCategoryNameDraft(event.target.value)}
                       className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none"
                       placeholder="Fresh Herbs"
                       required
                     />
                  </div>

                  <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest italic shadow-xl">
                    Create Category
                  </button>
               </form>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="relative w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 sm:max-h-[90vh] sm:rounded-[40px] sm:p-10">
               <button onClick={() => setIsModalOpen(false)} className="absolute right-5 top-5 rounded-full p-2 transition-all hover:bg-gray-100 sm:right-8 sm:top-8"><X className="h-6 w-6 text-slate-400" /></button>
               <h3 className="mb-8 pr-10 text-2xl font-black uppercase italic tracking-tighter text-slate-900 sm:text-3xl">{editingProduct ? "Modify Product" : "New Registration"}</h3>
               
               <form onSubmit={handleAddEditProduct} className="space-y-6">
                 <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product Name</label>
                       <input name="name" required defaultValue={editingProduct?.name} className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real Price (INR)</label>
                       <input name="real_price" type="number" step="0.01" required value={draftRealPrice} onChange={(event) => setDraftRealPrice(Number(event.target.value) || 0)} className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none" />
                    </div>
                 </div>

                 <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                       <select name="category_id" required defaultValue={editingProduct?.category_id ?? categories[0]?.id ?? ""} className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commission (INR)</label>
                       <input name="commission" type="number" step="0.01" required value={draftCommission} onChange={(event) => setDraftCommission(Number(event.target.value) || 0)} className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 font-bold focus:bg-white focus:border-[var(--color-primary-green)] outline-none" />
                    </div>
                 </div>

                 <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Measurement Type</label>
                       <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {UNIT_TYPE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setDraftUnitType(option.value);
                                setDraftAllowedUnits(getDefaultUnitsForType(option.value));
                              }}
                              className={`min-h-14 rounded-2xl border px-4 text-left transition-all ${
                                draftUnitType === option.value
                                  ? "border-[var(--accent-deep)] bg-[rgba(242,106,46,0.08)] text-slate-900"
                                  : "border-gray-200 bg-gray-50 text-slate-500"
                              }`}
                            >
                              <span className="block text-[11px] font-black uppercase tracking-[0.18em]">
                                {option.label}
                              </span>
                              <span className="mt-1 block text-xs font-semibold">
                                {option.help}
                              </span>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Allowed Units</label>
                       <div className="flex flex-wrap gap-2 rounded-[1.75rem] border border-gray-100 bg-gray-50 p-3">
                          {getUnitOptionsForType(draftUnitType).map((unitOption) => {
                            const active = draftAllowedUnits.includes(unitOption);
                            return (
                              <button
                                key={unitOption}
                                type="button"
                                onClick={() => setDraftAllowedUnits(toggleUnitSelection(draftUnitType, draftAllowedUnits, unitOption))}
                                className={`min-h-11 rounded-full px-4 text-sm font-black uppercase tracking-[0.16em] transition-all ${
                                  active
                                    ? "bg-slate-900 text-white"
                                    : "border border-gray-200 bg-white text-slate-500"
                                }`}
                              >
                                {unitOption}
                              </button>
                            );
                          })}
                       </div>
                       <p className="text-xs font-bold text-slate-400">
                          Customers will only see these units while choosing quantity for this product.
                       </p>
                    </div>
                 </div>

                 <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50 px-5 py-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer-facing final price</p>
                    <p className="mt-2 text-3xl font-black italic tracking-tight text-slate-900">
                      ₹{(draftRealPrice + draftCommission).toFixed(2)}
                    </p>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product Image</label>
                    <div className="flex flex-col gap-4 sm:flex-row">
                       <div className="relative h-32 w-full overflow-hidden rounded-3xl border-2 border-dashed border-gray-200 sm:w-32">
                          {imagePreview || editingProduct?.image_url ? (
                            <Image src={imagePreview || editingProduct?.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"} alt="Preview" fill className="object-cover" />
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

const UNIT_TYPE_OPTIONS: { value: UnitType; label: string; help: string }[] = [
  { value: "weight", label: "Weight", help: "Use for produce, grains, and solids." },
  { value: "volume", label: "Volume", help: "Use for milk, oils, and other liquids." },
  { value: "discrete", label: "Discrete", help: "Use for packets, pieces, and countable items." },
];

function getDefaultUnitsForType(unitType: UnitType): UnitOption[] {
  if (unitType === "volume") {
    return ["ml", "l"];
  }

  if (unitType === "discrete") {
    return ["pack", "piece"];
  }

  return ["g", "kg"];
}

function getUnitOptionsForType(unitType: UnitType): UnitOption[] {
  return getDefaultUnitsForType(unitType);
}

function getNormalizedAllowedUnits(
  allowedUnits: string[] | null | undefined,
  unitType: UnitType,
): UnitOption[] {
  const supportedUnits = getUnitOptionsForType(unitType);
  const normalizedUnits = (allowedUnits ?? []).filter((unit): unit is UnitOption =>
    supportedUnits.includes(unit as UnitOption),
  );

  return normalizedUnits.length > 0 ? normalizedUnits : supportedUnits;
}

function mapProductRecord(product: {
  id: string;
  name: string;
  real_price: number;
  commission: number;
  final_price: number;
  unit_type: string;
  allowed_units: unknown;
  category_id: string | null;
  image_url: string | null;
  categories?: { name: string } | { name: string }[] | null;
}): Product {
  const unitType = isUnitType(product.unit_type) ? product.unit_type : "weight";
  const allowedUnits = Array.isArray(product.allowed_units)
    ? product.allowed_units.filter((unit): unit is string => typeof unit === "string")
    : null;

  return {
    ...product,
    unit_type: unitType,
    allowed_units: getNormalizedAllowedUnits(allowedUnits, unitType),
  };
}

function isUnitType(value: string): value is UnitType {
  return value === "weight" || value === "volume" || value === "discrete";
}

function toggleUnitSelection(
  unitType: UnitType,
  currentUnits: UnitOption[],
  unit: UnitOption,
): UnitOption[] {
  const supportedUnits = getUnitOptionsForType(unitType);
  const nextUnits = currentUnits.includes(unit)
    ? currentUnits.filter((currentUnit) => currentUnit !== unit)
    : [...currentUnits, unit];

  const filteredUnits = nextUnits.filter((currentUnit) => supportedUnits.includes(currentUnit));

  return filteredUnits.length > 0 ? filteredUnits : [unit];
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`group inline-flex min-h-12 shrink-0 items-center gap-3 rounded-[18px] px-4 py-3 text-[10px] font-black uppercase italic transition-all sm:text-[11px] lg:w-full lg:px-5 lg:py-5 ${active ? 'bg-white text-slate-900 shadow-xl border border-gray-100' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
    >
      <div className={`${active ? 'text-slate-900' : 'text-slate-400 group-hover:text-white'} transition-colors`}>{icon}</div>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function DashboardContent({
  productsCount,
  agentsCount,
  activeOrders,
  totalProfit,
  agents,
  assignmentDrafts,
  setAssignmentDrafts,
  assignOrderToAgent,
}: {
  productsCount: number;
  agentsCount: number;
  activeOrders: ActiveOrder[];
  totalProfit: number;
  agents: Agent[];
  assignmentDrafts: Record<string, string>;
  setAssignmentDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  assignOrderToAgent: (orderId: string) => void;
}) {
  const approvedAgents = agents.filter(
    (agent) => agent.status === "approved" && agent.is_active,
  );

  return (
    <>
      <header className="mb-10 lg:mb-12">
         <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 sm:text-4xl">Control Node</h2>
         <p className="text-slate-400 font-bold">Live profit, fleet readiness, and undelivered order activity.</p>
      </header>

      <section className="overflow-hidden rounded-[2.2rem] bg-[linear-gradient(135deg,#173127_0%,#29463b_46%,#ffd84d_100%)] px-5 py-7 text-white shadow-[0_30px_70px_rgba(23,49,39,0.18)] sm:rounded-[2.9rem] sm:px-8 sm:py-10">
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Delivered profit</p>
         <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
               <p className="text-4xl font-black italic tracking-tighter sm:text-5xl lg:text-6xl">₹{totalProfit.toFixed(2)}</p>
               <p className="mt-3 max-w-xl text-sm font-bold text-white/72">
                 Commission is counted only after delivery is completed, so this number tracks realized profit instead of pending revenue.
               </p>
            </div>
            <div className="rounded-[1.8rem] border border-white/14 bg-white/10 px-5 py-4 text-sm font-bold text-white/75">
              Recomputed from delivered order items in real time.
            </div>
         </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3 lg:gap-8">
         <StatCard label="Product Inventory" value={productsCount.toString()} sub="Unique Assets" />
         <StatCard label="Active Fleet" value={agentsCount.toString()} sub="Delivery Units" />
         <StatCard label="Live Orders" value={activeOrders.length.toString()} sub="Undelivered" />
      </div>

      <section className="mt-8 overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm sm:mt-10 sm:rounded-[2.5rem]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Status View</p>
            <h3 className="mt-2 text-xl font-black uppercase italic tracking-tight text-slate-900 sm:text-2xl">
              Live orders in motion
            </h3>
          </div>
          <span className="inline-flex w-fit rounded-full bg-amber-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-800">
            {activeOrders.length} active
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-8 sm:py-16">
            <Truck className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-black uppercase italic text-slate-500">
              No undelivered orders right now
            </p>
            <p className="mt-2 text-sm font-bold text-slate-400">
              New checkouts and agent updates will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeOrders.map((order) => (
              <div key={order.id} className="grid gap-5 px-5 py-5 sm:px-8 sm:py-6 lg:grid-cols-[1.1fr_0.7fr_0.55fr_0.65fr] lg:items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {order.shipping_house_no || "Address pending"}, {order.shipping_street || "street pending"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {order.shipping_area || "Area pending"} • {order.mobile_number || "Phone pending"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Assignment
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {order.agents?.full_name || "Waiting for auto-assignment"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    {order.order_items.length} items
                  </p>
                  {!order.agents && (
                    <div className="mt-3 flex flex-col gap-2">
                      <select
                        value={assignmentDrafts[order.id] ?? ""}
                        onChange={(event) =>
                          setAssignmentDrafts((prev) => ({
                            ...prev,
                            [order.id]: event.target.value,
                          }))
                        }
                        className="h-10 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
                      >
                        <option value="">Assign agent</option>
                        {approvedAgents
                          .filter((agent) => !order.shipping_area || agent.working_area === order.shipping_area)
                          .map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.full_name}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => assignOrderToAgent(order.id)}
                        className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-black uppercase tracking-[0.16em] text-white"
                      >
                        Assign now
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Total
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    ₹{order.total_amount}
                  </p>
                </div>

                <div className="lg:text-right">
                  <span className={`inline-flex rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] ${getOrderStatusTone(order.delivery_status)}`}>
                    {formatDeliveryStatus(order.delivery_status)}
                  </span>
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    {order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "Recent order"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function StatCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl sm:rounded-[40px] sm:p-8 lg:p-10">
       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
       <p className="mt-2 text-4xl font-black italic tracking-tighter text-slate-900 sm:text-5xl">{value}</p>
       <p className="text-xs font-bold text-slate-400 mt-4 uppercase italic">{sub}</p>
    </div>
  );
}

function getCategoryName(category: Product["categories"]) {
  if (Array.isArray(category)) {
    return category[0]?.name ?? "Uncategorized";
  }

  return category?.name ?? "Uncategorized";
}

function formatAllowedUnits(allowedUnits: string[] | null, unitType: UnitType) {
  return getNormalizedAllowedUnits(allowedUnits, unitType).join(" / ");
}

function formatDeliveryStatus(status: string | null) {
  return (status ?? "pending").replaceAll("_", " ");
}

function getOrderStatusTone(status: string | null) {
  if (status === "assigned") {
    return "bg-blue-100 text-blue-800";
  }

  if (status === "out_for_delivery") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "ready_for_pickup") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-100 text-slate-700";
}
