import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getOwnerByAuthUserId,
  getOwnerShopIds,
  getShopById,
} from "@/lib/supabase/queries";
import { DashboardClient } from "@/app/owner/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
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
    redirect("/owner/register");
  }

  const shopIds = await getOwnerShopIds(owner.id);
  const { shopId: shopIdParam } = await searchParams;

  let shopId: number | null = null;
  if (shopIdParam) {
    const parsed = parseInt(shopIdParam, 10);
    if (!isNaN(parsed) && shopIds.includes(parsed)) {
      shopId = parsed;
    }
  }
  if (!shopId && shopIds.length > 0) {
    shopId = shopIds[0];
  }

  if (!shopId) {
    redirect("/owner/shops");
  }

  const ownerShop = await getShopById(shopId);
  if (!ownerShop) {
    redirect("/owner/shops");
  }

  return <DashboardClient initialShop={ownerShop} />;
}
