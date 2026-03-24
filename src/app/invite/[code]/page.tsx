import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Gift, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

const inviteImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80";

function normalizeReferralCode(value: string) {
  return value.trim().toUpperCase();
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const referralCode = normalizeReferralCode(code);
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_referrer_preview", {
    p_referral_code: referralCode,
  });

  const invite = data?.[0] ?? null;
  const referrerName = invite?.first_name || "a Vitzo member";

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={inviteImage}
            alt="Fresh groceries arranged for a neighborhood order drop."
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(24,49,40,0.92)_0%,rgba(24,49,40,0.7)_38%,rgba(24,49,40,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,216,77,0.3),transparent_34%),radial-gradient(circle_at_78%_28%,rgba(242,106,46,0.24),transparent_22%)]" />

        <div className="relative flex min-h-[calc(100svh-5rem)] items-end px-4 pb-14 pt-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-[34rem] text-white">
              <p className="animate-reveal font-display text-[clamp(5rem,17vw,11rem)] leading-[0.78] tracking-[0.12em] text-[var(--cream-100)]">
                VITZO
              </p>
              <p className="mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                Personal invite
              </p>
              <h1 className="animate-reveal animation-delay-150 mt-3 font-body text-[clamp(2.5rem,5vw,4.4rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
                You&apos;ve been invited by {referrerName}.
              </h1>
              <p className="animate-reveal animation-delay-300 mt-5 max-w-md text-sm leading-7 text-white/82 sm:text-base">
                Join Vitzo, save your address once, and move straight into the current grocery batch without typing a referral code.
              </p>

              <div className="animate-reveal animation-delay-450 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/login?ref=${encodeURIComponent(referralCode)}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--forest-950)] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Accept &amp; login
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/?ref=${encodeURIComponent(referralCode)}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/28 px-6 text-sm font-semibold text-white/92 transition-colors duration-300 hover:bg-white/10"
                >
                  Browse first
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-5 border-t border-white/16 pt-6 text-sm text-white/74">
                <div className="inline-flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[var(--accent)]" />
                  Referral gets linked automatically
                </div>
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                  Profile setup comes right after login
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const referralCode = normalizeReferralCode(code);
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_referrer_preview", {
    p_referral_code: referralCode,
  });

  const invite = data?.[0] ?? null;
  const referrerName = invite?.first_name || "a Vitzo member";

  return {
    title: `You're invited by ${referrerName}`,
    description:
      "Join Vitzo through a personal invite, save your delivery details once, and start shopping the current grocery batch.",
    alternates: {
      canonical: `/invite/${referralCode}`,
    },
    openGraph: {
      title: `You've been invited by ${referrerName}`,
      description:
        "Open this Vitzo invite to join the live grocery batch without typing a referral code.",
      url: `/invite/${referralCode}`,
      images: [
        {
          url: inviteImage,
          width: 1600,
          height: 900,
          alt: `Vitzo invite from ${referrerName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `You've been invited by ${referrerName}`,
      description:
        "Join Vitzo through a personal invite and start shopping the current grocery batch.",
      images: [inviteImage],
    },
  };
}
