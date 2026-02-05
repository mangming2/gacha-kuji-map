"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOwnerByAuthUserId,
  getOwnerShopsForList,
} from "@/lib/supabase/queries";

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;

/** 주소 → 위경도 변환 (클라이언트에서 주소 선택 시 호출 가능) */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; ok: boolean }> {
  const key =
    process.env.KAKAO_REST_API_KEY ?? process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!key || !address.trim()) {
    return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, ok: false };
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    );
    const data = await res.json();
    if (data.error?.message) {
      console.error("geocodeAddress API error:", data.error);
      return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, ok: false };
    }
    const doc = data.documents?.[0];
    if (doc?.y && doc?.x) {
      return {
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
        ok: true,
      };
    }
  } catch (e) {
    console.error("geocodeAddress:", e);
  }
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, ok: false };
}

export type ShopType = "GACHA" | "KUJI" | "BOTH";

export interface RegisterShopInput {
  shopName: string;
  shopType: ShopType;
  email: string;
  phone?: string;
  address: string;
  detailAddress?: string;
  businessNumber: string;
  /** 주소 검색으로 얻은 좌표 (있으면 사용, 없으면 서버에서 재시도) */
  lat?: number;
  lng?: number;
}

/** 입점 신청: shops + shop_owners에 저장 */
export async function registerShop(
  input: RegisterShopInput
): Promise<{ success: boolean; error?: string; shopId?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) {
    return { success: false, error: "사장님 정보를 찾을 수 없습니다. 다시 로그인해주세요." };
  }

  const fullAddress = [input.address, input.detailAddress].filter(Boolean).join(" ");
  let lat = input.lat;
  let lng = input.lng;
  if (lat == null || lng == null) {
    const geo = await geocodeAddress(fullAddress);
    lat = geo.lat;
    lng = geo.lng;
  }

  const now = new Date().toISOString();
  const { data: shopData, error: shopError } = await supabase
    .from("shops")
    .insert({
      name: input.shopName.trim(),
      type: input.shopType,
      lat,
      lng,
      address: fullAddress || null,
      stock_status: null,
      is_open: true,
      business_hours: "09:00 - 21:00",
      representative_image_url: null,
      promotional_text: null,
      last_updated_at: null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (shopError || !shopData) {
    console.error("registerShop shops insert:", shopError);
    return { success: false, error: shopError?.message ?? "매장 등록에 실패했습니다." };
  }

  const { error: linkError } = await supabase.from("shop_owners").insert({
    owner_id: owner.id,
    shop_id: shopData.id,
  });

  if (linkError) {
    console.error("registerShop shop_owners insert:", linkError);
    await supabase.from("shops").delete().eq("id", shopData.id);
    return { success: false, error: "매장 연결에 실패했습니다." };
  }

  return { success: true, shopId: shopData.id };
}

/** 메뉴용: 로그인 상태 + 업장 수 (클라이언트 getUser 대신 사용, 401 방지) */
export async function getAuthState(): Promise<{
  user: { id: string; email?: string } | null;
  shopCount: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, shopCount: 0 };
  }

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) {
    return { user: { id: user.id, email: user.email ?? undefined }, shopCount: 0 };
  }

  const shops = await getOwnerShopsForList(owner.id);
  return {
    user: { id: user.id, email: user.email ?? undefined },
    shopCount: shops.length,
  };
}

/** 현재 로그인한 사용자의 업장 목록 (id, name). 업장 없으면 [] */
export async function getCurrentOwnerShops(): Promise<
  { id: number; name: string }[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) return [];

  return getOwnerShopsForList(owner.id);
}

/** 로그아웃 (서버에서 세션/쿠키 정리) */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/** 현재 로그인한 사용자의 owner id. 없으면 null */
export async function getCurrentOwnerId(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const owner = await getOwnerByAuthUserId(user.id);
  return owner?.id ?? null;
}
