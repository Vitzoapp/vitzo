"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Phone,
  Star,
  Truck,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  id: string;
  quantity: number;
  price_at_time_of_order: number;
  products: {
    name: string;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  status: string | null;
  created_at: string | null;
  delivery_batch: string | null;
  delivery_batch_date: string | null;
  total_amount: number;
  delivery_status: string | null;
  delivery_pin: string | null;
  shipping_house_no: string | null;
  shipping_street: string | null;
  shipping_area: string | null;
  mobile_number: string | null;
  agent_id: string | null;
  agents: {
    full_name: string;
    phone_number: string;
    average_rating: number | null;
  } | null;
  order_items: OrderItem[];
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const steps = [
  {
    label: "Confirmed",
    status: "pending",
    description: "The basket has been received and queued for pickup.",
    icon: CheckCircle2,
  },
  {
    label: "Assigned",
    status: "assigned",
    description: "A delivery agent is being matched to your order.",
    icon: User,
  },
  {
    label: "On the way",
    status: "out_for_delivery",
    description: "Your groceries are out for delivery.",
    icon: Truck,
  },
  {
    label: "Delivered",
    status: "delivered",
    description: "The order has been completed.",
    icon: Package,
  },
];

export default function OrderTrackingPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setLoading(false);
        setErrorStatus(404);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
            id,
            status,
            created_at,
            delivery_batch,
            delivery_batch_date,
            total_amount,
            delivery_status,
            delivery_pin,
            shipping_house_no,
            shipping_street,
            shipping_area,
            mobile_number,
            agent_id,
            agents (full_name, phone_number, average_rating),
            order_items (
              id,
              quantity,
              price_at_time_of_order,
              products (name, image_url)
            )
          `,
        )
        .eq("id", id)
        .single();

      if (error) {
        setErrorStatus(error.code === "PGRST116" ? 404 : 403);
        setLoading(false);
        return;
      }

      setOrder({
        ...data,
        order_items: data.order_items ?? [],
        agents: data.agents ?? null,
      });
      setLoading(false);
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const subscription = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => {
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  agent_id:
                    typeof payload.new.agent_id === "string" || payload.new.agent_id === null
                      ? payload.new.agent_id
                      : prev.agent_id,
                  delivery_pin:
                    typeof payload.new.delivery_pin === "string" || payload.new.delivery_pin === null
                      ? payload.new.delivery_pin
                      : prev.delivery_pin,
                  delivery_batch:
                    typeof payload.new.delivery_batch === "string" || payload.new.delivery_batch === null
                      ? payload.new.delivery_batch
                      : prev.delivery_batch,
                  delivery_batch_date:
                    typeof payload.new.delivery_batch_date === "string" || payload.new.delivery_batch_date === null
                      ? payload.new.delivery_batch_date
                      : prev.delivery_batch_date,
                  delivery_status:
                    typeof payload.new.delivery_status === "string" || payload.new.delivery_status === null
                      ? payload.new.delivery_status
                      : prev.delivery_status,
                  status:
                    typeof payload.new.status === "string" || payload.new.status === null
                      ? payload.new.status
                      : prev.status,
                  mobile_number:
                    typeof payload.new.mobile_number === "string" || payload.new.mobile_number === null
                      ? payload.new.mobile_number
                      : prev.mobile_number,
                  shipping_area:
                    typeof payload.new.shipping_area === "string" || payload.new.shipping_area === null
                      ? payload.new.shipping_area
                      : prev.shipping_area,
                  shipping_house_no:
                    typeof payload.new.shipping_house_no === "string" || payload.new.shipping_house_no === null
                      ? payload.new.shipping_house_no
                      : prev.shipping_house_no,
                  shipping_street:
                    typeof payload.new.shipping_street === "string" || payload.new.shipping_street === null
                      ? payload.new.shipping_street
                      : prev.shipping_street,
                  total_amount:
                    typeof payload.new.total_amount === "number"
                      ? payload.new.total_amount
                      : prev.total_amount,
                }
              : null,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  useEffect(() => {
    const checkRating = async () => {
    if (!order?.id || order.delivery_status !== "delivered") {
      return;
    }

      const { data, error } = await supabase
        .from("agent_ratings")
        .select("id")
        .eq("order_id", order.id)
        .single();

      if (data && !error) {
        setHasRated(true);
      }
    };

    checkRating();
  }, [order?.id, order?.delivery_status]);

  const handleRate = async () => {
    if (!order || rating === 0 || !order.agent_id) {
      setRatingError("This delivery is not ready for rating yet.");
      return;
    }

    setSubmittingRating(true);
    setRatingError(null);
    setRatingMessage(null);

    if (order.delivery_status !== "delivered") {
      setRatingError("You can rate the delivery after the order is marked delivered.");
      setSubmittingRating(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRatingError("Please sign in again before sending your review.");
      setSubmittingRating(false);
      return;
    }

    const { error } = await supabase.from("agent_ratings").upsert(
      {
        order_id: order.id,
        agent_id: order.agent_id,
        user_id: user.id,
        rating,
      },
      {
        onConflict: "order_id",
      },
    );

    if (error) {
      setRatingError(
        error.message === "new row violates row-level security policy"
          ? "Only the customer who placed this order can submit a delivery rating."
          : error.message,
      );
      setSubmittingRating(false);
      return;
    }

    setHasRated(true);
    setRatingMessage("Thanks. Your delivery rating has been saved.");
    setSubmittingRating(false);
  };

  const handleCancelOrder = async () => {
    if (!order) {
      return;
    }

    setCancelling(true);
    setCancelError(null);

    const { data, error } = await supabase.rpc("cancel_order_before_cutoff", {
      p_order_id: order.id,
    });

    if (error) {
      setCancelError(
        error.message === "CANCELLATION_WINDOW_CLOSED"
          ? "This batch is already locked. Morning orders close at 7:59 AM IST and Evening orders close at 2:59 PM IST."
          : error.message.replaceAll("_", " "),
      );
      setCancelling(false);
      return;
    }

    setOrder((prev) => (prev ? { ...prev, ...data } : prev));
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-40 animate-pulse rounded-[2.5rem] bg-white/70" />
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.7fr]">
            <div className="h-[28rem] animate-pulse rounded-[2.5rem] bg-white/70" />
            <div className="h-[24rem] animate-pulse rounded-[2.5rem] bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center bg-[var(--background)] px-4">
        <div className="max-w-lg rounded-[2.75rem] border border-[var(--line-soft)] bg-white/78 p-10 text-center shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
          <div className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[rgba(255,216,77,0.2)] text-[var(--accent-deep)]">
            <Package className="h-12 w-12" />
          </div>
          <h1 className="mt-6 font-body text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--forest-950)]">
            {errorStatus === 403 ? "Access denied" : "Order not found"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--forest-700)] sm:text-base">
            {errorStatus === 403
              ? "This order belongs to a different account."
              : "We could not locate an order with that ID."}
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="mt-8 rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white"
          >
            View my orders
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = Math.max(
    steps.findIndex((step) => step.status === order.delivery_status),
    0,
  );
  const isCancelled =
    order.status === "cancelled" || order.delivery_status === "cancelled";
  const canCancel =
    !isCancelled &&
    order.delivery_status !== "out_for_delivery" &&
    order.delivery_status !== "delivered";

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest-700)] hover:text-[var(--forest-950)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </button>

        <section className="mt-8 rounded-[2.75rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_24px_55px_rgba(33,55,47,0.06)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="vitzo-kicker">Order #{order.id.slice(0, 8)}</p>
              <h1 className="mt-3 font-body text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--forest-950)]">
                Track the grocery run in real time.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--forest-700)] sm:text-base">
                {isCancelled
                  ? "This order was cancelled before the delivery batch closed."
                  : steps[currentStepIndex].description}
              </p>
            </div>

            <div className="space-y-3">
              {order.delivery_status === "out_for_delivery" && order.delivery_pin && (
                <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,216,77,0.96)_0%,rgba(242,106,46,0.88)_100%)] px-6 py-5 text-center text-[var(--forest-950)] shadow-[0_18px_35px_rgba(242,106,46,0.16)]">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em]">
                    Delivery pin
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[0.18em]">
                    {order.delivery_pin}
                  </p>
                </div>
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white px-5 text-sm font-semibold text-[var(--forest-950)]"
                >
                  {cancelling ? "Cancelling..." : "Cancel before batch cut-off"}
                </button>
              )}
            </div>
          </div>

          {cancelError && (
            <div className="mt-6 rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(242,106,46,0.08)] px-4 py-3 text-sm text-[var(--forest-950)]">
              {cancelError}
            </div>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const active = index <= currentStepIndex;
              const current = index === currentStepIndex;

              return (
                <div
                  key={step.label}
                  className={`rounded-[2rem] border p-5 ${
                    current
                      ? "border-[var(--accent-deep)] bg-[rgba(242,106,46,0.08)]"
                      : active
                        ? "border-[rgba(125,207,89,0.4)] bg-[rgba(125,207,89,0.12)]"
                        : "border-[var(--line-soft)] bg-white/60"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      current
                        ? "text-[var(--accent-deep)]"
                        : active
                          ? "text-[var(--accent-fresh)]"
                          : "text-[var(--forest-700)]"
                    }`}
                  />
                  <h2 className="mt-4 font-semibold text-[var(--forest-950)]">
                    {step.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--forest-700)]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.7fr]">
          <section className="space-y-8">
            <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_24px_55px_rgba(33,55,47,0.06)] sm:p-8">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[var(--accent-deep)]" />
                <h2 className="font-body text-2xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                  Delivery items
                </h2>
              </div>
              <div className="mt-6 space-y-4">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-[1rem] bg-white">
                        <Image
                          src={item.products?.image_url ?? FALLBACK_IMAGE}
                          alt={item.products?.name ?? "Product"}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--forest-950)]">
                          {item.products?.name ?? "Product unavailable"}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--forest-700)]">
                          Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[var(--forest-950)]">
                      {currencyFormatter.format(item.price_at_time_of_order)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            {order.agents ? (
              <div className="rounded-[2.5rem] bg-[linear-gradient(180deg,var(--forest-950)_0%,#23392f_100%)] p-6 text-white shadow-[0_24px_55px_rgba(24,49,40,0.18)]">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Assigned agent
                </p>
                <div className="mt-5 flex items-center gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                    <User className="h-6 w-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{order.agents.full_name}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-white/75">
                      <Star className="h-4 w-4 fill-[var(--accent)] text-[var(--accent)]" />
                      {order.agents.average_rating ?? "5.0"}
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${order.agents.phone_number}`}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white"
                >
                  <Phone className="h-4 w-4" />
                  Call agent
                </a>
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                  Agent status
                </p>
                <h2 className="mt-3 text-xl font-semibold text-[var(--forest-950)]">
                  Assigning a rider
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--forest-700)]">
                  We are matching the nearest available agent to your grocery order.
                </p>
              </div>
            )}

            <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                Delivery batch
              </p>
              <div className="mt-4 text-sm leading-6 text-[var(--forest-700)]">
                <p className="font-semibold text-[var(--forest-950)]">
                  {order.delivery_batch || "Batch pending"}
                </p>
                <p>
                  {order.delivery_batch_date
                    ? new Date(order.delivery_batch_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Date pending"}
                </p>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                Delivery address
              </p>
              <div className="mt-4 flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 text-[var(--accent-deep)]" />
                <div className="text-sm leading-6 text-[var(--forest-700)]">
                  <p className="font-semibold text-[var(--forest-950)]">
                    {order.shipping_house_no || "Address pending"},{" "}
                    {order.shipping_street || "street pending"}
                  </p>
                  <p>{order.shipping_area || "Area pending"}</p>
                  <p>{order.mobile_number || "Phone pending"}</p>
                </div>
              </div>
            </div>

            {order.delivery_status === "delivered" && (
              <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_24px_55px_rgba(33,55,47,0.06)]">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                  Rate this delivery
                </p>
                {hasRated ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[rgba(125,207,89,0.14)] px-4 py-2 text-sm font-semibold text-[var(--forest-950)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent-fresh)]" />
                    Feedback received
                  </div>
                ) : (
                  <>
                    {ratingError && (
                      <div className="mt-4 rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(242,106,46,0.08)] px-4 py-3 text-sm text-[var(--forest-950)]">
                        {ratingError}
                      </div>
                    )}
                    {ratingMessage && (
                      <div className="mt-4 rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(125,207,89,0.14)] px-4 py-3 text-sm text-[var(--forest-950)]">
                        {ratingMessage}
                      </div>
                    )}
                    <div className="mt-5 flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`transition-transform ${
                            rating >= value
                              ? "scale-110 text-[var(--accent)]"
                              : "text-[var(--line-soft)]"
                          }`}
                        >
                          <Star className={`h-8 w-8 ${rating >= value ? "fill-current" : ""}`} />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleRate}
                      disabled={submittingRating || rating === 0}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {submittingRating ? "Submitting..." : "Submit review"}
                    </button>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
