import { getShops } from "@/lib/supabase/queries";
import { HomeClient } from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const shops = await getShops();

  return <HomeClient initialShops={shops} />;
}
