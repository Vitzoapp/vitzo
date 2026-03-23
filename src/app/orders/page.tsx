"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Package, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  created_at: string | null;
  total_amount: number;
  status: string | null;
  delivery_status: string | null;
  order_items: {
    id: string;
    quantity: number;
    price_at_time_of_order: number;
    products: {
      name: string;
      image_url: string | null;
    } | null;
  }[];
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            *,
            products (name, image_url)
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)]">
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <section className="border-b border-[var(--line-soft)] pb-10">
          <p className="vitzo-kicker">Order history</p>
          <h1 className="mt-3 max-w-3xl font-body text-[clamp(2.4rem,5vw,4.3rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--forest-950)]">
            Every grocery run, in one warm and readable timeline.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--forest-700)] sm:text-base">
            Track recent baskets, delivery status, and what you spent without losing the same storefront feel as the homepage.
          </p>
        </section>

        {loading ? (
          <div className="space-y-4 pt-10">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[2.25rem] bg-white/70"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/64 px-6 py-16 text-center">
            <Package className="mx-auto h-14 w-14 text-[var(--accent-deep)]" />
            <h2 className="mt-5 font-body text-3xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
              No orders yet
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--forest-700)]">
              Start with the homepage shelves and we&apos;ll keep your order history here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5 pt-10">
            {orders.map((order) => {
              const delivered = order.delivery_status === "delivered";

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block rounded-[2.25rem] border border-[var(--line-soft)] bg-white/76 p-6 shadow-[0_18px_45px_rgba(33,55,47,0.05)] transition-transform duration-300 hover:-translate-y-1 sm:p-8"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--accent-deep)]">
                        {delivered ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Truck className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <h2 className="mt-2 font-body text-2xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                          {order.order_items.length}{" "}
                          {order.order_items.length === 1 ? "item" : "items"}
                        </h2>
                        <p className="mt-2 text-sm text-[var(--forest-700)]">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Recently placed"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 border-t border-[var(--line-soft)] pt-5 sm:border-t-0 sm:pt-0">
                      <div className="text-right">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                          {delivered ? "Delivered" : order.delivery_status || "Processing"}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-[var(--forest-950)]">
                          {currencyFormatter.format(order.total_amount)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[var(--forest-700)] transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
