"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Agent {
  id: string;
  full_name: string;
  working_area: string | null;
  status: string | null;
}

export default function AgentWaitingPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!data) {
        router.push("/agent/register");
        return;
      }

      if (data.status === "approved") {
        router.push("/agent/dashboard");
        return;
      }

      setAgent(data);
      setLoading(false);
    };

    fetchAgent();
    const interval = setInterval(fetchAgent, 10000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading || !agent) {
    return (
      <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14">
        <div className="mx-auto h-[28rem] max-w-3xl animate-pulse rounded-[2.75rem] bg-white/70" />
      </div>
    );
  }

  const isTerminated = agent.status === "terminated";

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2.75rem] border border-[var(--line-soft)] bg-white/78 p-10 text-center shadow-[0_24px_55px_rgba(33,55,47,0.06)] sm:p-14">
        <div
          className={`mx-auto inline-flex h-24 w-24 items-center justify-center rounded-[2rem] ${
            isTerminated
              ? "bg-[rgba(242,106,46,0.12)] text-[var(--accent-deep)]"
              : "bg-[linear-gradient(135deg,rgba(255,216,77,0.28),rgba(242,106,46,0.18))] text-[var(--accent-deep)]"
          }`}
        >
          {isTerminated ? (
            <XCircle className="h-12 w-12" />
          ) : (
            <Clock className="h-12 w-12" />
          )}
        </div>

        <p className="mt-8 vitzo-kicker">Agent application</p>
        <h1 className="mt-3 font-body text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--forest-950)]">
          {isTerminated ? "Application closed" : "Application under review"}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--forest-700)] sm:mx-auto sm:text-base">
          {isTerminated
            ? "Your current application has been closed. Contact support if you need more details."
            : "Our team is reviewing your details. This page refreshes automatically and will move you into the dashboard when approval is complete."}
        </p>

        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-[1.75rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
              Applicant
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--forest-950)]">
              {agent.full_name}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
              Working area
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--forest-950)]">
              {agent.working_area || "Area pending"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
