"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BatchSnapshot {
  active_orders: number;
  batch_date: string;
  delivery_batch: string;
}

export default function LiveBatchCounter({
  initialSnapshot,
}: {
  initialSnapshot: BatchSnapshot | null;
}) {
  const [snapshot, setSnapshot] = useState<BatchSnapshot | null>(initialSnapshot);
  const [pulse, setPulse] = useState(false);

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

  if (!snapshot) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/10 px-4 py-3 text-sm text-white/92 backdrop-blur">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,216,77,0.18)] text-[var(--accent)]">
        <Flame className="h-4.5 w-4.5" />
      </span>
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/62">
          Live batch
        </p>
        <p
          className={`font-semibold tracking-[-0.03em] transition-transform duration-500 ${
            pulse ? "scale-110 text-[var(--accent)]" : ""
          }`}
        >
          {snapshot.active_orders} orders in the {snapshot.delivery_batch} Batch
        </p>
      </div>
    </div>
  );
}
