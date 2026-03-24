import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const REFERRAL_COOKIE_KEY = "vitzo_referral_code";

function normalizeReferralCode(value: string | null) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z0-9]{4,32}$/.test(normalized) ? normalized : null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const cookieStore = await cookies();
  const referralCode =
    normalizeReferralCode(requestUrl.searchParams.get("ref")) ||
    normalizeReferralCode(cookieStore.get(REFERRAL_COOKIE_KEY)?.value ?? null);
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("next", next);
      loginUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(loginUrl);
    }

    if (referralCode) {
      const { error: referralError } = await supabase.rpc("register_referral", {
        p_referral_code: referralCode,
      });

      if (
        referralError &&
        referralError.message !== "REFERRAL_ALREADY_LINKED"
      ) {
        const redirectUrl = new URL(next, requestUrl.origin);
        redirectUrl.searchParams.set("referral_error", referralError.message);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete(REFERRAL_COOKIE_KEY);
        return response;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("address, city, pincode, phone_number")
        .eq("id", user.id)
        .single();

      const needsOnboarding =
        !profile?.address || !profile.city || !profile.pincode || !profile.phone_number;

      if (needsOnboarding && next !== "/profile") {
        const onboardingUrl = new URL("/profile", requestUrl.origin);
        onboardingUrl.searchParams.set("onboarding", "1");
        onboardingUrl.searchParams.set("next", next);
        const response = NextResponse.redirect(onboardingUrl);
        response.cookies.delete(REFERRAL_COOKIE_KEY);
        return response;
      }
    }
  }

  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "Missing authentication code.");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(`${requestUrl.origin}${next}`);
  response.cookies.delete(REFERRAL_COOKIE_KEY);
  return response;
}
