// ============================================================
// payment.ts - Xử lý yêu cầu thanh toán (Stripe / MoMo)
// Music Journey 2D | Giai đoạn 1: Thiết lập cấu trúc Services
// ============================================================

// NOTE: Tất cả Secret Keys PHẢI lưu trong .env - KHÔNG viết thẳng vào code
// STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY (chỉ dùng phía server)

export type PaymentProvider = 'stripe' | 'momo';

export interface PaymentRequest {
  itemId: string;
  itemName: string;
  amount: number;       // Đơn vị: VND
  userId: string;
  provider: PaymentProvider;
}

export interface PaymentIntent {
  intentId: string;
  redirectUrl: string;  // URL trang thanh toán của đối tác
  status: 'created' | 'error';
}

/**
 * Bước 1-2 trong quy trình thanh toán an toàn:
 * Frontend gửi yêu cầu → Backend tạo Payment Intent → Trả về URL thanh toán
 *
 * TODO Giai đoạn 5: Gọi API backend thật (không gọi trực tiếp Stripe/MoMo từ Frontend)
 */
export async function createPaymentIntent(
  request: PaymentRequest
): Promise<PaymentIntent> {
  console.warn('[Payment] Placeholder - Giai đoạn 5 sẽ tích hợp thật.');

  // Trong thực tế: gọi endpoint backend /api/payment/create-intent
  // const response = await fetch('/api/payment/create-intent', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // return response.json();

  return {
    intentId: 'placeholder_intent_id',
    redirectUrl: '#',
    status: 'created',
  };
}

/**
 * Kiểm tra trạng thái thanh toán (polling)
 * TODO Giai đoạn 5: Webhook sẽ tự động xử lý, đây là fallback
 */
export async function checkPaymentStatus(_intentId: string): Promise<'pending' | 'completed' | 'failed'> {
  console.warn('[Payment] Placeholder - chưa kết nối server.');
  return 'pending';
}
