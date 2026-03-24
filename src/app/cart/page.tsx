"use client";

import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { formatWeightLabel } from "@/lib/pricing";

interface Profile {
  id: string;
  full_name: string | null;
  mobile_number: string | null;
  house_no: string | null;
  street: string | null;
  landmark: string | null;
  area: string | null;
}

interface WalletAccount {
  balance: number;
  user_id: string;
}

const ALLOWED_AREAS = ["Ramanattukara", "Azhinjilam", "Farook College"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } =
    useCart();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const [profileRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("wallets").select("*").eq("user_id", userId).single(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      if (walletRes.data) {
        setWallet(walletRes.data);
      } else {
        setWallet({ user_id: userId, balance: 0 });
      }
    };

    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCheckout = () => {
    setCheckoutError(null);
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/cart")}`);
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setCheckoutError(null);

    const { data: orderId, error: checkoutError } = await supabase.rpc(
      "process_checkout",
      {
        p_total_amount: totalPrice,
        p_shipping_house_no: profile?.house_no ?? "",
        p_shipping_street: profile?.street ?? "",
        p_shipping_landmark: profile?.landmark ?? "",
        p_shipping_area: profile?.area ?? "",
        p_mobile_number: profile?.mobile_number ?? "",
        p_payment_method:
          paymentMethod === "cod" ? "cash_on_delivery" : "online_upi",
        p_wallet_amount_requested: walletAmountToApply,
        p_items: cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          weight_grams: item.weightInGrams,
        })),
      },
    );

    if (checkoutError) {
      setCheckoutError(getCheckoutErrorMessage(checkoutError.message));
      setLoading(false);
      return;
    }

    if (orderId) {
      setWallet((prev) =>
        prev ? { ...prev, balance: Math.max(prev.balance - walletAmountToApply, 0) } : prev,
      );
      clearCart();
      setStep(4);
    }
    setLoading(false);
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center bg-[var(--background)] px-4 py-14">
        <div className="max-w-xl rounded-[2.75rem] border border-[var(--line-soft)] bg-white/78 p-10 text-center shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
          <div className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,216,77,0.28),rgba(242,106,46,0.18))] text-[var(--accent-deep)]">
            <ShoppingBag className="h-12 w-12" />
          </div>
          <h1 className="mt-6 font-body text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--forest-950)]">
            Your basket is ready for its first grocery pick.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--forest-700)] sm:text-base">
            Add fruit, pantry staples, and daily essentials from the new storefront and come back here to check out.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(242,106,46,0.18)]"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const isAreaAllowed = profile?.area
    ? ALLOWED_AREAS.includes(profile.area)
    : false;
  const walletBalance = wallet?.balance ?? 0;
  const walletAmountToApply = useWallet ? Math.min(walletBalance, totalPrice) : 0;
  const finalPayable = Math.max(totalPrice - walletAmountToApply, 0);

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="border-b border-[var(--line-soft)] pb-10">
          <p className="vitzo-kicker">Checkout</p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-body text-[clamp(2.4rem,5vw,4.3rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--forest-950)]">
                Move from basket to doorstep with the same bright storefront rhythm.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--forest-700)] sm:text-base">
                Review your items, confirm the address, and finish payment without falling back into the old dashboard style.
              </p>
            </div>

            <div className="flex gap-3">
              {["Basket", "Address", "Payment"].map((label, index) => {
                const active = step >= index + 1;
                return (
                  <div
                    key={label}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                      active
                        ? "bg-[var(--accent-deep)] text-white"
                        : "border border-[var(--line-soft)] bg-white/56 text-[var(--forest-700)]"
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid gap-8 pt-10 lg:grid-cols-[1.1fr_0.7fr]">
          <div className="space-y-6">
            {step === 1 && (
              <section className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
                <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-6 py-6 sm:px-8">
                  <h2 className="font-body text-2xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                    Basket ({totalItems})
                  </h2>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest-700)] hover:text-[var(--forest-950)]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Keep shopping
                  </Link>
                </div>

                <div className="divide-y divide-[var(--line-soft)]">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-5 px-6 py-6 sm:px-8 md:flex-row md:items-center"
                    >
                      <div className="relative h-24 w-24 overflow-hidden rounded-[1.6rem] bg-[var(--surface-soft)]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                          {item.category}
                        </p>
                        <h3 className="mt-2 font-body text-xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                          {item.name}
                        </h3>
                        <p className="mt-2 text-sm text-[var(--forest-700)]">
                          {currencyFormatter.format(item.unitPrice)} for {formatWeightLabel(item.weightInGrams)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 md:block md:text-right">
                        <div className="flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--forest-950)] hover:bg-white/70"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-5 text-center text-sm font-semibold text-[var(--forest-950)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forest-950)] text-white"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-4">
                          <p className="text-lg font-semibold text-[var(--forest-950)]">
                            {currencyFormatter.format(item.unitPrice * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/68 text-[var(--accent-deep)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_24px_55px_rgba(33,55,47,0.06)] sm:p-8">
                <h2 className="font-body text-2xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                  Delivery address
                </h2>

                <div className="mt-6">
                  {profile?.house_no ? (
                    <div
                      className={`rounded-[2rem] border p-6 ${
                        isAreaAllowed
                          ? "border-[rgba(125,207,89,0.42)] bg-[rgba(125,207,89,0.12)]"
                          : "border-[rgba(242,106,46,0.32)] bg-[rgba(242,106,46,0.08)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                            Delivery details
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-[var(--forest-950)]">
                            {profile.house_no}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--forest-700)]">
                            {profile.street}
                          </p>
                          <p className="mt-1 text-sm text-[var(--forest-700)]">
                            Near {profile.landmark}
                          </p>
                          <p className="mt-3 text-sm text-[var(--forest-700)]">
                            {profile.area} • {profile.mobile_number}
                          </p>
                        </div>
                        {isAreaAllowed ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-fresh)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--forest-950)]">
                            <CheckCircle2 className="h-4 w-4" />
                            Deliverable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--forest-950)]">
                            <MapPin className="h-4 w-4" />
                            Update area
                          </span>
                        )}
                      </div>
                      {!isAreaAllowed && (
                        <p className="mt-5 text-sm leading-6 text-[var(--forest-700)]">
                          We currently deliver only to {ALLOWED_AREAS.join(", ")}.
                          Update the profile address to continue checkout.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-[2rem] border border-dashed border-[var(--line-soft)] bg-[var(--surface-soft)] p-8 text-center">
                      <p className="text-sm text-[var(--forest-700)]">
                        Add your delivery address before placing an order.
                      </p>
                      <Link
                        href="/profile"
                        className="mt-5 inline-flex rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white"
                      >
                        Set up profile
                      </Link>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm font-semibold text-[var(--forest-700)]"
                  >
                    Back
                  </button>
                  {isAreaAllowed ? (
                    <button
                      onClick={() => setStep(3)}
                      className="rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white"
                    >
                      Continue to payment
                    </button>
                  ) : (
                    <Link
                      href="/profile"
                      className="rounded-full border border-[var(--line-soft)] bg-white/68 px-6 py-3 text-sm font-semibold text-[var(--forest-950)]"
                    >
                      Update address
                    </Link>
                  )}
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_24px_55px_rgba(33,55,47,0.06)] sm:p-8">
                <h2 className="font-body text-2xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                  Payment method
                </h2>
                {checkoutError && (
                  <div className="mt-5 rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(242,106,46,0.08)] px-4 py-4 text-sm text-[var(--forest-950)]">
                    {checkoutError}
                  </div>
                )}
                <div className="mt-6 rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                        Vitzo Wallet
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--forest-950)]">
                        {currencyFormatter.format(walletBalance)} available
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--forest-700)]">
                        Apply your wallet first and pay only the remaining balance with COD or UPI.
                      </p>
                    </div>
                    <Wallet className="h-6 w-6 text-[var(--accent-deep)]" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseWallet((current) => !current)}
                    disabled={walletBalance <= 0}
                    className={`mt-5 inline-flex min-h-12 w-full items-center justify-between rounded-full px-5 text-sm font-semibold transition ${
                      useWallet
                        ? "bg-[var(--accent-deep)] text-white"
                        : "border border-[var(--line-soft)] bg-white text-[var(--forest-950)]"
                    } ${walletBalance <= 0 ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <span>{useWallet ? "Wallet applied" : "Apply wallet balance"}</span>
                    <span>{currencyFormatter.format(walletAmountToApply)}</span>
                  </button>
                </div>
                <div className="mt-6 space-y-4">
                  <PaymentOption
                    active={paymentMethod === "cod"}
                    icon={ShoppingBag}
                    title="Pay on delivery"
                    copy="Use cash or UPI when the order arrives at your doorstep."
                    onClick={() => setPaymentMethod("cod")}
                  />
                  <PaymentOption
                    active={paymentMethod === "upi"}
                    icon={Zap}
                    title="UPI"
                    copy="Finish with GPay, PhonePe, Paytm, or another UPI app."
                    onClick={() => setPaymentMethod("upi")}
                  />
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="text-sm font-semibold text-[var(--forest-700)]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {loading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {finalPayable === 0
                      ? "Place order"
                      : `Pay ${currencyFormatter.format(finalPayable)}`}
                  </button>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="rounded-[2.75rem] border border-[var(--line-soft)] bg-white/82 p-10 text-center shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
                <div className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[rgba(125,207,89,0.18)] text-[var(--accent-fresh)]">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="mt-6 font-body text-[clamp(2.2rem,5vw,3.7rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--forest-950)]">
                  Order confirmed
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-[var(--forest-700)] sm:mx-auto sm:text-base">
                  Your groceries are being packed for the next delivery run. You can keep shopping or jump straight into order tracking.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/"
                    className="rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white"
                  >
                    Keep shopping
                  </Link>
                  <Link
                    href="/orders"
                    className="rounded-full border border-[var(--line-soft)] bg-white/68 px-6 py-3 text-sm font-semibold text-[var(--forest-950)]"
                  >
                    Track order
                  </Link>
                </div>
              </section>
            )}
          </div>

          {step < 4 && (
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <section className="rounded-[2.5rem] bg-[linear-gradient(180deg,var(--forest-950)_0%,#23392f_100%)] p-6 text-white shadow-[0_24px_55px_rgba(24,49,40,0.18)] sm:p-8">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Order summary
                </p>
                <div className="mt-8 space-y-4 text-sm">
                  <div className="flex items-center justify-between text-white/72">
                    <span>Subtotal</span>
                    <span>{currencyFormatter.format(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/72">
                    <span>Wallet deduction</span>
                    <span>{walletAmountToApply > 0 ? `-${currencyFormatter.format(walletAmountToApply)}` : currencyFormatter.format(0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/72">
                    <span>Delivery</span>
                    <span className="text-[var(--accent)]">Free</span>
                  </div>
                </div>
                <div className="mt-6 border-t border-white/12 pt-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Final payable
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
                    {currencyFormatter.format(finalPayable)}
                  </p>
                </div>

                {step === 1 && (
                  <button
                    onClick={handleCheckout}
                    className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[var(--accent-deep)] px-6 py-4 text-sm font-semibold text-white"
                  >
                    Continue checkout
                  </button>
                )}

                <div className="mt-8 rounded-[1.75rem] border border-white/12 bg-white/6 p-5 text-sm text-white/72">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-[var(--accent)]" />
                    Secure payment with a cleaner, faster checkout flow.
                  </div>
                </div>
              </section>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function getCheckoutErrorMessage(message: string) {
  if (message.startsWith("INSUFFICIENT_STOCK:")) {
    return `${message.replace("INSUFFICIENT_STOCK:", "")} is no longer available in the requested quantity.`;
  }

  if (message.startsWith("PRODUCT_NOT_FOUND:")) {
    return "One of the items in your basket is no longer available.";
  }

  if (message === "AUTH_REQUIRED") {
    return "Please sign in again before placing this order.";
  }

  if (message === "CART_EMPTY") {
    return "Your basket is empty. Add products before checking out.";
  }

  if (message === "INSUFFICIENT_WALLET_BALANCE") {
    return "Your Vitzo Wallet balance is lower than the amount you tried to apply.";
  }

  if (message === "WALLET_EXCEEDS_TOTAL") {
    return "Wallet usage cannot be higher than the order subtotal.";
  }

  if (message === "INVALID_WALLET_AMOUNT") {
    return "The wallet amount requested for this order is invalid.";
  }

  return message;
}

function PaymentOption({
  active,
  icon: Icon,
  title,
  copy,
  onClick,
}: {
  active: boolean;
  icon: ElementType;
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[2rem] border p-5 text-left transition-colors ${
        active
          ? "border-[var(--accent-deep)] bg-[rgba(242,106,46,0.08)]"
          : "border-[var(--line-soft)] bg-white/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
              active
                ? "bg-[var(--accent-deep)] text-white"
                : "bg-[var(--surface-soft)] text-[var(--forest-950)]"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--forest-950)]">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--forest-700)]">{copy}</p>
          </div>
        </div>
        {active && <CheckCircle2 className="h-5 w-5 text-[var(--accent-deep)]" />}
      </div>
    </button>
  );
}
