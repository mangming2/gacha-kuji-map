"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOwnerByAuthUserId,
  getOwnerShopsForList,
  getOwnerShopIds,
  getNearbyShops,
  createOwnerIfNotExists,
  getCommentsByOwnerId,
} from "@/lib/supabase/queries";
import type { MyCommentRow } from "@/lib/supabase/queries";
import type { ShopType } from "@/types/shop";

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;

/** 주소 → 위경도 변환 (클라이언트에서 주소 선택 시 호출 가능) */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; ok: boolean }> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key || !address.trim()) {
    console.error("[geocodeAddress] KAKAO_REST_API_KEY 없음 또는 주소 비어있음");
    return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, ok: false };
  }

  try {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
    });
    const data = await res.json();

    if (data.error) {
      console.error("[geocodeAddress] Kakao API 에러:", {
        code: data.error.code,
        message: data.error.message,
        status: res.status,
      });
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

    console.error("[geocodeAddress] 검색 결과 없음:", {
      query: address,
      meta: data.meta,
      documentsCount: data.documents?.length ?? 0,
      raw: JSON.stringify(data).slice(0, 500),
    });
  } catch (e) {
    console.error("[geocodeAddress] 예외:", e);
  }
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, ok: false };
}

export interface RegisterShopInput {
  shopName: string;
  shopType: ShopType;
  email: string;
  phone?: string;
  address: string;
  detailAddress?: string;
  businessNumber: string;
  businessHours?: string;
  closedDays?: string;
  /** 대표 이미지 URL (선택, Supabase Storage 업로드 후) */
  representativeImageUrl?: string | null;
  /** 주소 검색으로 얻은 좌표 (있으면 사용, 없으면 서버에서 재시도) */
  lat?: number;
  lng?: number;
}

/** 대표 이미지 업로드 → public URL 반환 */
export async function uploadShopImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const file = formData.get("file") as File | null;
  if (!file || !file.size) {
    return { error: "이미지 파일을 선택해주세요." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("shop-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("uploadShopImage:", error);
    return { error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("shop-images").getPublicUrl(data.path);
  return { url: publicUrl };
}

/** 근처 매장 조회 (입점/클레임 분기용) */
export async function getNearbyShopsAction(
  lat: number,
  lng: number,
  radiusM?: number
) {
  return getNearbyShops(lat, lng, radiusM ?? 50);
}

/** 가게 등록: 로그인한 모든 유저 가능. 운영자는 즉시 APPROVED+shop_owners 연결, 일반 유저는 APPROVED(커뮤니티 등록) */
export async function registerShop(
  input: RegisterShopInput
): Promise<{ success: boolean; error?: string; shopId?: number; pending?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  let owner = await getOwnerByAuthUserId(user.id);
  if (!owner) {
    await createOwnerIfNotExists(
      user.id,
      user.email ?? "",
      (user.user_metadata?.name as string) ??
        (user.user_metadata?.nickname as string) ??
        user.email ??
        "사용자"
    );
    owner = await getOwnerByAuthUserId(user.id);
  }
  if (!owner) {
    return { success: false, error: "사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요." };
  }

  const isAdmin = owner.role === "admin";

  const fullAddress = [input.address, input.detailAddress].filter(Boolean).join(" ");
  let lat = input.lat;
  let lng = input.lng;
  if (lat == null || lng == null) {
    const geo = await geocodeAddress(fullAddress);
    lat = geo.lat;
    lng = geo.lng;
  }

  const now = new Date().toISOString();
  const status = "APPROVED";
  const updateSource = isAdmin ? "operator" : "community";

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
      business_hours: input.businessHours ?? "09:00 - 21:00",
      closed_days: input.closedDays || null,
      representative_image_url: input.representativeImageUrl || null,
      promotional_text: null,
      last_updated_at: null,
      status,
      update_source: updateSource,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (shopError || !shopData) {
    console.error("registerShop shops insert:", shopError);
    return { success: false, error: shopError?.message ?? "매장 등록에 실패했습니다." };
  }

  if (isAdmin) {
    const { error: linkError } = await supabase.from("shop_owners").insert({
      owner_id: owner.id,
      shop_id: shopData.id,
    });
    if (linkError) {
      console.error("registerShop shop_owners insert:", linkError);
      await supabase.from("shops").delete().eq("id", shopData.id);
      return { success: false, error: "매장 연결에 실패했습니다." };
    }
  }

  return {
    success: true,
    shopId: shopData.id,
    pending: false,
  };
}

/** 기존 매장 클레임 신청 */
export async function claimShop(
  shopId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) {
    return { success: false, error: "사장님 정보를 찾을 수 없습니다." };
  }

  const { error } = await supabase.from("shop_claims").insert({
    owner_id: owner.id,
    shop_id: shopId,
    status: "PENDING",
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "이미 클레임 신청한 매장입니다." };
    }
    console.error("claimShop:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** 메뉴용: 로그인 상태 + 업장 수 (클라이언트 getUser 대신 사용, 401 방지) */
export async function getAuthState(): Promise<{
  user: { id: string; email?: string } | null;
  shopCount: number;
  isAdmin: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, shopCount: 0, isAdmin: false };
  }

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) {
    return {
      user: { id: user.id, email: user.email ?? undefined },
      shopCount: 0,
      isAdmin: false,
    };
  }

  const shops = await getOwnerShopsForList(owner.id);
  return {
    user: { id: user.id, email: user.email ?? undefined },
    shopCount: shops.length,
    isAdmin: owner.role === "admin",
  };
}

/** 로그아웃 (서버에서 세션/쿠키 정리) */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/** 현재 로그인한 사용자의 owner id. 없으면 null (내부용) */
async function getCurrentOwnerId(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const owner = await getOwnerByAuthUserId(user.id);
  return owner?.id ?? null;
}

/** 마이페이지: 내 프로필 (이름, 이메일) */
export async function getMyProfile(): Promise<{
  id: number;
  name: string;
  email: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) return null;

  return { id: owner.id, name: owner.name, email: owner.email };
}

/** 마이페이지: 내 이름(닉네임) 수정 (DB 함수 사용으로 RLS 영향 없이 동작) */
export async function updateMyName(
  name: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "이름을 입력해주세요." };
  }
  if (trimmed.length > 50) {
    return { success: false, error: "이름은 50자 이내로 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.rpc("update_owner_display_name", {
    new_name: trimmed,
  });

  if (error) {
    console.error("updateMyName:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** 마이페이지: 내가 남긴 현황 제보 목록 */
export async function getMyCommentReports(): Promise<MyCommentRow[]> {
  const ownerId = await getCurrentOwnerId();
  if (!ownerId) return [];
  return getCommentsByOwnerId(ownerId);
}

/** 업장 관리: 내 매장 삭제 (소유 확인 후 연관 데이터 삭제) */
export async function deleteShop(
  shopId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) return { success: false, error: "등록된 업장이 없습니다." };

  const shopIds = await getOwnerShopIds(owner.id);
  if (!shopIds.includes(shopId)) {
    return { success: false, error: "해당 매장을 삭제할 권한이 없습니다." };
  }

  // 연관 데이터 삭제 (FK 순서)
  const tables = [
    "shop_comments",
    "gacha_machines",
    "kuji_statuses",
    "shop_claims",
    "shop_registration_requests",
    "shop_owners",
  ] as const;

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("shop_id", shopId);
    if (error) {
      console.error(`deleteShop ${table}:`, error);
      return { success: false, error: error.message };
    }
  }

  const { error } = await supabase.from("shops").delete().eq("id", shopId);
  if (error) {
    console.error("deleteShop shops:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
