import * as PIXI from 'pixi.js';
import { MapStrategy, ColorLayer } from './MapStrategy';
import { ParticleType } from '../Particles';

export abstract class BaseMapStrategy implements MapStrategy {
  abstract id: string;

  // Cấu hình màu bầu trời theo thời gian (Progress 0 -> 1)
  protected readonly TIME_COLORS = [
    { p: 0.0, top: 0x1a1a4e, bot: 0x333366 }, // Đêm (Bắt đầu)
    { p: 0.2, top: 0x87ceeb, bot: 0xfde5a7 }, // Bình minh
    { p: 0.5, top: 0x00b4d8, bot: 0x90e0ef }, // Trưa
    { p: 0.8, top: 0xe07b39, bot: 0xf5c97d }, // Hoàng hôn
    { p: 1.0, top: 0x1a1a4e, bot: 0x333366 }, // Đêm (Kết thúc)
  ];

  abstract buildLayers(W: number, H: number, groundY: number): ColorLayer[];

  drawSkyGradient(g: PIXI.Graphics, W: number, H: number, progress: number): void {
    g.clear();
    let startIdx = 0;
    for (let i = 0; i < this.TIME_COLORS.length - 1; i++) {
      if (progress >= this.TIME_COLORS[i].p && progress <= this.TIME_COLORS[i + 1].p) {
        startIdx = i;
        break;
      }
    }

    const c1 = this.TIME_COLORS[startIdx];
    const c2 = this.TIME_COLORS[startIdx + 1];
    const t = (progress - c1.p) / (c2.p - c1.p);

    const top = this._lerpColor(c1.top, c2.top, t);
    const bot = this._lerpColor(c1.bot, c2.bot, t);

    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const stepT = i / steps;
      const color = this._lerpColor(top, bot, stepT);
      g.beginFill(color);
      g.drawRect(-1000, (H * 0.72 * i) / steps, W * 2 + 2000, H * 0.72 / steps + 1);
      g.endFill();
    }
  }

  abstract drawGround(g: PIXI.Graphics, W: number, H: number, groundY: number, groundThickness: number): void;

  updateLayers(layers: ColorLayer[], screenHeight: number, groundThickness: number): void {
    layers.forEach(layer => {
      layer.gfx.alpha = 1;
      layer.gfx.y = screenHeight - groundThickness;
    });
  }

  abstract getRoadConfig(): { amplitude: number; roadColor: number; lineColor: number };

  generatePuddles(width: number): { x: number; width: number }[] {
    return [];
  }

  drawRoadDecorations(g: PIXI.Graphics, puddles: { x: number; width: number }[], getGroundYAt: (x: number) => number): void {
    // Override if needed
  }

  abstract getDustColor(): number;

  emitAtmosphere(width: number, emitCallback: (type: ParticleType, x: number, y: number, vx: number, vy: number, size: number, decay: number, color: number, rotationSpeed?: number) => void): void {
    // Default implementation (e.g. leaves) can be overridden
    if (Math.random() > 0.15) return;
    emitCallback('LEAF', Math.random() * width, -20, -(Math.random() * 2 + 1), Math.random() * 1.2 + 0.5, 3 + Math.random() * 4, 0.008, 0xffcc88, (Math.random() - 0.5) * 0.1);
  }

  emitGroundSplash(x: number, y: number, speed: number, isPuddle: boolean, emitCallback: (type: ParticleType, x: number, y: number, vx: number, vy: number, size: number, decay: number, color: number) => void): void {
    // Default is dust
    const count = Math.floor(speed * 1.5);
    for (let i = 0; i < count; i++) {
      emitCallback('DUST', x + (Math.random() - 0.5) * 10, y, -(speed * 3 + Math.random() * 4), -(Math.random() * 3), 1 + Math.random() * 2, 0.03 + Math.random() * 0.04, this.getDustColor());
    }
  }

  protected _lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return (rr << 16) | (rg << 8) | rb;
  }
}
