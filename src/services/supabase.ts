// ============================================================
// supabase.ts - Cấu hình và truy vấn Supabase
// Music Journey 2D | Giai đoạn 1: Thiết lập cấu trúc Services
// ============================================================

// import { createClient } from '@supabase/supabase-js';

// NOTE: Khi đến Giai đoạn 4, bỏ comment và điền giá trị thật từ .env
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Placeholder Types (khớp với schema Database Giai đoạn 4) ----

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  subscription_expires_at: string | null;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_type: 'vehicle' | 'environment';
  item_id: string;   // Khớp với id trong vehicles.ts / environments.ts
  purchased_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  item_id: string;
  amount: number;
  currency: 'VND' | 'USD';
  status: 'pending' | 'completed' | 'failed';
  payment_provider: 'stripe' | 'momo';
  created_at: string;
}

// ---- Placeholder Functions ----

/**
 * Lấy thông tin hồ sơ người dùng
 * TODO: Giai đoạn 4 - kết nối Supabase thật
 */
export async function getUserProfile(_userId: string): Promise<UserProfile | null> {
  console.warn('[Supabase] Placeholder - chưa kết nối DB.');
  return null;
}

/**
 * Lấy danh sách vật phẩm đã sở hữu của user
 */
export async function getUserInventory(_userId: string): Promise<InventoryItem[]> {
  console.warn('[Supabase] Placeholder - chưa kết nối DB.');
  return [];
}

/**
 * Kiểm tra user có quyền truy cập item không (RLS sẽ bảo vệ ở DB)
 */
export async function checkOwnership(_userId: string, _itemId: string): Promise<boolean> {
  console.warn('[Supabase] Placeholder - chưa kết nối DB.');
  return false;
}
