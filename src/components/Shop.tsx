// ============================================================
// Shop.tsx - Giao diện mua xe và bối cảnh
// Music Journey 2D | Giai đoạn 1: Placeholder Component
// (Sẽ được xây dựng đầy đủ ở Giai đoạn 5 - Thương mại hóa)
// ============================================================

import { vehicles } from '../configs/vehicles';
import { environments } from '../configs/environments';

export interface ShopItem {
  id: string;
  name: string;
  type: 'vehicle' | 'environment';
  price: number | null;
  isLocked: boolean;
  isOwned: boolean;
}

/**
 * Tổng hợp danh sách tất cả items trong Shop từ config
 */
export function getShopCatalog(): ShopItem[] {
  const vehicleItems: ShopItem[] = vehicles.map((v) => ({
    id: v.id,
    name: v.name,
    type: 'vehicle',
    price: v.price,
    isLocked: v.isLocked,
    isOwned: !v.isLocked, // Giai đoạn 1: chỉ Van là miễn phí
  }));

  const envItems: ShopItem[] = environments.map((e) => ({
    id: e.id,
    name: e.name,
    type: 'environment',
    price: e.id === 'beach' ? null : 29000, // Bãi biển miễn phí
    isLocked: e.id !== 'beach',
    isOwned: e.id === 'beach',
  }));

  return [...vehicleItems, ...envItems];
}

/**
 * Placeholder: Render UI Shop (Vanilla JS)
 * Giai đoạn 5: Sẽ chuyển sang React component với UI đầy đủ
 */
export function renderShopPlaceholder(): void {
  const catalog = getShopCatalog();
  console.log('[Shop] Danh sách vật phẩm:');
  catalog.forEach((item) => {
    const status = item.isOwned ? '✅ Sở hữu' : item.price ? `🔒 ${item.price.toLocaleString('vi-VN')}đ` : '🎁 Miễn phí';
    console.log(`  [${item.type.toUpperCase()}] ${item.name} - ${status}`);
  });
}
