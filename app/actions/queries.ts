"use server";

import { getShops } from "@/lib/supabase/queries";
import { getCurrentOwnerShops } from "./owner";
import type { Shop } from "@/types/shop";

/** 전체 매장 목록 (TanStack Query용) */
export async function getShopsAction(): Promise<Shop[]> {
  return getShops();
}

/** 현재 로그인한 사용자의 업장 목록 (TanStack Query용) */
export async function getOwnerShopsAction(): Promise<
  { id: number; name: string }[]
> {
  return getCurrentOwnerShops();
}
