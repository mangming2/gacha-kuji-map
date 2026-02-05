import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOwnerIfNotExists } from "@/lib/supabase/queries";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/owner/shops";

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

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/owner/login?error=auth`);
}
