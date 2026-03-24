"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const REFERRAL_STORAGE_KEY = "vitzo_referral_code";
const REFERRAL_COOKIE_KEY = "vitzo_referral_code";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function isValidReferralCode(value: string) {
  return /^[A-Z0-9]{4,32}$/.test(value);
}

export default function ReferralAttribution() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const referralCode = searchParams.get("ref")?.trim().toUpperCase();

    if (!referralCode || !isValidReferralCode(referralCode)) {
      return;
    }

    window.localStorage.setItem(REFERRAL_STORAGE_KEY, referralCode);
    document.cookie = `${REFERRAL_COOKIE_KEY}=${encodeURIComponent(referralCode)}; path=/; max-age=${REFERRAL_COOKIE_MAX_AGE}; samesite=lax`;
  }, [searchParams]);

  return null;
}
