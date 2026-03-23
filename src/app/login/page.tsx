"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const authError = searchParams.get("error");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push(next);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, next]);

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest-700)] transition-colors duration-300 hover:text-[var(--forest-950)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.75rem] bg-[linear-gradient(135deg,rgba(255,216,77,0.96)_0%,rgba(242,106,46,0.88)_100%)] p-8 text-[var(--forest-950)] shadow-[0_30px_65px_rgba(242,106,46,0.18)] sm:p-10">
            <p className="font-display text-6xl tracking-[0.16em] sm:text-7xl">
              VITZO
            </p>
            <h1 className="mt-4 max-w-sm font-body text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
              Sign in and keep your grocery flow moving.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--forest-950)]/80 sm:text-base">
              Save your address, manage orders, and move from homepage to checkout without losing the same bright storefront feel.
            </p>

            <div className="mt-10 space-y-4 rounded-[2rem] border border-white/35 bg-white/26 p-6 backdrop-blur-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--forest-950)]/70">
                What you unlock
              </p>
              <div className="space-y-3 text-sm text-[var(--forest-950)]/80">
                <p>Saved delivery profile for faster checkout.</p>
                <p>Live order tracking and repeat grocery runs.</p>
                <p>One place to manage your basket and history.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2.75rem] border border-[var(--line-soft)] bg-white/78 p-8 shadow-[0_24px_55px_rgba(33,55,47,0.06)] sm:p-10">
            <p className="vitzo-kicker">Customer access</p>
            <h2 className="mt-3 font-body text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--forest-950)]">
              Pick up where your basket left off.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--forest-700)]">
              Sign in with email or Google and we&apos;ll send you back to the page you were already shopping from.
            </p>

            {authError && (
              <div className="mt-6 rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(242,106,46,0.08)] px-4 py-4 text-sm text-[var(--forest-950)]">
                {authError}
              </div>
            )}

            <div className="mt-8">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: "#f26a2e",
                        brandAccent: "#df5d24",
                        defaultButtonBackground: "#ffffff",
                        defaultButtonBackgroundHover: "#fff4e8",
                        inputBackground: "#fff8f0",
                        inputText: "#183128",
                        inputBorder: "#f3d8b9",
                        inputBorderHover: "#f26a2e",
                        inputBorderFocus: "#f26a2e",
                      },
                      radii: {
                        borderRadiusButton: "999px",
                        buttonBorderRadius: "999px",
                        inputBorderRadius: "20px",
                      },
                    },
                  },
                  className: {
                    container: "space-y-5",
                    button:
                      "font-semibold text-sm transition-transform duration-200 hover:-translate-y-0.5",
                    input:
                      "border px-5 py-4 text-sm shadow-none focus:ring-0 transition-colors duration-200",
                    label:
                      "text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-deep)] mb-2 ml-1",
                    anchor:
                      "text-sm font-semibold text-[var(--accent-deep)] hover:text-[var(--forest-950)]",
                  },
                }}
                providers={["google"]}
                redirectTo={
                  origin
                    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
                    : ""
                }
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center bg-[var(--background)]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent-deep)] border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
