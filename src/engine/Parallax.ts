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

  constructor(app: PIXI.Application) {
    this.app = app;
    this.skyGfx = new PIXI.Graphics();
    this.groundGfx = new PIXI.Graphics();
    app.stage.addChildAt(this.skyGfx, 0);
    app.stage.addChildAt(this.groundGfx, 1);
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

    // Thêm layers vào stage
    this.layers.forEach((l, i) => {
      this.app.stage.addChildAt(l.gfx, i + 2);
    });

    // Vẽ mặt đất nền (Strategy)
    this.mapStrategy.drawGround(this.groundGfx, W, H, H - this.GROUND_THICKNESS, this.GROUND_THICKNESS);
  }

  update(vehicleSpeed: number, progress: number): void {
    if (!this.currentEnv || !this.mapStrategy) return;

    // Khi nhạc chạy qua các mốc thời gian, vẽ lại bầu trời
    if (Math.abs(this.currentProgress - progress) > 0.005) {
      this.currentProgress = progress;
      const W = this.app.screen.width;
      const H = this.app.screen.height;
      this.mapStrategy.drawSkyGradient(this.skyGfx, W, H, this.currentProgress);
    }

    const W = this.app.screen.width;

    this.layers.forEach(layer => {
      layer.offsetX -= vehicleSpeed * layer.scrollSpeed;
      if (layer.offsetX < -W * 1.5) layer.offsetX += W * 1.5;
      layer.gfx.x = layer.offsetX;
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
