"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { HelpCircle, Heart } from "lucide-react";

export default function OwnerLoginPage() {
  const handleKakaoLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
        // account_email은 비즈앱에서만 지원 - 일반 앱은 profile만 요청
        scopes: "profile_nickname profile_image",
      },
    });
    if (error) {
      alert(`로그인 실패: ${error.message}`);
      return;
    }
    // signInWithOAuth가 리다이렉트하므로 아래 코드는 실행되지 않음
  };
  return (
    <div className="min-h-screen bg-emerald-50/50">
      <div className="container max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-800">사장님 전용</h1>
          <p className="text-emerald-600 mt-1">가챠·쿠지 맵 재고 관리 페이지</p>
        </div>

        <Card className="bg-amber-50/80 border-amber-200">
          <CardContent className="pt-6 space-y-4">
            {/* <Button
              variant="outline"
              className="w-full h-12 bg-white border-gray-200 justify-start gap-3"
              onClick={() => alert("Google 로그인 준비 중입니다.")}
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 시작하기
            </Button> */}

            <Button
              className="w-full h-12 bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 justify-start gap-3"
              onClick={handleKakaoLogin}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
              </svg>
              카카오로 시작하기
            </Button>

            {/* <Button
              className="w-full h-12 bg-[#03C75A] text-white hover:bg-[#03C75A]/90 justify-start gap-3"
              onClick={() => alert("네이버 로그인 준비 중입니다.")}
            >
              <span className="flex items-center justify-center size-5 bg-white text-[#03C75A] rounded-sm font-bold text-xs">
                N
              </span>
              네이버로 시작하기
            </Button> */}

            <div className="pt-4 border-t border-amber-200">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <HelpCircle className="size-4 shrink-0" />
                <span>로그인 문제가 있으신가요?</span>
              </div>
              <button
                type="button"
                className="mt-2 text-sm text-blue-600 hover:underline"
                onClick={() => alert("카카오톡 1:1 문의 준비 중입니다.")}
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
            className="bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200"
            onClick={() => alert("개발자 응원하기 준비 중입니다.")}
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
