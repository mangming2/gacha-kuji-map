"use server";

import { createClient } from "@/lib/supabase/server";
import type { GachaMachine, KujiStatus } from "@/types/shop";

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

  const updateData: Record<string, unknown> = {
    last_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

  await supabase
    .from("shops")
    .update({
      last_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  await supabase
    .from("shops")
    .update({
      last_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", shopId);

  return { success: true };
}
