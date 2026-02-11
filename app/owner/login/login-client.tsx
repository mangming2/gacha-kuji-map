"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { HelpCircle, Heart, Loader2 } from "lucide-react";

export function OwnerLoginClient() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/owner/shops";
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = async () => {
    setLoading(true);
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: callbackUrl,
        scopes: "profile_nickname profile_image",
      },
    });
    if (error) {
      setLoading(false);
      toast.error(`로그인 실패: ${error.message}`);
      return;
    }
  };
  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">가챠·쿠지 맵</h1>
          <p className="text-muted-foreground mt-1">로그인 후 매장 제보·관리를 이용하세요</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <Button
              className="w-full h-12 bg-hero-gold text-hero-black hover:bg-hero-gold-soft justify-start gap-3"
              onClick={handleKakaoLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
                  </svg>
                  카카오로 시작하기
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HelpCircle className="size-4 shrink-0" />
                <span>로그인 문제가 있으신가요?</span>
              </div>
              <button
                type="button"
                className="mt-2 text-sm text-blue-600 hover:underline"
                onClick={() => toast.info("카카오톡 1:1 문의 준비 중입니다.")}
              >
                카카오톡 1:1 문의하기
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            가챠·쿠지 맵이 도움이 되셨나요?
          </p>
          <Button
            variant="outline"
            className="bg-secondary border-border text-secondary-foreground hover:bg-secondary/90"
            onClick={() => toast.info("개발자 응원하기 준비 중입니다.")}
          >
            <Heart className="size-4 mr-2 fill-current" />
            개발자에게 가챠하나 선물하기
          </Button>
        </div>

        <div className="mt-8 flex flex-col gap-2 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 지도로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
