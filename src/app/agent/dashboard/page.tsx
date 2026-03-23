"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Agent {
  id: string;
  user_id: string | null;
  full_name: string;
  status: string | null;
  is_active: boolean | null;
  salary: number | null;
  total_orders: number | null;
  average_rating: number | null;
  working_area: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  products: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  created_at: string | null;
  total_amount: number;
  delivery_status: string | null;
  shipping_house_no: string | null;
  shipping_street: string | null;
  shipping_area: string | null;
  mobile_number: string | null;
  order_items: OrderItem[];
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAgentData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (agentError || !agentData || agentData.status !== "approved") {
        router.push("/agent/register");
        return;
      }

      setAgent(agentData);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
            id,
            created_at,
            total_amount,
            delivery_status,
            shipping_house_no,
            shipping_street,
            shipping_area,
            mobile_number,
            order_items (
              id,
              quantity,
              products (name)
            )
          `,
        )
        .eq("agent_id", agentData.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        setActionError(ordersError.message);
      } else if (ordersData) {
        setOrders(
          ordersData.map((order) => ({
            ...order,
            order_items: order.order_items ?? [],
          })),
        );
      }

      setLoading(false);
    };

    fetchAgentData();
  }, [router]);

  useEffect(() => {
    if (!agent?.id) {
      return;
    }

    const subscription = supabase
      .channel(`agent-orders-${agent.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `agent_id=eq.${agent.id}` },
        (payload) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id
                ? {
                    ...order,
                    delivery_status:
                      typeof payload.new.delivery_status === "string" || payload.new.delivery_status === null
                        ? payload.new.delivery_status
                        : order.delivery_status,
                  }
                : order,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [agent?.id]);

  const toggleActive = async () => {
    if (!agent) {
      return;
    }

    setIsUpdating(true);
    setActionError(null);

    const { data, error } = await supabase
      .from("agents")
      .update({ is_active: !agent.is_active })
      .eq("id", agent.id)
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      setIsUpdating(false);
      return;
    }

    setAgent(data);
    setIsUpdating(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setActionError(null);

    const { error } = await supabase
      .from("orders")
      .update({ delivery_status: status })
      .eq("id", orderId);

    if (error) {
      setActionError(error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, delivery_status: status } : order,
      ),
    );
  };

  const completeDelivery = async (orderId: string) => {
    const enteredPin = pinInputs[orderId]?.trim();

    if (!enteredPin) {
      setActionError("Enter the customer's 4-digit delivery PIN to complete the order.");
      return;
    }

    setIsUpdating(true);
    setActionError(null);

    const { data: success, error } = await supabase.rpc("verify_delivery_pin", {
      p_order_id: orderId,
      p_entered_pin: enteredPin,
    });

    if (error) {
      setActionError(error.message);
      setIsUpdating(false);
      return;
    }

    if (!success) {
      setActionError("Incorrect PIN. Please confirm the code with the customer.");
      setIsUpdating(false);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, delivery_status: "delivered" } : order,
      ),
    );
    setPinInputs((prev) => ({ ...prev, [orderId]: "" }));
    setIsUpdating(false);
  };

  if (loading || !agent) {
    return (
      <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14">
        <div className="mx-auto h-[32rem] max-w-7xl animate-pulse rounded-[2.75rem] bg-white/70" />
      </div>
    );
  }

  const pendingOrders = orders.filter((order) => order.delivery_status !== "delivered");
  const deliveredOrders = orders.filter((order) => order.delivery_status === "delivered");

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2.9rem] bg-[linear-gradient(135deg,#173127_0%,#29463b_48%,#ff9c38_100%)] px-6 py-8 text-white shadow-[0_30px_70px_rgba(23,49,39,0.22)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/65">
                Agent console
              </p>
              <h1 className="mt-3 font-body text-[clamp(2.4rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
                {agent.full_name}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
                Stay online, move orders through pickup and delivery, and keep every customer handoff clean and visible.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricTile label="Earnings" value={currencyFormatter.format(agent.salary ?? 0)} />
                <MetricTile label="Deliveries" value={String(agent.total_orders ?? 0)} />
                <MetricTile label="Rating" value={String(agent.average_rating ?? "5.0")} />
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-white/14 bg-white/10 p-6 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/60">
                    Duty status
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    {agent.is_active ? "You are live for nearby orders" : "You are offline"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    Area: {agent.working_area ?? "Pending approval"}.
                  </p>
                </div>
                <ShieldCheck className="h-10 w-10 text-[rgba(255,216,77,0.95)]" />
              </div>

              <button
                type="button"
                onClick={toggleActive}
                disabled={isUpdating}
                className={`mt-8 inline-flex min-h-14 w-full items-center justify-between rounded-full px-6 text-sm font-semibold transition ${
                  agent.is_active
                    ? "bg-[rgba(125,207,89,0.9)] text-[var(--forest-950)]"
                    : "bg-white text-[var(--forest-950)]"
                } ${isUpdating ? "opacity-70" : ""}`}
              >
                <span>{agent.is_active ? "Go offline" : "Go online"}</span>
                <span
                  className={`h-3 w-3 rounded-full ${
                    agent.is_active ? "bg-[var(--forest-950)]" : "bg-[var(--accent-deep)]"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {actionError && (
          <div className="mt-8 rounded-[1.75rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {actionError}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.7fr]">
          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="vitzo-kicker">Live queue</p>
                <h2 className="mt-2 font-body text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-[var(--forest-950)]">
                  Current delivery runs
                </h2>
              </div>
              <span className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--forest-950)]">
                {pendingOrders.length} active
              </span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="mt-6 rounded-[2.5rem] border border-dashed border-[var(--line-soft)] bg-white/70 p-12 text-center">
                <Truck className="mx-auto h-14 w-14 text-[var(--accent-deep)]" />
                <h3 className="mt-5 text-2xl font-semibold text-[var(--forest-950)]">
                  No active deliveries right now
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--forest-700)]">
                  Keep duty on and the next nearby order will show up here automatically.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {pendingOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[2.4rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_18px_45px_rgba(33,55,47,0.05)]"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-[var(--accent-deep)]" />
                          <div>
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-[var(--forest-950)]">
                              {order.order_items.length} {order.order_items.length === 1 ? "item" : "items"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-[1.75rem] bg-[var(--surface-soft)] p-4">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                              Delivery address
                            </p>
                            <p className="mt-2 font-semibold text-[var(--forest-950)]">
                              {order.shipping_house_no || "Address pending"},{" "}
                              {order.shipping_street || "street pending"}
                            </p>
                            <p className="mt-1 text-sm text-[var(--forest-700)]">
                              {order.shipping_area || "Area pending"}
                            </p>
                          </div>
                          <div className="rounded-[1.75rem] bg-[var(--surface-soft)] p-4">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                              Customer contact
                            </p>
                            <a
                              href={`tel:${order.mobile_number || ""}`}
                              className="mt-2 inline-flex items-center gap-2 font-semibold text-[var(--forest-950)]"
                            >
                              <Phone className="h-4 w-4 text-[var(--accent-deep)]" />
                              {order.mobile_number || "Phone pending"}
                            </a>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {order.order_items.map((item) => (
                            <span
                              key={item.id}
                              className="rounded-full border border-[var(--line-soft)] bg-white px-3 py-2 text-xs font-semibold text-[var(--forest-700)]"
                            >
                              {item.quantity}x {item.products?.name || "Product unavailable"}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="w-full max-w-sm rounded-[2rem] bg-[rgba(255,246,234,0.92)] p-5 lg:w-[20rem]">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                          Delivery control
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--forest-950)]">
                          Status: {order.delivery_status || "pending"}
                        </p>

                        {order.delivery_status === "assigned" && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, "out_for_delivery")}
                            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent-deep)] px-5 text-sm font-semibold text-white"
                          >
                            Start delivery
                          </button>
                        )}

                        {order.delivery_status === "out_for_delivery" && (
                          <>
                            <label className="mt-5 block">
                              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--forest-700)]">
                                Delivery PIN
                              </span>
                              <input
                                type="text"
                                value={pinInputs[order.id] ?? ""}
                                onChange={(event) =>
                                  setPinInputs((prev) => ({
                                    ...prev,
                                    [order.id]: event.target.value.replace(/\D/g, "").slice(0, 4),
                                  }))
                                }
                                placeholder="4-digit code"
                                className="mt-2 h-12 w-full rounded-full border border-[var(--line-soft)] bg-white px-4 text-sm text-[var(--forest-950)] outline-none focus:border-[var(--accent-deep)]"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => completeDelivery(order.id)}
                              disabled={isUpdating}
                              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--forest-950)] px-5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Confirm delivery
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside>
            <div className="rounded-[2.5rem] border border-[var(--line-soft)] bg-white/76 p-6 shadow-[0_18px_45px_rgba(33,55,47,0.05)]">
              <p className="vitzo-kicker">Completed</p>
              <h2 className="mt-2 font-body text-2xl font-semibold tracking-[-0.04em] text-[var(--forest-950)]">
                Recent handoffs
              </h2>

              <div className="mt-5 space-y-4">
                {deliveredOrders.length === 0 ? (
                  <p className="text-sm leading-6 text-[var(--forest-700)]">
                    Completed orders will appear here once you finish your first delivery.
                  </p>
                ) : (
                  deliveredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-[1.8rem] bg-[var(--surface-soft)] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-[var(--forest-950)]">
                            #{order.id.slice(0, 8)}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--forest-700)]">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString("en-IN")
                              : "Recent order"}
                          </p>
                        </div>
                        <p className="font-semibold text-[var(--forest-950)]">
                          {currencyFormatter.format(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/12 bg-white/10 px-5 py-5 backdrop-blur">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/60">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
