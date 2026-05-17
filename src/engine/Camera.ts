// ============================================================
// Camera.ts - Logic di chuyển khung nhìn (Camera)
// Music Journey 2D | Giai đoạn 1: Thiết lập cấu trúc Engine
// ============================================================

import * as PIXI from 'pixi.js';

export class Camera {
  private container: PIXI.Container;
  private targetX: number = 0;
  private targetY: number = 0;
  private lerpFactor: number = 0.1;

  // Shake state - separate from base position so it always decays to 0
  private shakeX: number = 0;
  private shakeY: number = 0;
  private shakeDecay: number = 0.75; // multiplier per frame (← decay speed)

  constructor(container: PIXI.Container) {
    this.container = container;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  update(screenWidth: number, screenHeight: number): void {
    // Lerp base position toward target
    const currentX = this.container.x - this.shakeX;
    const currentY = this.container.y - this.shakeY;

    const newBaseX = currentX + (-this.targetX + screenWidth / 2 - currentX) * this.lerpFactor;
    const newBaseY = currentY + (-this.targetY + screenHeight / 2 - currentY) * this.lerpFactor;

    // Decay existing shake toward 0
    this.shakeX *= this.shakeDecay;
    this.shakeY *= this.shakeDecay;

    // Snap very small shake to 0 to avoid lingering drift
    if (Math.abs(this.shakeX) < 0.05) this.shakeX = 0;
    if (Math.abs(this.shakeY) < 0.05) this.shakeY = 0;

    this.container.x = newBaseX + this.shakeX;
    this.container.y = newBaseY + this.shakeY;
  }

  /**
   * Trigger a shake impulse - decays automatically each frame.
   * Does NOT accumulate: each call sets a fresh offset bounded by intensity.
   */
  shake(intensity: number = 5): void {
    // Clamp so shake can't exceed a safe maximum regardless of bassEnergy
    const maxShake = 10;
    const clamped = Math.min(intensity, maxShake);
    this.shakeX = (Math.random() - 0.5) * clamped * 2;
    this.shakeY = (Math.random() - 0.5) * clamped * 2;
  }

  /** Immediately reset camera to origin (call when music stops) */
  resetPosition(): void {
    this.shakeX = 0;
    this.shakeY = 0;
    this.container.x = 0;
    this.container.y = 0;
  }

  setLerpFactor(factor: number): void {
    this.lerpFactor = Math.max(0.01, Math.min(1.0, factor));
  }
}
