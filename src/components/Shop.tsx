// ============================================================
// Shop.tsx - Giao diện Cửa hàng (Giai đoạn 5)
// Music Journey 2D | Premium Vehicle & Environment Shop
// ============================================================

import { vehicles, getVehicleById } from '../configs/vehicles';
import { environments, getEnvironmentById } from '../configs/environments';

export class ShopUI {
  private modal: HTMLDivElement | null = null;
  private onPurchaseSuccess: (itemId: string) => void = () => {};

  constructor() {
    this._injectStyles();
  }

  private _injectStyles() {
    if (document.getElementById('shop-styles')) return;
    const style = document.createElement('style');
    style.id = 'shop-styles';
    style.textContent = `
      .shop-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center;
        z-index: 9998; opacity: 0; transition: opacity 0.3s ease;
      }
      .shop-modal {
        background: #12141d; border: 1px solid #333; border-radius: 24px;
        padding: 32px; width: 90%; max-width: 900px; height: 80vh;
        color: white; overflow-y: auto; position: relative;
        font-family: 'Outfit', sans-serif;
      }
      .shop-overlay.active { opacity: 1; }
      
      .shop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      .shop-header h2 { margin: 0; font-size: 28px; color: #f9c74f; font-family: 'Press Start 2P'; font-size: 14px; }
      
      .shop-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px; padding-bottom: 40px;
      }
      .shop-card {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; padding: 20px; text-align: center;
        transition: transform 0.2s, border-color 0.2s;
      }
      .shop-card:hover { transform: translateY(-5px); border-color: #f9c74f; }
      
      .item-icon { font-size: 40px; margin-bottom: 12px; display: block; }
      .item-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; display: block; }
      .item-type { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 16px; display: block; }
      
      .item-price { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 16px; display: block; }
      .item-owned { color: #10b981; font-weight: 600; font-size: 14px; }
      
      .buy-btn {
        width: 100%; padding: 12px; border-radius: 8px; border: none;
        background: #f9c74f; color: #000; font-weight: bold; cursor: pointer;
        transition: 0.2s;
      }
      .buy-btn:hover { background: #fff; }
      .buy-btn.owned { background: #333; color: #888; cursor: default; }

      .shop-close { font-size: 30px; color: #888; cursor: pointer; line-height: 1; }
      .shop-close:hover { color: #fff; }

      /* Custom scrollbar */
      .shop-modal::-webkit-scrollbar { width: 6px; }
      .shop-modal::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    `;
    document.head.appendChild(style);
  }

  show(userInventory: string[], onPurchase: (itemId: string) => void) {
    this.onPurchaseSuccess = onPurchase;
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.className = 'shop-overlay';
    
    // Combine vehicles and environments for the shop
    const items = [
      ...vehicles.map(v => ({ ...v, type: 'vehicle' as const })),
      ...environments.map(e => ({ ...e, type: 'environment' as const }))
    ];

    let gridHTML = '';
    items.forEach(item => {
      // Check if already free or in inventory
      const isFree = (item as any).isLocked === false || item.id === 'beach';
      const isOwned = isFree || userInventory.includes(item.id);
      const icon = item.type === 'vehicle' ? '🏎️' : '🏞️';
      const priceText = item.price ? `${item.price.toLocaleString('vi-VN')}đ` : 'Miễn phí';

      gridHTML += `
        <div class="shop-card">
          <span class="item-icon">${icon}</span>
          <span class="item-name">${item.name}</span>
          <span class="item-type">${item.type}</span>
          ${isOwned ? 
            `<span class="item-owned">✅ ĐÃ SỞ HỮU</span>` : 
            `<span class="item-price">${priceText}</span>
             <button class="buy-btn" onclick="window.__handleShopBuy('${item.id}', '${item.type}')">MUA NGAY</button>`
          }
        </div>
      `;
    });

    this.modal.innerHTML = `
      <div class="shop-modal">
        <div class="shop-header">
          <h2>🛒 CỬA HÀNG VẬT PHẨM</h2>
          <span class="shop-close" id="shop-close-btn">&times;</span>
        </div>
        <div class="shop-grid">
          ${gridHTML}
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    setTimeout(() => this.modal?.classList.add('active'), 10);

    // Global handler for buy button
    (window as any).__handleShopBuy = (id: string, type: string) => {
      this._handlePurchase(id, type);
    };

    this.modal.querySelector('#shop-close-btn')?.addEventListener('click', () => this.hide());
  }

  private async _handlePurchase(itemId: string, itemType: string) {
    // Phase 5: Integrate with payment.ts
    // For now, let's just trigger the callback for testing
    const confirmBuy = confirm(`Bạn có muốn mua vật phẩm này không? (Bản demo: Nhấn OK để mở khóa ngay)`);
    if (confirmBuy) {
      this.onPurchaseSuccess(itemId);
      this.hide();
    }
  }

  hide() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    setTimeout(() => {
      this.modal?.remove();
      this.modal = null;
    }, 300);
  }
}

export const shopUI = new ShopUI();
