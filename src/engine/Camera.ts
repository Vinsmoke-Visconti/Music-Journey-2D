// ============================================================
// Camera.ts - Shake effect only (stage follows nothing, just shakes on bass)
// Music Journey 2D | Strategy Pattern Refactored
// ============================================================

import * as PIXI from 'pixi.js';

export class Camera {
  private container: PIXI.Container;

  // Shake state — always decays toward 0, never accumulates
  private shakeX: number = 0;
  private shakeY: number = 0;
  private readonly DECAY = 0.72; // multiplier per frame

  // Legacy fields kept for API compatibility
  private targetX: number = 0;
  private targetY: number = 0;
  private lerpFactor: number = 0.1;

  constructor(container: PIXI.Container) {
    this.container = container;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Legacy update — only applies shake offset, does NOT lerp the stage.
   * The stage position is managed by the PIXI layout directly.
   */
  update(_screenWidth: number, _screenHeight: number): void {
    this.decayShake();
  }

  /**
   * Decay shake by one frame. Call once per game-loop tick.
   * The shake X/Y offsets are applied to the container directly.
   */
  decayShake(): void {
    // Remove previous shake from container
    this.container.x -= this.shakeX;
    this.container.y -= this.shakeY;

    // Decay
    this.shakeX *= this.DECAY;
    this.shakeY *= this.DECAY;

    // Snap to zero when negligible
    if (Math.abs(this.shakeX) < 0.05) this.shakeX = 0;
    if (Math.abs(this.shakeY) < 0.05) this.shakeY = 0;

    // Re-apply decayed shake
    this.container.x += this.shakeX;
    this.container.y += this.shakeY;
  }

  /**
   * Trigger a fresh shake impulse.
   * Replaces any existing shake so it cannot accumulate across frames.
   */
  shake(intensity: number = 5): void {
    const MAX = 10;
    const c = Math.min(intensity, MAX);
    // Remove old shake from container first
    this.container.x -= this.shakeX;
    this.container.y -= this.shakeY;
    // Set new shake
    this.shakeX = (Math.random() - 0.5) * c * 2;
    this.shakeY = (Math.random() - 0.5) * c * 2;
    // Apply new shake
    this.container.x += this.shakeX;
    this.container.y += this.shakeY;
  }

  /** Immediately cancel shake — call when music stops or scene resets. */
  resetPosition(): void {
    this.container.x -= this.shakeX;
    this.container.y -= this.shakeY;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  setLerpFactor(factor: number): void {
    this.lerpFactor = Math.max(0.01, Math.min(1.0, factor));
  }
}
