// ============================================================
// Particles.ts - Hệ thống hạt bụi/khói với Object Pool
// Music Journey 2D | Giai đoạn 2
// ============================================================

import * as PIXI from 'pixi.js';

interface Particle {
  gfx: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  decay: number;
  size: number;
  color: number;
  active: boolean;
}

export class Particles {
  private app: PIXI.Application;
  private pool: Particle[] = [];
  private readonly MAX = 120;
  private dustColor: number = 0xd4b483;   // Màu bụi cát (beach)
  private smokeColor: number = 0x888888;  // Màu khói ống xả

  constructor(app: PIXI.Application) {
    this.app = app;
    this._initPool();
  }

  private _initPool(): void {
    for (let i = 0; i < this.MAX; i++) {
      const gfx = new PIXI.Graphics();
      gfx.visible = false;
      this.app.stage.addChild(gfx);
      this.pool.push({
        gfx, vx: 0, vy: 0,
        life: 0, maxLife: 1,
        decay: 0.03, size: 4,
        color: this.dustColor,
        active: false,
      });
    }
  }

  private _getIdle(): Particle | null {
    return this.pool.find(p => !p.active) ?? null;
  }

  // Phát bụi bánh xe
  emitDust(x: number, y: number, speed: number): void {
    const count = Math.floor(speed * 1.2);
    for (let i = 0; i < count; i++) {
      const p = this._getIdle();
      if (!p) break;
      p.active = true;
      p.gfx.visible = true;
      p.gfx.x = x + (Math.random() - 0.5) * 16;
      p.gfx.y = y;
      p.vx = -(Math.random() * speed * 0.4 + 0.3);
      p.vy = -(Math.random() * 2.5 + 0.5);
      p.life = 1.0;
      p.maxLife = 1.0;
      p.decay = 0.025 + Math.random() * 0.02;
      p.size = 2 + Math.random() * 4;
      p.color = this.dustColor;
      this._drawParticle(p);
    }
  }

  // Phát khói ống xả
  emitSmoke(x: number, y: number, speed: number): void {
    if (speed < 0.3) return;
    const p = this._getIdle();
    if (!p) return;
    p.active = true;
    p.gfx.visible = true;
    p.gfx.x = x;
    p.gfx.y = y;
    p.vx = -(Math.random() * 0.8 + 0.2);
    p.vy = -(Math.random() * 1.2 + 0.3);
    p.life = 1.0;
    p.maxLife = 1.0;
    p.decay = 0.018 + Math.random() * 0.015;
    p.size = 5 + Math.random() * 6;
    p.color = this.smokeColor;
    this._drawParticle(p);
  }

  private _drawParticle(p: Particle): void {
    p.gfx.clear();
    p.gfx.beginFill(p.color, 0.75);
    p.gfx.drawCircle(0, 0, p.size);
    p.gfx.endFill();
  }

  update(): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= p.decay;
      if (p.life <= 0) {
        p.active = false;
        p.gfx.visible = false;
        continue;
      }
      p.gfx.x += p.vx;
      p.gfx.y += p.vy;
      p.vy -= 0.04; // nổi lên nhẹ (bụi)
      p.vx *= 0.97; // ma sát không khí
      p.gfx.alpha = p.life * 0.8;
      // Thu nhỏ khi mờ dần
      const scale = 0.5 + p.life * 0.5;
      p.gfx.scale.set(scale);
    }
  }

  setDustColor(hex: string): void {
    this.dustColor = parseInt(hex.replace('#', ''), 16);
  }
}
