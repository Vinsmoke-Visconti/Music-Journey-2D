// ============================================================
// Particles.ts - Hệ thống hạt nâng cấp
// Music Journey 2D | Strategy Pattern Refactored
// ============================================================

import * as PIXI from 'pixi.js';

export type ParticleType = 'DUST' | 'SMOKE' | 'SNOW' | 'LEAF' | 'MUD' | 'WATER';

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
  private app: PIXI.Application;
  public container: PIXI.Container;
  private pool: Particle[] = [];
  private readonly MAX = 180;
  private dustColor: number = 0xd4b483;
  private smokeColor: number = 0x888888;

  constructor(app: PIXI.Application, effectLayer: PIXI.Container) {
    this.app = app;
    this.container = new PIXI.Container();
    effectLayer.addChild(this.container);
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

  emit(type: ParticleType, x: number, y: number, vx: number, vy: number, size: number, decay: number, color: number, rotationSpeed: number = 0): void {
    const p = this._getIdle();
    if (!p) return;
    p.active = true;
    p.type = type;
    p.gfx.visible = true;
    p.gfx.x = x;
    p.gfx.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = 1.0;
    p.decay = decay;
    p.size = size;
    p.color = color;
    p.rotationSpeed = rotationSpeed;
    this._drawParticle(p);
    
    // Đảm bảo hạt mới lên trên nếu là khói
    if (type === 'SMOKE') {
      this.container.addChild(p.gfx);
    }
  }

  emitSmoke(x: number, y: number, speed: number): void {
    if (speed < 0.2) return;
    const vx = -(Math.random() * 0.4 + 0.1);
    const vy = -(Math.random() * 0.8 + 0.4);
    const decay = 0.009 + Math.random() * 0.004;
    const size = 5 + Math.random() * 7;
    this.emit('SMOKE', x, y, vx, vy, size, decay, this.smokeColor);
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

      if (p.type === 'DUST') {
        p.vy += 0.15;
        p.vx *= 0.96;
      } else if (p.type === 'SMOKE') {
        p.vy -= 0.04;
        p.vx *= 0.98;
      } else if (p.type === 'MUD') {
        p.vy += 0.4;
        p.vx *= 0.94;
      } else if (p.type === 'WATER') {
        p.vy += 0.25;
        p.vx *= 0.97;
      } else if (p.type === 'SNOW') {
        p.gfx.x += Math.sin(Date.now() * 0.002) * 0.5;
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
