// ============================================================
// Road.ts - Đường cong dạng sine (Perlin Noise sẽ thay thế ở GĐ3)
// Music Journey 2D | Giai đoạn 2
// ============================================================

import * as PIXI from 'pixi.js';

export class Road {
  private gfx: PIXI.Graphics;
  private markingGfx: PIXI.Graphics;
  private screenH: number;
  private screenW: number;
  private noiseOffset: number = 0;
  private points: { x: number; y: number }[] = [];

  private readonly GROUND_RATIO = 0.72; // Đường nằm ở 72% chiều cao

  constructor(app: PIXI.Application) {
    this.gfx = new PIXI.Graphics();
    this.markingGfx = new PIXI.Graphics();
    this.screenH = app.screen.height;
    this.screenW = app.screen.width;
    app.stage.addChild(this.gfx);
    app.stage.addChild(this.markingGfx);
  }

  generatePoints(W: number, segments: number = 30): void {
    this.points = [];
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * W;
      // Sine wave đơn giản + harmonic nhỏ
      const y = this.screenH * this.GROUND_RATIO
        + Math.sin(i * 0.35 + this.noiseOffset) * 22
        + Math.sin(i * 0.9 + this.noiseOffset * 1.4) * 8;
      this.points.push({ x, y });
    }
  }

  draw(envId: string = 'beach'): void {
    this.gfx.clear();
    this.markingGfx.clear();
    if (this.points.length < 2) return;

    const roadColors: Record<string, [number, number, number]> = {
      beach:  [0xd4b483, 0xb89460, 0xc8a870], // Cát
      desert: [0xb87820, 0x9a6010, 0xaa7018], // Sỏi sa mạc
      snow:   [0xd8e8f0, 0xb0c8d8, 0xc4d8e8], // Đường tuyết
    };
    const [roadMain, roadDark, roadMid] = roadColors[envId] ?? [0x888888, 0x666666, 0x777777];

    const W = this.screenW;
    const H = this.screenH;

    // --- Mặt đường chính ---
    this.gfx.beginFill(roadMain);
    this.gfx.moveTo(this.points[0].x, this.points[0].y);
    for (const p of this.points) this.gfx.lineTo(p.x, p.y);
    this.gfx.lineTo(W, H);
    this.gfx.lineTo(0, H);
    this.gfx.closePath();
    this.gfx.endFill();

    // --- Viền mép đường (bóng) ---
    this.gfx.lineStyle(4, roadDark, 0.8);
    this.gfx.moveTo(this.points[0].x, this.points[0].y);
    for (const p of this.points) this.gfx.lineTo(p.x, p.y);
    this.gfx.lineStyle(0);

    // --- Dải phân cách giữa đường (nét đứt vàng) ---
    if (envId !== 'beach') {
      this.markingGfx.lineStyle(3, 0xffee44, 0.7);
      const midY = this.screenH * this.GROUND_RATIO + 18;
      let dashOn = true;
      for (let x = 0; x < W; x += 28) {
        if (dashOn) {
          this.markingGfx.moveTo(x, midY);
          this.markingGfx.lineTo(x + 16, midY);
        }
        dashOn = !dashOn;
      }
      this.markingGfx.lineStyle(0);
    }
  }

  update(speed: number, W: number, envId: string = 'beach'): void {
    this.noiseOffset += speed * 0.007;
    this.screenW = W;
    this.generatePoints(W);
    this.draw(envId);
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
    return this.screenH * this.GROUND_RATIO;
  }

  resize(W: number, H: number): void {
    this.screenW = W;
    this.screenH = H;
  }
}
