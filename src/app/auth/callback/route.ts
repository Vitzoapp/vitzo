import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const referralCode = requestUrl.searchParams.get("ref");
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
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "Missing authentication code.");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
