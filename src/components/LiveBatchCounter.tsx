"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Flame, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BatchSnapshot {
  active_orders: number;
  batch_date: string;
  delivery_batch: string;
}

function getBatchConfig(snapshot: BatchSnapshot) {
  const isMorning = snapshot.delivery_batch === "Morning";
  const cutoffTime = isMorning ? "07:59:59" : "14:59:59";
  const deliveryTime = isMorning ? "13:00:00" : "20:00:00";

  return {
    closesLabel: isMorning ? "Closes 7:59 AM IST" : "Closes 2:59 PM IST",
    deliveryLabel: isMorning ? "Expected by 1:00 PM" : "Expected by 8:00 PM",
    cutoffDate: new Date(`${snapshot.batch_date}T${cutoffTime}+05:30`),
    deliveryDate: new Date(`${snapshot.batch_date}T${deliveryTime}+05:30`),
  };
}

function formatCountdown(target: Date) {
  const diff = target.getTime() - Date.now();

  if (diff <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export default function LiveBatchCounter({
  initialSnapshot,
}: {
  initialSnapshot: BatchSnapshot | null;
}) {
  const [snapshot, setSnapshot] = useState<BatchSnapshot | null>(initialSnapshot);
  const [pulse, setPulse] = useState(false);
  const [countdown, setCountdown] = useState(
    initialSnapshot ? formatCountdown(getBatchConfig(initialSnapshot).cutoffDate) : "00:00:00",
  );

  const batchConfig = useMemo(
    () => (snapshot ? getBatchConfig(snapshot) : null),
    [snapshot],
  );

  useEffect(() => {
    if (!batchConfig) {
      return;
    }

    setCountdown(formatCountdown(batchConfig.cutoffDate));

    const intervalId = window.setInterval(() => {
      setCountdown(formatCountdown(batchConfig.cutoffDate));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [batchConfig]);

  useEffect(() => {
    const refreshSnapshot = async () => {
      const { data } = await supabase.rpc("get_current_batch_snapshot");
      const nextSnapshot = data?.[0] ?? null;

      setSnapshot((current) => {
        if (nextSnapshot && current && nextSnapshot.active_orders !== current.active_orders) {
          setPulse(true);
          window.setTimeout(() => setPulse(false), 700);
        }

        return nextSnapshot;
      });
    };

    const channel = supabase
      .channel("homepage-batch-counter")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refreshSnapshot)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!snapshot || !batchConfig) {
    return null;
  }

  return (
    <div className="animate-reveal animation-delay-450 rounded-[2.5rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.08)_100%)] p-6 text-white shadow-[0_28px_55px_rgba(24,49,40,0.18)] backdrop-blur md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/58">
            Live batch timing
          </p>
          <h2 className="mt-3 font-body text-[clamp(1.9rem,2.8vw,2.8rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-white">
            {snapshot.delivery_batch} Batch
          </h2>
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,216,77,0.18)] text-[var(--accent)]">
          <Flame className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-6 rounded-[2rem] border border-white/12 bg-[rgba(24,49,40,0.28)] px-5 py-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/58">
          Countdown to batch lock
        </p>
        <p
          className={`mt-3 font-display text-[clamp(3rem,6vw,4.8rem)] leading-[0.88] tracking-[0.14em] text-[var(--accent)] transition-transform duration-500 ${
            pulse ? "scale-105" : ""
          }`}
        >
          {countdown}
        </p>
        <p className="mt-2 text-sm font-semibold text-white/72">
          {batchConfig.closesLabel}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.8rem] border border-white/12 bg-white/8 px-4 py-4">
          <div className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/56">
            <Truck className="h-3.5 w-3.5 text-[var(--accent)]" />
            Delivery window
          </div>
          <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">
            {batchConfig.deliveryLabel}
          </p>
          <p className="mt-1 text-sm text-white/68">
            {batchConfig.deliveryDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>

        <div className="rounded-[1.8rem] border border-white/12 bg-white/8 px-4 py-4">
          <div className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/56">
            <Clock3 className="h-3.5 w-3.5 text-[var(--accent)]" />
            Orders already in
          </div>
          <p
            className={`mt-3 text-lg font-semibold tracking-[-0.03em] text-white transition-transform duration-500 ${
              pulse ? "scale-105 text-[var(--accent)]" : ""
            }`}
          >
            {snapshot.active_orders} shoppers in this run
          </p>
          <p className="mt-1 text-sm text-white/68">
            Live count updates as this batch fills.
          </p>
        </div>
      </div>
    </div>
  );
}
