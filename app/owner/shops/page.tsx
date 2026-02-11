import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOwnerByAuthUserId, getOwnerShopsForList } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { ShopListClient } from "@/app/owner/shops/shop-list-client";

export const dynamic = "force-dynamic";

export default async function OwnerShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/owner/login");
  }

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="container max-w-md mx-auto px-4 py-12">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-foreground">등록된 업장이 없습니다.</p>
              <p className="text-sm text-muted-foreground">
                입점 신청을 먼저 진행해주세요.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/owner/register" className="flex items-center gap-2">
                  <PlusCircle className="size-5" />
                  업장 추가
                </Link>
              </Button>
            </CardContent>
          </Card>
          <div className="mt-6 text-center">
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

  const shops = await getOwnerShopsForList(owner.id);
  const { pending } = await searchParams;

  if (shops.length === 0) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="container max-w-md mx-auto px-4 py-12">
          {pending === "1" && (
            <div className="mb-6 p-4 rounded-xl bg-muted border border-border text-foreground text-sm">
              입점 신청이 완료되었습니다. 운영자 승인 후 업장 목록에서 확인할 수 있습니다.
            </div>
          )}
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-foreground">등록된 업장이 없습니다.</p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/owner/register" className="flex items-center gap-2">
                  <PlusCircle className="size-5" />
                  업장 추가
                </Link>
              </Button>
            </CardContent>
          </Card>
          <div className="mt-6 text-center">
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

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary mb-6">
          업장 관리
        </h1>
        <p className="text-muted-foreground mb-6">
          관리할 업장을 선택하세요.
        </p>

        <ShopListClient shops={shops} />

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/owner/register" className="flex items-center justify-center gap-2">
              <PlusCircle className="size-5" />
              업장 추가
            </Link>
          </Button>
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← 지도로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
