import { getShops } from "@/lib/supabase/queries";
import { HomeClient } from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const shops = await getShops();
  const { shopId } = await searchParams;

  return (
    <HomeClient
      initialShops={shops}
      initialShopId={shopId ? parseInt(shopId, 10) : undefined}
    />
  );
}
