// ============================================================
// Road.ts - Procedural Road with Perlin Noise
// Music Journey 2D | Strategy Pattern Refactored
// ============================================================

import * as PIXI from 'pixi.js';
import { getMapStrategy } from './strategies/MapRegistry';

export class Road {
  private container: PIXI.Container;
  private gfx: PIXI.Graphics;
  private points: { x: number; y: number }[] = [];
  private app: PIXI.Application;
  private noiseOffset = 0;
  private puddles: { x: number; width: number }[] = [];
  private lastEnvId: string = '';

  private readonly SEGMENT_WIDTH = 15; // Độ chi tiết của đường
  private readonly GROUND_THICKNESS = 250; // Độ dày cố định của mặt đất từ cạnh dưới màn hình

  // Perlin Noise 1D simple implementation
  private seed = Math.random();
  private noiseValues: number[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.gfx = new PIXI.Graphics();
    this.container.addChild(this.gfx);
    app.stage.addChild(this.container);

    // Khởi tạo mảng noise ngẫu nhiên
    for (let i = 0; i < 200; i++) {
      this.noiseValues.push(Math.random());
    }
  }

  /** Thuật toán Noise 1D mượt mà */
  private getNoise(x: number): number {
    const scaledX = x * 0.01;
    const i = Math.floor(scaledX);
    const f = scaledX - i;
    
    const noise1 = this.noiseValues[i % this.noiseValues.length];
    const noise2 = this.noiseValues[(i + 1) % this.noiseValues.length];
    
    // Hàm nội suy mượt (Smoothstep)
    const ft = f * Math.PI;
    const f2 = (1 - Math.cos(ft)) * 0.5;
    
    return noise1 * (1 - f2) + noise2 * f2;
  }

  generatePoints(width: number, envId: string): void {
    this.points = [];
    const count = Math.ceil(width / this.SEGMENT_WIDTH) + 5;
    
    const strategy = getMapStrategy(envId);
    const config = strategy.getRoadConfig();

    // Tạo vũng nước chỉ khi môi trường thay đổi
    if (envId !== this.lastEnvId) {
      this.lastEnvId = envId;
      this.puddles = strategy.generatePuddles(this.app.screen.width);
    }

    for (let i = 0; i < count; i++) {
      const x = i * this.SEGMENT_WIDTH;
      const n1 = this.getNoise(x + this.noiseOffset);
      const n2 = this.getNoise((x + this.noiseOffset) * 2.5) * 0.4;
      const n3 = this.getNoise((x + this.noiseOffset) * 0.5) * 2.0;
      
      const noiseY = (n1 + n2 + n3) * config.amplitude;
      
      this.points.push({
        x: x,
        y: this.app.screen.height - this.GROUND_THICKNESS + noiseY
      });
    }
  }

  update(speed: number, width: number, envId: string): void {
    this.noiseOffset += speed * 5;

    // Move puddles backwards to match road movement
    for (const pud of this.puddles) {
      pud.x -= speed * 5;
      // Loop puddles back to the right when they go off-screen left
      if (pud.x + pud.width < -100) {
        pud.x = width + Math.random() * 200;
        pud.width = 30 + Math.random() * 45;
      }
    }

    this.generatePoints(width, envId);
    this.draw(envId);
  }

  draw(envId: string): void {
    const g = this.gfx;
    g.clear();

    const strategy = getMapStrategy(envId);
    const config = strategy.getRoadConfig();

    // Vẽ phần dưới của mặt đất
    g.beginFill(config.roadColor);
    g.moveTo(0, this.app.screen.height + 1000);
    for (const p of this.points) {
      g.lineTo(p.x, p.y);
    }
    const lastX = this.points.length > 0 ? this.points[this.points.length - 1].x : this.app.screen.width;
    g.lineTo(lastX, this.app.screen.height + 1000);
    g.endFill();

    // Vẽ trang trí (ví dụ: vũng nước cho Jungle)
    strategy.drawRoadDecorations(g, this.puddles, this.getGroundYAt.bind(this));

    // Vẽ vạch kẻ đường (vạch đứt)
    g.lineStyle(3, config.lineColor, 0.6);
    for (let i = 0; i < this.points.length - 2; i += 4) {
      const p = this.points[i];
      const pNext = this.points[i + 1];
      g.moveTo(p.x, p.y - 2);
      g.lineTo(pNext.x, pNext.y - 2);
    }
    g.lineStyle(0);
  }

  getGroundYAt(x: number): number {
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + (p2.y - p1.y) * t;
      }
    }
    return this.app.screen.height - this.GROUND_THICKNESS;
  }

  /** Kiểm tra xe có đang đi qua vũng nước không */
  getPuddleAt(x: number): boolean {
    for (const pud of this.puddles) {
      if (x >= pud.x && x <= pud.x + pud.width) return true;
    }
    return false;
  }

  resize(w: number, h: number): void {}
}
