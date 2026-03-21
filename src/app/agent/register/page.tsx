"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, Send, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function AgentRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    area: ""
  });

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (agent) {
        if (agent.status === 'approved') router.push("/agent/dashboard");
        else router.push("/agent/waiting");
        return;
      }
      setLoading(false);
    };

    checkStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
      .from('agents')
      .insert([
        { 
          user_id: user?.id,
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          area: formData.area,
          status: 'pending'
        }
      ]);

    if (!error) {
      router.push("/agent/waiting");
    } else {
      alert("Registration failed: " + error.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white"><div className="p-20 animate-pulse bg-gray-50 h-screen" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-2 bg-slate-900 rounded-full" />
              <h1 className="font-outfit text-4xl font-black text-slate-950 uppercase tracking-tighter italic leading-none">
                Join Vitzo <br /> <span className="text-[var(--color-primary-green)]">Fleet</span>
              </h1>
            </div>
            
            <p className="text-slate-500 font-medium leading-relaxed">
              Become a Vitzo Delivery Agent and earn while delivering freshness to your city. Flexible hours, competitive pay, and a premium delivery experience.
            </p>

            <div className="space-y-6">
              <FeatureItem icon={ShieldCheck} title="Verified Work" desc="Official Vitzo ID & Gear provided" />
              <FeatureItem icon={Clock} title="Flexible Shifts" desc="Work on your own terms" />
              <FeatureItem icon={CheckCircle2} title="Direct Payouts" desc="Weekly salary directly to bank" />
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-8">Agent Application</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[var(--color-primary-green)] transition-all" />
                    <input 
                      required
                      type="text" 
                      placeholder="Enter legal name"
                      className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl pl-12 pr-4 font-bold text-slate-900 focus:bg-white focus:border-[var(--color-primary-green)] outline-none transition-all"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[var(--color-primary-green)] transition-all" />
                    <input 
                      required
                      type="tel" 
                      placeholder="+91 00000 00000"
                      className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl pl-12 pr-4 font-bold text-slate-900 focus:bg-white focus:border-[var(--color-primary-green)] outline-none transition-all"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Preferred Area</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[var(--color-primary-green)] transition-all" />
                    <input 
                      required
                      type="text" 
                      placeholder="Neighborhood / City Area"
                      className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl pl-12 pr-4 font-bold text-slate-900 focus:bg-white focus:border-[var(--color-primary-green)] outline-none transition-all"
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    disabled={submitting}
                    className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 hover:bg-[var(--color-primary-green)] transition-all shadow-xl disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {submitting ? "Processing Application..." : (
                      <>
                        Submit Application
                        <Send className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] font-medium text-slate-400 mt-4 px-8">
                    By submitting, you agree to Vitzo&apos;s Agent Terms of Service and Privacy Policy.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: React.ElementType, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm">
      <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary-green)]/10 flex items-center justify-center text-[var(--color-primary-green)]">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="font-black text-slate-900 uppercase italic text-xs tracking-wider">{title}</h4>
        <p className="text-xs font-medium text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
