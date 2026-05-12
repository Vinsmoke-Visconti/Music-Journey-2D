// ============================================================
// supabase.ts - Cấu hình và truy vấn Supabase (Giai đoạn 4)
// Music Journey 2D | Infinite Journey Integration
// ============================================================

import { createClient } from '@supabase/supabase-js';

// Các biến môi trường từ Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Types ----

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  item_type: 'vehicle' | 'environment';
  item_id: string;
  purchased_at: string;
}

// ---- Database Functions ----

/**
 * Lấy thông tin hồ sơ người dùng
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching profile:', error.message);
    return null;
  }
  return data as UserProfile;
}

/**
 * Lấy danh sách vật phẩm đã sở hữu của user
 */
export async function getUserInventory(userId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('[Supabase] Error fetching inventory:', error.message);
    return [];
  }
  return data as InventoryItem[];
}

/**
 * Kiểm tra user có quyền truy cập item không
 */
export async function checkOwnership(userId: string, itemId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('inventory')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/**
 * Đăng xuất
 */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.reload(); // Reset trạng thái game
}
