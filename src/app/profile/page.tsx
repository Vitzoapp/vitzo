"use client";

import type { ElementType, FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, MapPin, Phone, Save, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ALLOWED_AREAS = ["Ramanattukara", "Azhinjilam", "Farook College"];

interface Profile {
  id: string;
  full_name: string | null;
  mobile_number: string | null;
  house_no: string | null;
  street: string | null;
  landmark: string | null;
  area: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/";
        return;
      }

      setUser(session.user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        setProfile({
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || "",
          mobile_number: "",
          house_no: "",
          street: "",
          landmark: "",
          area: "",
        });
      }

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
    } else {
      setMessage("Profile updated successfully.");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center bg-[var(--background)]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent-deep)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2.75rem] bg-[linear-gradient(135deg,rgba(255,216,77,0.96)_0%,rgba(242,106,46,0.88)_100%)] p-8 text-[var(--forest-950)] shadow-[0_30px_65px_rgba(242,106,46,0.18)] sm:p-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white/28 text-3xl font-semibold">
            {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "V"}
          </div>
          <p className="mt-6 vitzo-kicker text-[var(--forest-950)]/70">Account</p>
          <h1 className="mt-3 font-body text-[clamp(2.2rem,4vw,3.6rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            Keep delivery details ready for the next grocery run.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[var(--forest-950)]/78 sm:text-base">
            Save the address once and your checkout flow stays much lighter every time you come back to shop.
          </p>
        </section>

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
      </div>
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
