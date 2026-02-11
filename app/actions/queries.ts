"use server";

import { getShops } from "@/lib/supabase/queries";
import type { Shop } from "@/types/shop";

/** 전체 매장 목록 (TanStack Query용) */
export async function getShopsAction(): Promise<Shop[]> {
  return getShops();
}
