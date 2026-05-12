// ============================================================
// payment.ts - Xử lý Thanh toán & Mở khóa vật phẩm (Giai đoạn 5)
// Music Journey 2D | Demo & Real Payment logic
// ============================================================

import { supabase } from './supabase';

export interface PurchaseRequest {
  userId: string;
  itemId: string;
  itemType: 'vehicle' | 'environment';
  amount: number;
}

/**
 * Xử lý mua vật phẩm (Bản Demo)
 * Trực tiếp thêm vào bảng inventory trên Supabase
 */
export async function processDemoPurchase(req: PurchaseRequest): Promise<boolean> {
  console.log(`[Payment] Processing Demo Purchase for: ${req.itemId}`);

  try {
    // 1. Thêm vào lịch sử giao dịch (Purchases)
    const { error: pError } = await supabase.from('purchases').insert([{
      user_id: req.userId,
      item_id: req.itemId,
      amount: req.amount,
      status: 'completed',
      payment_provider: 'stripe' // Placeholder
    }]);

    if (pError) throw pError;

    // 2. Thêm vào kho đồ (Inventory)
    const { error: iError } = await supabase.from('inventory').insert([{
      user_id: req.userId,
      item_id: req.itemId,
      item_type: req.itemType
    }]);

    if (iError) throw iError;

    console.log('[Payment] Purchase successful and saved to DB!');
    return true;
  } catch (err) {
    console.error('[Payment] Purchase failed:', err);
    return false;
  }
}

/**
 * Cấu trúc cho tương lai: Tạo Payment Intent (Stripe/MoMo)
 */
export async function createRealPaymentIntent(req: PurchaseRequest) {
  // Giai đoạn 5: Ở đây sẽ gọi API backend để lấy link thanh toán thật
  console.warn('[Payment] Real payment requires a secure server endpoint.');
  return null;
}
