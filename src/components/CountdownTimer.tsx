"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState("");
  const [currentBatch, setCurrentBatch] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      const targetTime = new Date();
      let batchLabel = "";
      let deliveryTime = "";

      if (hours < 11 || (hours === 11 && minutes === 0)) {
        // Morning Batch
        targetTime.setHours(11, 0, 0);
        batchLabel = "Morning Batch";
        deliveryTime = "1:00 PM";
      } else if (hours < 18 || (hours === 18 && minutes === 0)) {
        // Evening Batch
        targetTime.setHours(18, 0, 0);
        batchLabel = "Evening Batch";
        deliveryTime = "8:00 PM";
      } else {
        // Next Day Morning
        targetTime.setDate(now.getDate() + 1);
        targetTime.setHours(11, 0, 0);
        batchLabel = "Next Morning Batch";
        deliveryTime = "1:00 PM (Tomorrow)";
      }

      const diff = targetTime.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      setCurrentBatch(`${batchLabel} • Delivery at ${deliveryTime}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col space-y-4 opacity-0">
        <div className="h-10 w-48 bg-white/10 rounded-full animate-pulse" />
        <div className="h-20 w-64 bg-white/10 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="inline-flex items-center flex-wrap rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-[10px] sm:text-sm font-black uppercase tracking-widest italic text-white border border-white/30 gap-2">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="break-words">{currentBatch}</span>
      </div>
      
      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl w-fit">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Closing In</span>
          <span className="text-3xl font-black text-white font-mono tracking-tighter">{timeLeft}</span>
        </div>
        <div className="h-10 w-[1px] bg-white/20" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Status</span>
          <span className="text-sm font-black text-[var(--color-secondary-green)] uppercase italic">Open Now</span>
        </div>
      </div>
    </div>
  );
}
