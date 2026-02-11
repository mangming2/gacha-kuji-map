/**
 * Supabase DB row types (snake_case)
 */
export interface DbShop {
  id: number;
  name: string;
  type: "GACHA" | "KUJI" | "BOTH";
  lat: number;
  lng: number;
  address: string | null;
  stock_status: string | null;
  is_open: boolean;
  business_hours: string;
  closed_days?: string | null;
  representative_image_url: string | null;
  promotional_text: string | null;
  last_updated_at: string | null;
  status?: string | null;
  update_source?: string | null;
  last_updated_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbShopClaim {
  id: number;
  owner_id: number;
  shop_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbGachaMachine {
  id: number;
  shop_id: number;
  name: string;
  series: string;
  stock: number;
  image_url: string | null;
  created_at: string;
}

export interface DbKujiStatus {
  id: number;
  shop_id: number;
  name: string;
  status: string;
  stock: number | null;
  grade_status: { grade: string; count: number }[];
  image_url?: string | null;
  created_at: string;
}

export interface DbShopComment {
  id: number;
  shop_id: number;
  owner_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
}
