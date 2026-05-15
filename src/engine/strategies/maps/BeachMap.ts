import * as PIXI from 'pixi.js';
import { BaseMapStrategy } from '../BaseMapStrategy';
import { ColorLayer } from '../MapStrategy';

export class BeachMap extends BaseMapStrategy {
  id = 'beach';

  buildLayers(W: number, H: number, groundY: number): ColorLayer[] {
    const layers: ColorLayer[] = [];

    // Layer 1: Mây xa (cuộn chậm)
    const cloudGfx = new PIXI.Graphics();
    for (let cx = -1000; cx < 25000; cx += 220 + Math.random() * 100) {
      const cy = 20 + Math.random() * 40;
      const cw = 80 + Math.random() * 60;
      const ch = 20 + Math.random() * 16;
      cloudGfx.beginFill(0xffffff, 0.85);
      cloudGfx.drawEllipse(cx, cy, cw / 2, ch / 2);
      cloudGfx.endFill();
      cloudGfx.beginFill(0xffffff, 0.5);
      cloudGfx.drawEllipse(cx - cw * 0.25, cy + 5, cw * 0.3, ch * 0.45);
      cloudGfx.drawEllipse(cx + cw * 0.2, cy + 5, cw * 0.35, ch * 0.4);
      cloudGfx.endFill();
    }
    layers.push({ gfx: cloudGfx, scrollSpeed: 0.3, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 2: Biển xa (cuộn vừa)
    const seaGfx = new PIXI.Graphics();
    seaGfx.beginFill(0x3a9bd5, 0.8);
    seaGfx.drawRect(-1000, groundY - 80, 26000, 80);
    seaGfx.endFill();
    // Sóng biển
    for (let i = -5; i < 150; i++) {
      seaGfx.beginFill(0x5ab4e8, 0.4);
      seaGfx.drawEllipse(i * 180 + 80, groundY - 50, 90, 12);
      seaGfx.endFill();
    }
    layers.push({ gfx: seaGfx, scrollSpeed: 0.5, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 3: Cây dừa (cuộn gần)
    const palmGfx = new PIXI.Graphics();
    for (let px = -1000; px < 25000; px += 250 + Math.random() * 100) {
      // Thân cây
      palmGfx.beginFill(0x8b6914);
      palmGfx.drawRoundedRect(px - 8, groundY - 120, 16, 120, 4);
      palmGfx.endFill();
      // Tán lá
      for (let leaf = 0; leaf < 6; leaf++) {
        const angle = (leaf / 6) * Math.PI * 2;
        palmGfx.lineStyle(5, 0x2d8a2d);
        palmGfx.moveTo(px, groundY - 120);
        palmGfx.lineTo(
          px + Math.cos(angle) * 55,
          groundY - 120 + Math.sin(angle) * 30 - 20
        );
      }
      palmGfx.lineStyle(0);
    }
    layers.push({ gfx: palmGfx, scrollSpeed: 0.75, offsetX: 0, color: 0, y: 0, h: 0 });

    return layers;
  }

  drawGround(g: PIXI.Graphics, W: number, H: number, groundY: number, groundThickness: number): void {
    g.clear();
    g.beginFill(0xf3e5ab); // Màu nền bãi biển
    g.drawRect(-1000, H - groundThickness, W + 2000, groundThickness);
    g.endFill();
    
    // Line trang trí
    g.beginFill(0xebd78d);
    g.drawRect(-1000, H - groundThickness, W + 2000, 12);
    g.endFill();
  }

  getRoadConfig() {
    return { amplitude: 3.75, roadColor: 0x555555, lineColor: 0xfff176 }; // Default road colors but lower amplitude
  }

  getDustColor() {
    return 0xf3e5ab;
  }
}
