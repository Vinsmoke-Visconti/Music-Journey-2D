// ============================================================
// Parallax.ts - Hệ thống nền nhiều lớp dùng PIXI.Graphics (không cần ảnh)
// Music Journey 2D | Strategy Pattern Refactored
// ============================================================

import * as PIXI from 'pixi.js';
import type { Environment } from '../configs/environments';
import { MapStrategy, ColorLayer } from './strategies/MapStrategy';
import { getMapStrategy } from './strategies/MapRegistry';

export class Parallax {
  private app: PIXI.Application;
  private layers: ColorLayer[] = [];
  private skyGfx: PIXI.Graphics;
  private groundGfx: PIXI.Graphics;
  private currentEnv: Environment | null = null;
  private currentProgress: number = 0;
  private mapStrategy: MapStrategy | null = null;
  private readonly GROUND_THICKNESS = 250;

  // Beat-reactive state
  private smoothBass: number = 0;
  private bassVelocity: number = 0;

  private parallaxLayer: PIXI.Container;

  constructor(app: PIXI.Application, backgroundLayer: PIXI.Container, parallaxLayer: PIXI.Container) {
    this.app = app;
    this.parallaxLayer = parallaxLayer;
    this.skyGfx = new PIXI.Graphics();
    this.groundGfx = new PIXI.Graphics();
    backgroundLayer.addChild(this.skyGfx);
    backgroundLayer.addChild(this.groundGfx);
  }

  loadEnvironment(env: Environment): void {
    this.currentEnv = env;
    this.mapStrategy = getMapStrategy(env.id);

    // Xóa layers cũ
    this.layers.forEach(l => {
      if (l.gfx.parent) {
        l.gfx.parent.removeChild(l.gfx);
      }
      l.gfx.destroy({ children: true });
    });
    this.layers = [];

    const W = this.app.screen.width;
    const H = this.app.screen.height;

    // Vẽ bầu trời (Strategy)
    this.mapStrategy.drawSkyGradient(this.skyGfx, W, H, this.currentProgress);

    // Xây dựng layers (Strategy)
    this.layers = this.mapStrategy.buildLayers(W, H, 0);

    // Thêm layers vào parallaxLayer
    this.layers.forEach((l) => {
      this.parallaxLayer.addChild(l.gfx);
    });

    // Vẽ mặt đất nền (Strategy)
    this.mapStrategy.drawGround(this.groundGfx, W, H, H - this.GROUND_THICKNESS, this.GROUND_THICKNESS);
  }

  update(vehicleSpeed: number, progress: number, bassEnergy: number = 0): void {
    if (!this.currentEnv || !this.mapStrategy) return;

    // Khi nhạc chạy qua các mốc thời gian, vẽ lại bầu trời
    if (Math.abs(this.currentProgress - progress) > 0.005) {
      this.currentProgress = progress;
      const W = this.app.screen.width;
      const H = this.app.screen.height;
      this.mapStrategy.drawSkyGradient(this.skyGfx, W, H, this.currentProgress);
    }

    const W = this.app.screen.width;

    // ── Beat-reactive bounce: spring physics ─────────────────────────
    // smoothBass ≥ 0: represents upward displacement in pixels
    // Bass kick → impulse pushes displacement UP → spring pulls back to 0
    const BOUNCE_THRESHOLD = 0.5;
    const MAX_BOUNCE_PX    = 8;   // hard ceiling: layer never moves more than 8px
    const IMPULSE_STRENGTH = 6;
    const SPRING_K         = 0.35;
    const DAMPING          = 0.68;

    if (bassEnergy > BOUNCE_THRESHOLD) {
      // Add an UPWARD impulse proportional to how much bass exceeds threshold
      this.bassVelocity += (bassEnergy - BOUNCE_THRESHOLD) * IMPULSE_STRENGTH;
    }
    // Spring restoring force pulls smoothBass back toward 0
    this.bassVelocity += (-this.smoothBass) * SPRING_K;
    // Damping
    this.bassVelocity *= DAMPING;
    this.smoothBass   += this.bassVelocity;
    // Hard clamp: 0 ≤ smoothBass ≤ MAX_BOUNCE_PX
    this.smoothBass = Math.max(0, Math.min(this.smoothBass, MAX_BOUNCE_PX));

    // Snap to 0 once almost settled (prevents forever-tiny drift)
    if (Math.abs(this.smoothBass) < 0.05 && Math.abs(this.bassVelocity) < 0.05) {
      this.smoothBass   = 0;
      this.bassVelocity = 0;
    }

    this.layers.forEach((layer) => {
      layer.offsetX -= vehicleSpeed * layer.scrollSpeed;
      if (layer.offsetX < -W * 1.5) layer.offsetX += W * 1.5;
      layer.gfx.x = layer.offsetX;

      // Bounce: far layers (low scrollSpeed) move less than near layers
      // Negative Y = upward in PIXI screen space (sky is at top)
      const bounceFactor = Math.min(layer.scrollSpeed, 1.0); // cap at 1.0
      layer.gfx.y = -this.smoothBass * bounceFactor;
    });

    this.mapStrategy.updateLayers(this.layers, this.app.screen.height, this.GROUND_THICKNESS);
  }

  resize(env: Environment): void {
    if (this.currentEnv?.id === env.id) {
      this.loadEnvironment(env); // Vẽ lại toàn bộ cho khớp kích thước màn hình
    }
  }

  getCurrentStrategy(): MapStrategy | null {
    return this.mapStrategy;
  }
}
