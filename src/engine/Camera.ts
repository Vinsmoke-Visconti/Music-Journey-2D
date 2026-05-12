// ============================================================
// Camera.ts - Logic di chuyển khung nhìn (Camera)
// Music Journey 2D | Giai đoạn 1: Thiết lập cấu trúc Engine
// ============================================================

import * as PIXI from 'pixi.js';

export class Camera {
  private container: PIXI.Container;
  private targetX: number = 0;
  private targetY: number = 0;
  private lerpFactor: number = 0.1; // Độ mượt khi di chuyển camera

  constructor(container: PIXI.Container) {
    this.container = container;
  }

  /**
   * Đặt mục tiêu camera theo dõi (thường là vị trí xe)
   */
  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Cập nhật vị trí camera mỗi frame (lerp mượt mà)
   */
  update(screenWidth: number, screenHeight: number): void {
    const currentX = this.container.x;
    const currentY = this.container.y;

    // Lerp: di chuyển camera dần về phía mục tiêu
    const newX = currentX + (-this.targetX + screenWidth / 2 - currentX) * this.lerpFactor;
    const newY = currentY + (-this.targetY + screenHeight / 2 - currentY) * this.lerpFactor;

    this.container.x = newX;
    this.container.y = newY;
  }

  /**
   * Hiệu ứng rung camera (dùng khi Bass mạnh)
   */
  shake(intensity: number = 5): void {
    const offsetX = (Math.random() - 0.5) * intensity * 2;
    const offsetY = (Math.random() - 0.5) * intensity * 2;
    this.container.x += offsetX;
    this.container.y += offsetY;
  }

  /**
   * Đặt lại độ mượt lerp
   */
  setLerpFactor(factor: number): void {
    this.lerpFactor = Math.max(0.01, Math.min(1.0, factor));
  }
}
