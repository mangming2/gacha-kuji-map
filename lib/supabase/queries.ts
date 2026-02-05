import type { Shop } from "@/types/shop";
import type { DbShop, DbGachaMachine, DbKujiStatus } from "./types";
import { createClient } from "./server";

function mapShop(
  shop: DbShop,
  gachaMachines: DbGachaMachine[],
  kujiStatuses: DbKujiStatus[]
): Shop {
  return {
    id: shop.id,
    name: shop.name,
    type: shop.type,
    position: [shop.lat, shop.lng],
    address: shop.address ?? undefined,
    stockStatus: shop.stock_status ?? undefined,
    isOpen: shop.is_open,
    businessHours: shop.business_hours,
    representativeImageUrl: shop.representative_image_url ?? undefined,
    promotionalText: shop.promotional_text ?? undefined,
    lastUpdatedAt: shop.last_updated_at ?? undefined,
    gachaMachines: gachaMachines.map((g) => ({
      id: g.id,
      name: g.name,
      series: g.series,
      stock: g.stock,
      imageUrl: g.image_url ?? undefined,
    })),
    kujiStatuses: kujiStatuses.map((k) => ({
      id: k.id,
      name: k.name,
      status: k.status,
      stock: k.stock ?? undefined,
      gradeStatus: Array.isArray(k.grade_status) ? k.grade_status : [],
    })),
  };
}

export async function getShops(): Promise<Shop[]> {
  const supabase = await createClient();

  const [shopsRes, gachaRes, kujiRes] = await Promise.all([
    supabase.from("shops").select("*").order("id"),
    supabase.from("gacha_machines").select("*"),
    supabase.from("kuji_statuses").select("*"),
  ]);

  if (shopsRes.error) {
    console.error("getShops error:", shopsRes.error);
    return [];
  }

  const shops = (shopsRes.data ?? []) as DbShop[];
  const gachaMachines = (gachaRes.data ?? []) as DbGachaMachine[];
  const kujiStatuses = (kujiRes.data ?? []) as DbKujiStatus[];

  return shops.map((shop) =>
    mapShop(
      shop,
      gachaMachines.filter((g) => g.shop_id === shop.id),
      kujiStatuses.filter((k) => k.shop_id === shop.id)
    )
  );
}

export async function getShopById(id: number): Promise<Shop | null> {
  const supabase = await createClient();

  const [shopRes, gachaRes, kujiRes] = await Promise.all([
    supabase.from("shops").select("*").eq("id", id).single(),
    supabase.from("gacha_machines").select("*").eq("shop_id", id),
    supabase.from("kuji_statuses").select("*").eq("shop_id", id),
  ]);

  if (shopRes.error || !shopRes.data) {
    return null;
  }

  return mapShop(
    shopRes.data as DbShop,
    (gachaRes.data ?? []) as DbGachaMachine[],
    (kujiRes.data ?? []) as DbKujiStatus[]
  );
}

export async function getOwnerShopIds(ownerId: number): Promise<number[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_owners")
    .select("shop_id")
    .eq("owner_id", ownerId);

  if (error) return [];
  return (data ?? []).map((r) => r.shop_id);
}

/** auth.users.id로 owner 조회 */
export async function getOwnerByAuthUserId(
  authUserId: string
): Promise<{ id: number; email: string; name: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("owners")
    .select("id, email, name")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !data) return null;
  return data as { id: number; email: string; name: string };
}

/** 로그인 시 owner가 없으면 생성 (auth callback에서 호출) */
export async function createOwnerIfNotExists(
  authUserId: string,
  email: string,
  name: string
): Promise<void> {
  const supabase = await createClient();
  const existing = await getOwnerByAuthUserId(authUserId);
  if (existing) return;

  await supabase.from("owners").insert({
    auth_user_id: authUserId,
    email: email || "unknown@example.com",
    name: name || "사장님",
  });
}

/** owner의 업장 목록 (id, name만) */
export async function getOwnerShopsForList(ownerId: number): Promise<{ id: number; name: string }[]> {
  const supabase = await createClient();

  const shopIds = await getOwnerShopIds(ownerId);
  if (shopIds.length === 0) return [];

  const { data, error } = await supabase
    .from("shops")
    .select("id, name")
    .in("id", shopIds);

  if (error) return [];
  return (data ?? []) as { id: number; name: string }[];
}
