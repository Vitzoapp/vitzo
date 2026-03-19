"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 italic font-outfit uppercase">
            <span className="text-[var(--color-primary-gold)]">V</span>itzo Auth
          </h2>
          <p className="text-sm font-bold text-slate-400 mt-2">Login or signup to continue your fresh delivery.</p>
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
                    borderRadiusButton: '16px',
                    inputBorderRadius: '16px',
                }
              },
            },
            className: {
                container: 'space-y-4',
                button: 'font-black uppercase tracking-widest py-3 hover:scale-[1.02] transition-transform',
                input: 'border-gray-100 bg-gray-50 focus:bg-white transition-colors py-3',
            }
          }}
          providers={["google"]}
          redirectTo={typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}` : ""}
        />
      </div>
    </div>
  );
}
