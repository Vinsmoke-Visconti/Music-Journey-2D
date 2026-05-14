// ============================================================
// Particles.ts - Hệ thống hạt nâng cấp (Giai đoạn 3)
// Hiệu ứng Bụi, Khói và Môi trường (Tuyết, Lá rơi)
// ============================================================

import * as PIXI from 'pixi.js';

type ParticleType = 'DUST' | 'SMOKE' | 'SNOW' | 'LEAF';

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
  type: ParticleType;
  rotationSpeed: number;
}

export class Particles {
  public container: PIXI.Container;
  private pool: Particle[] = [];
  private readonly MAX = 180; // Tăng số lượng hạt lên một chút
  private dustColor: number = 0xd4b483;
  private smokeColor: number = 0x888888;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this._initPool();
  }

  private _initPool(): void {
    for (let i = 0; i < this.MAX; i++) {
      const gfx = new PIXI.Graphics();
      gfx.visible = false;
      this.container.addChild(gfx);
      this.pool.push({
        gfx, vx: 0, vy: 0,
        life: 0, maxLife: 1,
        decay: 0.03, size: 4,
        color: this.dustColor,
        active: false,
        type: 'DUST',
        rotationSpeed: 0
      });
    }
  }

  private _getIdle(): Particle | null {
    return this.pool.find(p => !p.active) ?? null;
  }

  emitDust(x: number, y: number, speed: number): void {
    const count = Math.floor(speed * 1.5);
    for (let i = 0; i < count; i++) {
      const p = this._getIdle();
      if (!p) break;
      p.active = true;
      p.type = 'DUST';
      p.gfx.visible = true;
      p.gfx.x = x + (Math.random() - 0.5) * 20;
      p.gfx.y = y;
      p.vx = -(Math.random() * speed * 0.5 + 0.5);
      p.vy = -(Math.random() * 2.0 + 0.5);
      p.life = 1.0;
      p.decay = 0.02 + Math.random() * 0.03;
      p.size = 2 + Math.random() * 4;
      p.color = this.dustColor;
      this._drawParticle(p);
    }
  }

  emitSmoke(x: number, y: number, speed: number): void {
    if (speed < 0.2) return;
    const p = this._getIdle();
    if (!p) return;
    p.active = true;
    p.type = 'SMOKE';
    p.gfx.visible = true;
    p.gfx.x = x;
    p.gfx.y = y;
    p.vx = -(Math.random() * 0.5 + 0.2);
    p.vy = -(Math.random() * 1.0 + 0.2);
    p.life = 1.0;
    p.decay = 0.01 + Math.random() * 0.02;
    p.size = 6 + Math.random() * 8;
    p.color = this.smokeColor;
    this._drawParticle(p);
  }

  /** Phát hạt môi trường (Tuyết hoặc Lá rơi) */
  emitAtmosphere(width: number, height: number, envId: string): void {
    if (Math.random() > 0.15) return; // Không phát liên tục
    const p = this._getIdle();
    if (!p) return;

    p.active = true;
    p.gfx.visible = true;
    p.gfx.x = Math.random() * width;
    p.gfx.y = -20; // Xuất hiện từ phía trên màn hình

    if (envId === 'snow') {
      p.type = 'SNOW';
      p.color = 0xffffff;
      p.vx = (Math.random() - 0.2) * 1.5; // Gió thổi nhẹ
      p.vy = Math.random() * 1.5 + 1.0;
      p.size = 2 + Math.random() * 3;
      p.decay = 0.005;
    } else {
      p.type = 'LEAF';
      p.color = envId === 'desert' ? 0xd4a373 : 0xffcc88;
      p.vx = -(Math.random() * 2 + 1);
      p.vy = Math.random() * 1.2 + 0.5;
      p.size = 3 + Math.random() * 4;
      p.decay = 0.008;
      p.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }
    p.life = 1.0;
    this._drawParticle(p);
  }

  private _drawParticle(p: Particle): void {
    p.gfx.clear();
    if (p.type === 'LEAF') {
      p.gfx.beginFill(p.color, 0.6);
      p.gfx.drawEllipse(0, 0, p.size, p.size * 0.6);
    } else {
      p.gfx.beginFill(p.color, p.type === 'SMOKE' ? 0.4 : 0.8);
      p.gfx.drawCircle(0, 0, p.size);
    }
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

      if (p.type === 'DUST' || p.type === 'SMOKE') {
        p.vy -= 0.03; // Nổi lên
        p.vx *= 0.98;
      } else if (p.type === 'SNOW') {
        p.gfx.x += Math.sin(Date.now() * 0.002) * 0.5; // Lắc lư khi rơi
      } else if (p.type === 'LEAF') {
        p.gfx.rotation += p.rotationSpeed;
        p.gfx.x += Math.cos(Date.now() * 0.003) * 0.8;
      }

      p.gfx.alpha = p.life;
      const scale = 0.6 + p.life * 0.4;
      p.gfx.scale.set(scale);
    }
  }

  setDustColor(hex: string): void {
    this.dustColor = parseInt(hex.replace('#', ''), 16);
  }
}
