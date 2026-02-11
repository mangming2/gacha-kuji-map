"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOwnerByAuthUserId,
  getOwnerShopIds,
  getShopComments,
} from "@/lib/supabase/queries";
import type { GachaMachine, KujiStatus } from "@/types/shop";

export type { ShopCommentRow } from "@/lib/supabase/queries";

async function getUpdateSource(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: number
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "operator";
  const owner = await getOwnerByAuthUserId(user.id);
  if (!owner) return "operator";
  if (owner.role === "admin") return "operator";
  const shopIds = await getOwnerShopIds(owner.id);
  return shopIds.includes(shopId) ? "claimed" : "operator";
}

export async function updateShopPromo(
  shopId: number,
  data: {
    promotionalText?: string;
    representativeImageUrl?: string | null;
    businessHours?: string;
    closedDays?: string;
  }
) {
  const supabase = await createClient();
  const updateSource = await getUpdateSource(supabase, shopId);

  const updateData: Record<string, unknown> = {
    last_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    update_source: updateSource,
  };
  if (data.promotionalText !== undefined)
    updateData.promotional_text = data.promotionalText;
  if (data.representativeImageUrl !== undefined)
    updateData.representative_image_url = data.representativeImageUrl ?? null;
  if (data.businessHours !== undefined)
    updateData.business_hours = data.businessHours;
  if (data.closedDays !== undefined) updateData.closed_days = data.closedDays;

  const { error } = await supabase
    .from("shops")
    .update(updateData)
    .eq("id", shopId);

  if (error) {
    console.error("updateShopPromo error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function upsertGachaMachines(
  shopId: number,
  machines: GachaMachine[]
) {
  const supabase = await createClient();

  // 기존 머신 삭제 후 새로 삽입 (간단한 upsert)
  const { error: deleteError } = await supabase
    .from("gacha_machines")
    .delete()
    .eq("shop_id", shopId);

  if (deleteError) {
    console.error("delete gacha_machines error:", deleteError);
    return { success: false, error: deleteError.message };
  }

  if (machines.length === 0) {
    return { success: true };
  }

  const { error: insertError } = await supabase.from("gacha_machines").insert(
    machines.map((m) => ({
      shop_id: shopId,
      name: m.name,
      series: m.series,
      stock: m.stock ?? 0,
      image_url: m.imageUrl ?? null,
    }))
  );

  if (insertError) {
    console.error("insert gacha_machines error:", insertError);
    return { success: false, error: insertError.message };
  }

  const updateSource = await getUpdateSource(supabase, shopId);
  await supabase
    .from("shops")
    .update({
      last_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      update_source: updateSource,
    })
    .eq("id", shopId);

  return { success: true };
}

export async function upsertKujiStatuses(
  shopId: number,
  statuses: KujiStatus[]
) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("kuji_statuses")
    .delete()
    .eq("shop_id", shopId);

  if (deleteError) {
    console.error("delete kuji_statuses error:", deleteError);
    return { success: false, error: deleteError.message };
  }

  if (statuses.length === 0) {
    return { success: true };
  }

  const rows = statuses.map((s) => ({
    shop_id: shopId,
    name: s.name,
    status: s.status ?? "신규",
    stock: s.stock ?? null,
    grade_status: s.gradeStatus ?? [],
    image_url: s.imageUrl ?? null,
  }));

  const { error: insertError } = await supabase
    .from("kuji_statuses")
    .insert(rows);

  if (insertError) {
    console.error("insert kuji_statuses error:", insertError);
    return { success: false, error: insertError.message };
  }

  const updateSource = await getUpdateSource(supabase, shopId);
  await supabase
    .from("shops")
    .update({
      last_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      update_source: updateSource,
    })
    .eq("id", shopId);

  return { success: true };
}

/** 가게 현황 제보(댓글) 목록 조회 */
export async function fetchShopComments(shopId: number) {
  return getShopComments(shopId);
}

/** 댓글용 이미지 업로드 (클라이언트에서 압축 후 FormData로 전달). 영구 보존. */
export async function uploadCommentImage(
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
    .from("shop-comment-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("uploadCommentImage:", error);
    return { error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("shop-comment-images").getPublicUrl(data.path);
  return { url: publicUrl };
}

/** 가게 현황 제보(댓글) 작성 */
export async function addShopComment(
  shopId: number,
  content: string,
  imageUrl?: string | null
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
    return { success: false, error: "사용자 정보를 불러올 수 없습니다. 로그인 후 다시 시도해주세요." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: "내용을 입력해주세요." };
  }

  const { error } = await supabase.from("shop_comments").insert({
    shop_id: shopId,
    owner_id: owner.id,
    content: trimmed,
    image_url: imageUrl || null,
  });

  if (error) {
    console.error("addShopComment:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
