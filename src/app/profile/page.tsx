"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MapPin, Phone, User as UserIcon, Save, AlertCircle } from "lucide-react";

const ALLOWED_AREAS = ["Ramanattukara", "Azhinjilam", "Farook College"];

interface Profile {
  id: string;
  full_name: string;
  mobile_number: string;
  address: string;
  area: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/";
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!profile) return;

    if (profile.area && !ALLOWED_AREAS.includes(profile.area)) {
       setError(`Sorry, we currently only deliver to: ${ALLOWED_AREAS.join(", ")}`);
       setSaving(false);
       return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        mobile_number: profile.mobile_number,
        address: profile.address,
        area: profile.area,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Profile updated successfully!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary-green)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[40px] bg-white shadow-2xl shadow-slate-200">
          {/* Header */}
          <div className="bg-[var(--color-primary-green)] p-12 text-white">
            <div className="flex items-center gap-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-4xl font-black italic backdrop-blur-md">
                {profile?.full_name?.[0] || "?"}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{profile?.full_name || "New User"}</h1>
                <p className="font-bold text-white/70 italic">Premium Member</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-12">
            <div className="space-y-8">
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-500 border border-red-100">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}
              {message && (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-600 border border-emerald-100">
                  <Save className="h-5 w-5" />
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-800 italic flex items-center gap-2">
                    <UserIcon className="h-3 w-3" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile?.full_name || ""}
                    onChange={(e) => profile && setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 placeholder:text-slate-500 outline-none transition-all focus:border-[var(--color-primary-green)] focus:bg-white"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-800 italic flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={profile?.mobile_number || ""}
                    onChange={(e) => profile && setProfile({ ...profile, mobile_number: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 placeholder:text-slate-500 outline-none transition-all focus:border-[var(--color-primary-green)] focus:bg-white"
                    placeholder="+91 00000 00000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-800 italic flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Delivery Area
                </label>
                <select
                  value={profile?.area || ""}
                  onChange={(e) => profile && setProfile({ ...profile, area: e.target.value })}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[var(--color-primary-green)] focus:bg-white appearance-none"
                  required
                >
                  <option value="">Select Area</option>
                  {ALLOWED_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                  <option value="Other">Other (Not available)</option>
                </select>
                <p className="text-[10px] font-bold text-slate-400 mt-1 italic">
                  * We currently only deliver to {ALLOWED_AREAS.join(", ")}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-800 italic flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Detailed Address
                </label>
                <textarea
                  value={profile?.address || ""}
                  onChange={(e) => profile && setProfile({ ...profile, address: e.target.value })}
                  className="w-full h-32 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 placeholder:text-slate-500 outline-none transition-all focus:border-[var(--color-primary-green)] focus:bg-white resize-none"
                  placeholder="House No, Building, Street..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 rounded-3xl bg-slate-900 p-6 text-lg font-black text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Save className="h-6 w-6" />
                    Save Profile Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
