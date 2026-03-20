"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push(next);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, next]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary-green)]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-secondary-green)]/10 rounded-full blur-[120px]" />

        <div className="relative w-full max-w-xl">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors mb-12 uppercase italic tracking-widest group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Store
            </Link>

            <div className="bg-white rounded-[48px] shadow-2xl shadow-slate-200 border border-gray-100 p-10 sm:p-20 relative overflow-hidden">
                <div className="mb-12 text-center">
                    <div className="flex justify-center mb-8">
                        <Link href="/" className="group flex items-center gap-1 transition-transform hover:scale-105 active:scale-95">
                          <span className="text-4xl font-black italic tracking-tighter uppercase text-slate-900 group-hover:text-[var(--color-primary-green)] transition-colors">
                            <span className="text-[var(--color-primary-green)]">V</span>ITZO
                          </span>
                          <div className="h-2 w-2 rounded-full bg-[var(--color-secondary-green)] mt-4 animate-pulse" />
                        </Link>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 italic font-outfit uppercase tracking-tighter leading-none mb-4">
                        <span className="text-[var(--color-primary-gold)]">V</span>itzo identity
                    </h1>
                    <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm">Secure access to your fresh grocery network.</p>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: "#F5C124",
                                    brandAccent: "#e1b020",
                                },
                                radii: {
                                    borderRadiusButton: '24px',
                                    inputBorderRadius: '24px',
                                }
                            },
                        },
                        className: {
                            container: 'space-y-6',
                            button: 'font-black uppercase tracking-widest py-4 hover:scale-[1.02] active:scale-95 transition-all text-sm',
                            input: 'border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[var(--color-primary-green)] transition-all py-4 px-6 font-bold text-slate-900 shadow-sm',
                            label: 'text-xs font-black uppercase text-slate-700 tracking-widest mb-2 ml-4',
                            anchor: 'text-xs font-bold text-[var(--color-primary-green)] hover:underline'
                        }
                    }}
                    providers={["google"]}
                    redirectTo={origin ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : ""}
                />

                <div className="mt-12 pt-12 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 italic">Trusted by thousands of fresh households</p>
                </div>
            </div>
        </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary-green)] border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
