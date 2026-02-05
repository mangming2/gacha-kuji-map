import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOwnerByAuthUserId, getOwnerShopsForList } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OwnerShopsPage() {
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
      <div className="min-h-screen bg-emerald-50/50">
        <div className="container max-w-md mx-auto px-4 py-12">
          <Card className="bg-amber-50/80 border-amber-200">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-amber-800">등록된 업장이 없습니다.</p>
              <p className="text-sm text-amber-700">
                입점 신청을 먼저 진행해주세요.
              </p>
              <Button asChild className="bg-amber-700 hover:bg-amber-800">
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

  if (shops.length === 0) {
    return (
      <div className="min-h-screen bg-emerald-50/50">
        <div className="container max-w-md mx-auto px-4 py-12">
          <Card className="bg-amber-50/80 border-amber-200">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-amber-800">등록된 업장이 없습니다.</p>
              <Button asChild className="bg-amber-700 hover:bg-amber-800">
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
    <div className="min-h-screen bg-emerald-50/50">
      <div className="container max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-emerald-800 mb-6">
          업장 관리
        </h1>
        <p className="text-muted-foreground mb-6">
          관리할 업장을 선택하세요.
        </p>

        <div className="space-y-3">
          {shops.map((shop) => (
            <Link key={shop.id} href={`/owner/dashboard?shopId=${shop.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <Store className="size-5 text-emerald-600" />
                  <span className="font-medium">{shop.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

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
