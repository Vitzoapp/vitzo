"use client";

import type { ElementType, FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Copy,
  Gift,
  MapPin,
  Phone,
  Save,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ALLOWED_AREAS = ["Ramanattukara", "Azhinjilam", "Farook College"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface Profile {
  id: string;
  full_name: string | null;
  mobile_number: string | null;
  house_no: string | null;
  street: string | null;
  landmark: string | null;
  area: string | null;
  referral_code: string | null;
}

interface WalletAccount {
  user_id: string;
  balance: number;
}

interface Referral {
  id: string;
  created_at: string;
  status: string;
  reward_amount: number;
  referral_code_used: string;
}

interface WalletTransaction {
  id: string;
  amount: number;
  created_at: string;
  description: string | null;
  transaction_type: string;
  source_type: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }

    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/";
        return;
      }

      const [profileRes, walletRes, referralsRes, transactionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("wallets").select("*").eq("user_id", session.user.id).single(),
        supabase
          .from("referrals")
          .select("id, created_at, status, reward_amount, referral_code_used")
          .eq("referrer_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("wallet_transactions")
          .select("id, amount, created_at, description, transaction_type, source_type")
          .eq("wallet_user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      } else {
        setProfile({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || "",
          mobile_number: "",
          house_no: "",
          street: "",
          landmark: "",
          area: "",
          referral_code: null,
        });
      }

      if (walletRes.data) {
        setWallet(walletRes.data);
      } else {
        setWallet({ user_id: session.user.id, balance: 0 });
      }

      setReferrals(referralsRes.data ?? []);
      setTransactions(transactionsRes.data ?? []);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!profile) {
      setSaving(false);
      return;
    }

    if (profile.area && !ALLOWED_AREAS.includes(profile.area)) {
      setError(`Sorry, we currently only deliver to: ${ALLOWED_AREAS.join(", ")}`);
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase.from("profiles").upsert({
      id: profile.id,
      full_name: profile.full_name,
      mobile_number: profile.mobile_number,
      house_no: profile.house_no,
      street: profile.street,
      landmark: profile.landmark,
      area: profile.area,
      updated_at: new Date().toISOString(),
    });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setMessage("Profile updated successfully.");
    setSaving(false);
  };

  const handleCopyReferral = async () => {
    if (!profile?.referral_code || !origin) {
      return;
    }

    const referralLink = `${origin}/?ref=${encodeURIComponent(profile.referral_code)}`;
    await navigator.clipboard.writeText(referralLink);
    setCopyMessage("Referral link copied.");
    window.setTimeout(() => setCopyMessage(null), 2200);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center bg-[var(--background)]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent-deep)] border-t-transparent" />
      </div>
    );
  }

  const rewardedReferrals = referrals.filter((referral) => referral.status === "rewarded");
  const totalReferralEarnings = rewardedReferrals.reduce(
    (total, referral) => total + referral.reward_amount,
    0,
  );

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2.9rem] bg-[linear-gradient(135deg,rgba(255,216,77,0.96)_0%,rgba(242,106,46,0.88)_55%,rgba(24,49,40,0.95)_100%)] px-8 py-10 text-white shadow-[0_30px_70px_rgba(242,106,46,0.18)] sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="font-display text-6xl tracking-[0.16em] text-white sm:text-7xl">
                VITZO
              </p>
              <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/70">
                Wallet & referrals
              </p>
              <h1 className="mt-3 max-w-xl font-body text-[clamp(2.3rem,5vw,4.2rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
                Keep rewards ready for the next grocery run.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/78 sm:text-base">
                Invite someone to Vitzo, earn from their first completed order, and spend that balance directly at checkout.
              </p>
            </div>

            <div className="rounded-[2.4rem] border border-white/16 bg-white/12 p-6 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/62">
                    Current balance
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
                    {currencyFormatter.format(wallet?.balance ?? 0)}
                  </p>
                </div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/14">
                  <Wallet className="h-6 w-6 text-[rgba(255,216,77,0.96)]" />
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Metric label="Successful invites" value={String(rewardedReferrals.length)} />
                <Metric
                  label="Pending invites"
                  value={String(referrals.filter((referral) => referral.status === "pending").length)}
                />
                <Metric label="Referral earnings" value={currencyFormatter.format(totalReferralEarnings)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-8 shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
              <p className="vitzo-kicker">Referral code</p>
              <h2 className="mt-3 font-body text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-[var(--forest-950)]">
                Share your invite and grow the wallet.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-[var(--forest-700)]">
                You earn 10% of a friend&apos;s first delivered order, capped at ₹70, and the reward lands directly in Vitzo Wallet.
              </p>

              <div className="mt-8 border-t border-[var(--line-soft)] pt-8">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                  Your code
                </p>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-display text-5xl tracking-[0.14em] text-[var(--forest-950)]">
                    {profile?.referral_code || "PENDING"}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyReferral}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-5 text-sm font-semibold text-white"
                  >
                    <Copy className="h-4 w-4" />
                    Copy referral link
                  </button>
                </div>
                {origin && profile?.referral_code && (
                  <p className="mt-4 break-all text-sm text-[var(--forest-700)]">
                    {origin}/?ref={profile.referral_code}
                  </p>
                )}
                {copyMessage && (
                  <p className="mt-3 text-sm font-semibold text-[var(--accent-deep)]">
                    {copyMessage}
                  </p>
                )}
              </div>

              <div className="mt-8 border-t border-[var(--line-soft)] pt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                      Invite progress
                    </p>
                    <p className="mt-2 text-sm text-[var(--forest-700)]">
                      Pending referrals move to rewarded after the first delivered order.
                    </p>
                  </div>
                  <Gift className="h-5 w-5 text-[var(--accent-deep)]" />
                </div>

                <div className="mt-6 space-y-4">
                  {referrals.length === 0 ? (
                    <p className="text-sm leading-6 text-[var(--forest-700)]">
                      No referral activity yet. Share your link to start building balance.
                    </p>
                  ) : (
                    referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between gap-4 border-t border-[var(--line-soft)] pt-4 first:border-t-0 first:pt-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--forest-950)]">
                            Code used: {referral.referral_code_used}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--forest-700)]">
                            {new Date(referral.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${
                              referral.status === "rewarded"
                                ? "bg-[rgba(125,207,89,0.16)] text-[var(--forest-950)]"
                                : "bg-[rgba(255,216,77,0.22)] text-[var(--forest-950)]"
                            }`}
                          >
                            {referral.status}
                          </span>
                          <p className="mt-2 text-sm font-semibold text-[var(--forest-950)]">
                            {referral.status === "rewarded"
                              ? currencyFormatter.format(referral.reward_amount)
                              : "Awaiting first order"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-8 shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
              <p className="vitzo-kicker">Wallet activity</p>
              <h2 className="mt-3 font-body text-[clamp(1.9rem,4vw,2.8rem)] font-semibold tracking-[-0.05em] text-[var(--forest-950)]">
                Every credit and deduction in one timeline.
              </h2>

              <div className="mt-8 space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-sm leading-6 text-[var(--forest-700)]">
                    Wallet history will show here once referral rewards or checkout deductions start flowing.
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-4 border-t border-[var(--line-soft)] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--forest-950)]">
                          {transaction.description ||
                            `${transaction.source_type.replaceAll("_", " ")} ${transaction.transaction_type}`}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--forest-700)]">
                          {new Date(transaction.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          transaction.transaction_type === "credit"
                            ? "text-[var(--accent-fresh)]"
                            : "text-[var(--accent-deep)]"
                        }`}
                      >
                        {transaction.transaction_type === "credit" ? "+" : "-"}
                        {currencyFormatter.format(transaction.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <section className="rounded-[2.75rem] border border-[var(--line-soft)] bg-white/78 p-8 shadow-[0_24px_55px_rgba(33,55,47,0.06)] sm:p-10">
            <p className="vitzo-kicker">Delivery profile</p>
            <h2 className="mt-3 font-body text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--forest-950)]">
              Save the details your orders need.
            </h2>

            <form onSubmit={handleSave} className="mt-8 space-y-6">
              {error && (
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(242,106,46,0.08)] px-4 py-4 text-sm text-[var(--forest-950)]">
                  <AlertCircle className="h-4 w-4 text-[var(--accent-deep)]" />
                  {error}
                </div>
              )}
              {message && (
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(125,207,89,0.14)] px-4 py-4 text-sm text-[var(--forest-950)]">
                  <Save className="h-4 w-4 text-[var(--accent-fresh)]" />
                  {message}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" icon={UserIcon}>
                  <input
                    type="text"
                    value={profile?.full_name || ""}
                    onChange={(event) =>
                      setProfile((prev) =>
                        prev ? { ...prev, full_name: event.target.value } : null,
                      )
                    }
                    className="w-full rounded-[1.25rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--forest-950)] outline-none focus:border-[var(--accent-deep)]"
                    placeholder="Enter your name"
                    required
                  />
                </Field>

                <Field label="Mobile number" icon={Phone}>
                  <input
                    type="tel"
                    value={profile?.mobile_number || ""}
                    onChange={(event) =>
                      setProfile((prev) =>
                        prev ? { ...prev, mobile_number: event.target.value } : null,
                      )
                    }
                    className="w-full rounded-[1.25rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--forest-950)] outline-none focus:border-[var(--accent-deep)]"
                    placeholder="+91 00000 00000"
                    required
                  />
                </Field>
              </div>

              <Field label="Delivery area" icon={MapPin}>
                <select
                  value={profile?.area || ""}
                  onChange={(event) =>
                    setProfile((prev) =>
                      prev ? { ...prev, area: event.target.value } : null,
                    )
                  }
                  className="w-full rounded-[1.25rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--forest-950)] outline-none focus:border-[var(--accent-deep)]"
                  required
                >
                  <option value="">Select area</option>
                  {ALLOWED_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                  <option value="Other">Other (Not available)</option>
                </select>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="House no / name" icon={MapPin}>
                  <input
                    type="text"
                    value={profile?.house_no || ""}
                    onChange={(event) =>
                      setProfile((prev) =>
                        prev ? { ...prev, house_no: event.target.value } : null,
                      )
                    }
                    className="w-full rounded-[1.25rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--forest-950)] outline-none focus:border-[var(--accent-deep)]"
                    placeholder="Flat 4B"
                    required
                  />
                </Field>

                <Field label="Road / street" icon={MapPin}>
                  <input
                    type="text"
                    value={profile?.street || ""}
                    onChange={(event) =>
                      setProfile((prev) =>
                        prev ? { ...prev, street: event.target.value } : null,
                      )
                    }
                    className="w-full rounded-[1.25rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--forest-950)] outline-none focus:border-[var(--accent-deep)]"
                    placeholder="Street name"
                    required
                  />
                </Field>
              </div>

              <Field label="Landmark" icon={MapPin}>
                <input
                  type="text"
                  value={profile?.landmark || ""}
                  onChange={(event) =>
                    setProfile((prev) =>
                      prev ? { ...prev, landmark: event.target.value } : null,
                    )
                  }
                  className="w-full rounded-[1.25rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--forest-950)] outline-none focus:border-[var(--accent-deep)]"
                  placeholder="Near landmark"
                  required
                />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(242,106,46,0.18)] disabled:opacity-60"
              >
                {saving ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save profile details
                  </>
                )}
              </button>
            </form>
          </section>
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/16 bg-white/10 px-5 py-5 backdrop-blur">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/60">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {children}
    </label>
  );
}
