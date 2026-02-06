import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOwnerIfNotExists } from "@/lib/supabase/queries";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/owner/shops";

  // NEXT_PUBLIC_SITE_URL 우선 사용 (배포 시 localhost 리다이렉트 방지)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        await createOwnerIfNotExists(
        data.user.id,
        data.user.email ?? "",
        (data.user.user_metadata?.name as string) ??
          (data.user.user_metadata?.nickname as string) ??
          data.user.email ??
          "사장님"
        );
      } catch (e) {
        console.error("createOwnerIfNotExists:", e);
      }

      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/owner/login?error=auth`);
}
