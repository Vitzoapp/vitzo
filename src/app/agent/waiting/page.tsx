"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Agent {
  id: string;
  full_name: string;
  working_area: string;
  status: string;
}

export default function AgentWaitingPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!data) {
        router.push("/agent/register");
        return;
      }

      if (data.status === 'approved') {
        router.push("/agent/dashboard");
        return;
      }

      setAgent(data);
      setLoading(false);
    };

    fetchAgent();
    
    // Polling for status change
    const interval = setInterval(fetchAgent, 10000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading || !agent) return <div className="min-h-screen bg-white"><div className="p-20 animate-pulse bg-gray-50 h-screen" /></div>;

  const isTerminated = agent.status === 'terminated';

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      <main className="max-w-3xl mx-auto px-4 py-20 md:py-32">
        <div className="bg-white rounded-[50px] p-10 md:p-16 border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.05)] text-center relative overflow-hidden">
          
          {/* Status Icon */}
          <div className="flex justify-center mb-8">
            <div className={`h-24 w-24 rounded-[32px] flex items-center justify-center animate-bounce-subtle ${isTerminated ? 'bg-red-50 text-red-500' : 'bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]'}`}>
              {isTerminated ? <XCircle className="h-12 w-12" /> : <Clock className="h-12 w-12" />}
            </div>
          </div>

          <h1 className="font-outfit text-4xl font-black text-slate-950 uppercase tracking-tighter italic mb-4">
            {isTerminated ? "Application Terminated" : "Application Pending"}
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`h-2 w-2 rounded-full ${isTerminated ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              {isTerminated ? "Status: Terminated by Admin" : "Status: Under Review"}
            </span>
          </div>

          <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto mb-12">
            {isTerminated 
              ? "Your delivery agent application has been terminated. Please contact support at vitzo.hq@gmail.com for more information."
              : "Great things take time! Our admin team is currently reviewing your profile and documents. You'll gain access to the agent dashboard once approved."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
             <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Applicant Name</span>
                <p className="font-bold text-slate-900">{agent.full_name}</p>
             </div>
             <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Applied Area</span>
                <p className="font-bold text-slate-900">{agent.working_area}</p>
             </div>
          </div>

          {!isTerminated && (
            <div className="mt-12 pt-8 border-t border-gray-50">
               <p className="text-xs font-bold text-slate-400">Need help? <a href="mailto:vitzo.hq@gmail.com" className="text-[var(--color-primary-green)] underline">Contact Support</a></p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
