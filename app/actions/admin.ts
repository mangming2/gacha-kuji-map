"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOwnerByAuthUserId,
  getPendingShops,
  getPendingClaims,
  getPendingRegistrations,
} from "@/lib/supabase/queries";
import type { RegisterShopInput } from "./owner";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner || owner.role !== "admin") {
    return { ok: false, error: "운영자 권한이 필요합니다." };
  }
  return { ok: true, owner };
}

/** 운영자: 매장 직접 추가 (즉시 APPROVED) */
export async function addShopAsAdmin(
  input: RegisterShopInput
): Promise<{ success: boolean; error?: string; shopId?: number }> {
  const auth = await requireAdmin();
  if (!auth.ok || !auth.owner) return { success: false, error: auth.error };
  const owner = auth.owner;

  const supabase = await createClient();
  const { geocodeAddress } = await import("./owner");

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
      business_hours: input.businessHours ?? "09:00 - 21:00",
      closed_days: input.closedDays || null,
      representative_image_url: input.representativeImageUrl || null,
      promotional_text: null,
      last_updated_at: null,
      status: "APPROVED",
      update_source: "operator",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (shopError || !shopData) {
    return { success: false, error: shopError?.message ?? "매장 등록에 실패했습니다." };
  }

  const { error: linkError } = await supabase.from("shop_owners").insert({
    owner_id: owner.id,
    shop_id: shopData.id,
  });

  if (linkError) {
    await supabase.from("shops").delete().eq("id", shopData.id);
    return { success: false, error: "매장 연결에 실패했습니다." };
  }

  return { success: true, shopId: shopData.id };
}

/** 운영자: 신규 등록 승인 */
export async function approveShopRegistration(
  shopId: number
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = await createClient();

  const { data: req } = await supabase
    .from("shop_registration_requests")
    .select("owner_id")
    .eq("shop_id", shopId)
    .eq("status", "PENDING")
    .single();

  if (!req) {
    return { success: false, error: "승인 대기 중인 등록 요청을 찾을 수 없습니다." };
  }

  const { error: updateError } = await supabase
    .from("shops")
    .update({
      status: "APPROVED",
      update_source: "claimed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", shopId);

  if (updateError) return { success: false, error: updateError.message };

  const { error: linkError } = await supabase.from("shop_owners").insert({
    owner_id: req.owner_id,
    shop_id: shopId,
  });

  if (linkError) {
    await supabase.from("shops").update({ status: "PENDING" }).eq("id", shopId);
    return { success: false, error: "매장 연결에 실패했습니다." };
  }

  await supabase
    .from("shop_registration_requests")
    .update({ status: "APPROVED", updated_at: new Date().toISOString() })
    .eq("shop_id", shopId);

  return { success: true };
}

/** 운영자: 신규 등록 거절 */
export async function rejectShopRegistration(
  shopId: number
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = await createClient();

  await supabase
    .from("shop_registration_requests")
    .update({ status: "REJECTED", updated_at: new Date().toISOString() })
    .eq("shop_id", shopId);

  await supabase.from("gacha_machines").delete().eq("shop_id", shopId);
  await supabase.from("kuji_statuses").delete().eq("shop_id", shopId);
  await supabase.from("shops").delete().eq("id", shopId);
  return { success: true };
}

/** 운영자: 클레임 승인 */
export async function approveShopClaim(
  claimId: number
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = await createClient();

  const { data: claim, error: claimError } = await supabase
    .from("shop_claims")
    .select("owner_id, shop_id")
    .eq("id", claimId)
    .eq("status", "PENDING")
    .single();

  if (claimError || !claim) {
    return { success: false, error: "승인 대기 중인 클레임을 찾을 수 없습니다." };
  }

  const { error: linkError } = await supabase.from("shop_owners").insert({
    owner_id: claim.owner_id,
    shop_id: claim.shop_id,
  });

  if (linkError) {
    if (linkError.code === "23505") {
      return { success: false, error: "이미 관리 중인 매장입니다." };
    }
    return { success: false, error: linkError.message };
  }

  await supabase
    .from("shop_claims")
    .update({ status: "APPROVED", updated_at: new Date().toISOString() })
    .eq("id", claimId);

  await supabase
    .from("shops")
    .update({
      update_source: "claimed",
      last_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", claim.shop_id);

  return { success: true };
}

/** 운영자: 클레임 거절 */
export async function rejectShopClaim(
  claimId: number
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = await createClient();

  await supabase
    .from("shop_claims")
    .update({ status: "REJECTED", updated_at: new Date().toISOString() })
    .eq("id", claimId);

  return { success: true };
}

/** 운영자: 승인 대기 데이터 조회 */
export async function getAdminPendingData() {
  const auth = await requireAdmin();
  if (!auth.ok) return null;

  const [shops, claims, registrations] = await Promise.all([
    getPendingShops(),
    getPendingClaims(),
    getPendingRegistrations(),
  ]);

  return { shops, claims, registrations };
}
