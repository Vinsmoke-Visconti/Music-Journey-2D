import * as PIXI from 'pixi.js';
import { BaseMapStrategy } from '../BaseMapStrategy';
import { ColorLayer } from '../MapStrategy';
import { ParticleType } from '../../Particles';

export class SnowMap extends BaseMapStrategy {
  id = 'snow';

  buildLayers(W: number, H: number, groundY: number): ColorLayer[] {
    const layers: ColorLayer[] = [];

    // Layer 1: Núi tuyết xa
    const mtnFarGfx = new PIXI.Graphics();
    mtnFarGfx.beginFill(0x8b9dc3, 1);
    for (let x = 0; x < 5000; x += 150) {
      mtnFarGfx.moveTo(x, groundY);
      mtnFarGfx.lineTo(x + 100, groundY - 120 - Math.random() * 50);
      mtnFarGfx.lineTo(x + 200, groundY);
    }
    mtnFarGfx.endFill();
    mtnFarGfx.beginFill(0xffffff, 0.7);
    for (let x = 0; x < 5000; x += 150) {
      mtnFarGfx.moveTo(x + 100, groundY - 120 - Math.random() * 50);
      mtnFarGfx.lineTo(x + 120, groundY - 80);
      mtnFarGfx.lineTo(x + 80, groundY - 90);
    }
    mtnFarGfx.endFill();
    layers.push({ gfx: mtnFarGfx, scrollSpeed: 0.1, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 2: Đồi tuyết gần
    const hillGfx = new PIXI.Graphics();
    hillGfx.beginFill(0xe0e6ed, 1);
    for (let x = 0; x < 5000; x += 100) {
      hillGfx.drawCircle(x, groundY, 60 + Math.random() * 30);
    }
    hillGfx.endFill();
    layers.push({ gfx: hillGfx, scrollSpeed: 0.3, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 3: Cây thông phủ tuyết
    const pineGfx = new PIXI.Graphics();
    for (let px = 0; px < 5000; px += 100 + Math.random() * 50) {
      const ph = 60 + Math.random() * 40;
      pineGfx.beginFill(0x3e2723); // Thân
      pineGfx.drawRect(px - 4, groundY - ph, 8, ph);
      pineGfx.endFill();
      pineGfx.beginFill(0x1b5e20); // Lá
      pineGfx.drawPolygon([px, groundY - ph - 20, px - 15, groundY - ph / 2, px + 15, groundY - ph / 2]);
      pineGfx.drawPolygon([px, groundY - ph + 10, px - 20, groundY - 10, px + 20, groundY - 10]);
      pineGfx.endFill();
      pineGfx.beginFill(0xffffff, 0.8); // Tuyết trên lá
      pineGfx.drawPolygon([px, groundY - ph - 20, px - 8, groundY - ph / 2, px + 5, groundY - ph / 2 - 5]);
      pineGfx.endFill();
    }
    layers.push({ gfx: pineGfx, scrollSpeed: 0.6, offsetX: 0, color: 0, y: 0, h: 0 });

    return layers;
  }

  drawGround(g: PIXI.Graphics, W: number, H: number, groundY: number, groundThickness: number): void {
    g.clear();
    const gTop = 0xffffff;
    const gBot = 0xb0c4de;
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      g.beginFill(this._lerpColor(gTop, gBot, t));
      g.drawRect(-1000, H - groundThickness + (groundThickness) * i / steps, W + 2000, (groundThickness) / steps + 1000);
      g.endFill();
    }
  }

  getRoadConfig() {
    return { amplitude: 3, roadColor: 0x90a4ae, lineColor: 0xcfd8dc };
  }

  getRoadSlope(audioData?: { bassEnergy: number; trebleEnergy: number }): number {
    if (!audioData) return 0;
    // Nhạc trầm (bass mạnh) -> đường đi dốc xuống tối đa 18 độ
    if (audioData.bassEnergy > 0.6) return 18 * audioData.bassEnergy;
    // Nhạc bổng hoặc bình thường (treble cao hoặc cường độ chung trung bình, ko bass) -> dốc lên tối đa 18 độ
    if (audioData.bassEnergy < 0.3 && audioData.trebleEnergy > 0.3) return -18 * audioData.trebleEnergy;
    // Nhạc nhẹ -> bằng phẳng
    return 0;
  }

  getDustColor() {
    return 0xffffff;
  }

  emitAtmosphere(width: number, emitCallback: (type: ParticleType, x: number, y: number, vx: number, vy: number, size: number, decay: number, color: number, rotationSpeed?: number) => void): void {
    if (Math.random() > 0.4) return;
    emitCallback('SNOW', Math.random() * width, -20, (Math.random() - 0.5) * 2, Math.random() * 2 + 1, 1 + Math.random() * 3, 0.005, 0xffffff, (Math.random() - 0.5) * 0.05);
  }
}
