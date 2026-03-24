"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const IST_OFFSET_MINUTES = 330;

function getIstDateParts(now: Date) {
  const istDate = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);

  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    date: istDate.getUTCDate(),
    hours: istDate.getUTCHours(),
    minutes: istDate.getUTCMinutes(),
  };
}

function createUtcFromIstParts(
  year: number,
  month: number,
  date: number,
  hours: number,
  minutes = 0,
  seconds = 0,
) {
  return new Date(
    Date.UTC(year, month, date, hours, minutes, seconds) -
      IST_OFFSET_MINUTES * 60 * 1000,
  );
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState("");
  const [currentBatch, setCurrentBatch] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const timer = setInterval(() => {
      const now = new Date();
      const { year, month, date, hours, minutes } = getIstDateParts(now);
      let targetTime: Date;
      let batchLabel = "";
      let deliveryTime = "";

      if (hours < 8 || (hours === 8 && minutes === 0)) {
        targetTime = createUtcFromIstParts(year, month, date, 8, 0, 0);
        batchLabel = "Morning Batch";
        deliveryTime = "10:00 AM";
      } else if (hours < 15 || (hours === 15 && minutes === 0)) {
        targetTime = createUtcFromIstParts(year, month, date, 15, 0, 0);
        batchLabel = "Evening Batch";
        deliveryTime = "5:00 PM";
      } else {
        targetTime = createUtcFromIstParts(year, month, date + 1, 8, 0, 0);
        batchLabel = "Next Morning Batch";
        deliveryTime = "10:00 AM (Tomorrow)";
      }

      const diff = Math.max(targetTime.getTime() - now.getTime(), 0);
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
      setCurrentBatch(`${batchLabel} • Delivery at ${deliveryTime}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col space-y-4 opacity-0">
        <div className="h-10 w-48 animate-pulse rounded-full bg-white/10" />
        <div className="h-20 w-64 animate-pulse rounded-3xl bg-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md sm:text-sm">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="break-words">{currentBatch}</span>
      </div>

      <div className="flex w-fit items-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            Closing In
          </span>
          <span className="font-mono text-3xl font-black tracking-tighter text-white">
            {timeLeft}
          </span>
        </div>
        <div className="h-10 w-px bg-white/20" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            Status
          </span>
          <span className="text-sm font-black uppercase text-[var(--color-secondary-green)]">
            Open Now
          </span>
        </div>
      </div>
    </div>
  );
}
