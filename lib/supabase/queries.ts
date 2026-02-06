import type { Shop } from "@/types/shop";
import type { DbShop, DbGachaMachine, DbKujiStatus } from "./types";
import { createClient } from "./server";
import { haversineDistanceMeters } from "@/lib/geo";

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
    closedDays: shop.closed_days ?? undefined,
    representativeImageUrl: shop.representative_image_url ?? undefined,
    promotionalText: shop.promotional_text ?? undefined,
    lastUpdatedAt: shop.last_updated_at ?? undefined,
    status: (shop.status as Shop["status"]) ?? undefined,
    updateSource: (shop.update_source as Shop["updateSource"]) ?? undefined,
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
      imageUrl: k.image_url ?? undefined,
    })),
  };
}

export async function getShops(): Promise<Shop[]> {
  const supabase = await createClient();

  const [shopsRes, gachaRes, kujiRes] = await Promise.all([
    supabase.from("shops").select("*").eq("status", "APPROVED").order("id"),
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
): Promise<{ id: number; email: string; name: string; role?: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("owners")
    .select("id, email, name, role")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !data) return null;
  return data as { id: number; email: string; name: string; role?: string };
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

/** 근처 매장 조회 (거리 기준 필터, APPROVED만) */
export async function getNearbyShops(
  lat: number,
  lng: number,
  radiusM = 50
): Promise<Shop[]> {
  const supabase = await createClient();

  const [shopsRes, gachaRes, kujiRes] = await Promise.all([
    supabase.from("shops").select("*").eq("status", "APPROVED").order("id"),
    supabase.from("gacha_machines").select("*"),
    supabase.from("kuji_statuses").select("*"),
  ]);

  if (shopsRes.error) {
    console.error("getNearbyShops error:", shopsRes.error);
    return [];
  }

  const shops = (shopsRes.data ?? []) as DbShop[];
  const gachaMachines = (gachaRes.data ?? []) as DbGachaMachine[];
  const kujiStatuses = (kujiRes.data ?? []) as DbKujiStatus[];

  const nearby = shops.filter((shop) => {
    const dist = haversineDistanceMeters(lat, lng, shop.lat, shop.lng);
    return dist <= radiusM;
  });

  return nearby.map((shop) =>
    mapShop(
      shop,
      gachaMachines.filter((g) => g.shop_id === shop.id),
      kujiStatuses.filter((k) => k.shop_id === shop.id)
    )
  );
}

/** PENDING 상태 매장 목록 (운영자 승인 대기) */
export async function getPendingShops(): Promise<Shop[]> {
  const supabase = await createClient();

  const [shopsRes, gachaRes, kujiRes] = await Promise.all([
    supabase.from("shops").select("*").eq("status", "PENDING").order("created_at", { ascending: false }),
    supabase.from("gacha_machines").select("*"),
    supabase.from("kuji_statuses").select("*"),
  ]);

  if (shopsRes.error) return [];
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

export interface PendingClaim {
  id: number;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  shopId: number;
  shopName: string;
  status: string;
  createdAt: string;
}

/** PENDING 클레임 목록 */
export async function getPendingClaims(): Promise<PendingClaim[]> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase
    .from("shop_claims")
    .select("id, owner_id, shop_id, status, created_at")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  if (claimsError || !claimsData?.length) return [];

  const ownerIds = [...new Set(claimsData.map((c) => c.owner_id))];
  const shopIds = [...new Set(claimsData.map((c) => c.shop_id))];

  const [ownersRes, shopsRes] = await Promise.all([
    supabase.from("owners").select("id, name, email").in("id", ownerIds),
    supabase.from("shops").select("id, name").in("id", shopIds),
  ]);

  const owners = (ownersRes.data ?? []) as { id: number; name: string; email: string }[];
  const shops = (shopsRes.data ?? []) as { id: number; name: string }[];
  const ownerMap = Object.fromEntries(owners.map((o) => [o.id, o]));
  const shopMap = Object.fromEntries(shops.map((s) => [s.id, s]));

  return claimsData.map((c) => {
    const owner = ownerMap[c.owner_id];
    const shop = shopMap[c.shop_id];
    return {
      id: c.id,
      ownerId: c.owner_id,
      ownerName: owner?.name ?? "",
      ownerEmail: owner?.email ?? "",
      shopId: c.shop_id,
      shopName: shop?.name ?? "",
      status: c.status,
      createdAt: c.created_at,
    };
  });
}

export interface PendingRegistration {
  id: number;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  shopId: number;
  shopName: string;
  address: string | null;
  status: string;
  createdAt: string;
}

/** PENDING 신규 등록 요청 목록 */
export async function getPendingRegistrations(): Promise<PendingRegistration[]> {
  const supabase = await createClient();

  const { data: reqsData, error } = await supabase
    .from("shop_registration_requests")
    .select("id, owner_id, shop_id, status, created_at")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  if (error || !reqsData?.length) return [];

  const ownerIds = [...new Set(reqsData.map((r) => r.owner_id))];
  const shopIds = [...new Set(reqsData.map((r) => r.shop_id))];

  const [ownersRes, shopsRes] = await Promise.all([
    supabase.from("owners").select("id, name, email").in("id", ownerIds),
    supabase.from("shops").select("id, name, address").in("id", shopIds),
  ]);

  const owners = (ownersRes.data ?? []) as { id: number; name: string; email: string }[];
  const shops = (shopsRes.data ?? []) as { id: number; name: string; address: string | null }[];
  const ownerMap = Object.fromEntries(owners.map((o) => [o.id, o]));
  const shopMap = Object.fromEntries(shops.map((s) => [s.id, s]));

  return reqsData.map((r) => {
    const owner = ownerMap[r.owner_id];
    const shop = shopMap[r.shop_id];
    return {
      id: r.id,
      ownerId: r.owner_id,
      ownerName: owner?.name ?? "",
      ownerEmail: owner?.email ?? "",
      shopId: r.shop_id,
      shopName: shop?.name ?? "",
      address: shop?.address ?? null,
      status: r.status,
      createdAt: r.created_at,
    };
  });
}
