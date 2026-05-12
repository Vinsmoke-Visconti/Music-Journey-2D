// ============================================================
// index.ts - Webhook Handler: Xác nhận thanh toán từ Stripe/MoMo
// Music Journey 2D | Giai đoạn 5: Thương mại hóa
// Chạy như Supabase Edge Function (Deno runtime)
// ============================================================

// NOTE: Đây là Supabase Edge Function (Deno), KHÔNG phải Node.js thông thường
// Deploy: supabase functions deploy payment-webhook

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

serve(async (req: Request) => {
  // ---- Chỉ chấp nhận POST ----
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  // ---- Xác minh chữ ký số Stripe Webhook ----
  // Bước 4-5 trong quy trình thanh toán an toàn
  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    console.error('[Webhook] Missing signature or secret');
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO Giai đoạn 5: Dùng Stripe SDK để verify signature
  // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Bad Request: Invalid JSON', { status: 400 });
  }

  // ---- Xử lý sự kiện thanh toán thành công ----
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('[Webhook] Thanh toán thành công:', paymentIntent);

    // TODO Giai đoạn 5: Cập nhật inventory trong Supabase
    // const supabase = createClient(
    //   Deno.env.get('SUPABASE_URL')!,
    //   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // );
    // await supabase.from('inventory').insert({ ... });
    // await supabase.from('purchases').update({ status: 'completed' }).eq('payment_intent_id', paymentIntent.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
