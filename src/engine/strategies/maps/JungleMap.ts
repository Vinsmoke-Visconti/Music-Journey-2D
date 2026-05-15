import * as PIXI from 'pixi.js';
import { BaseMapStrategy } from '../BaseMapStrategy';
import { ColorLayer } from '../MapStrategy';
import { ParticleType } from '../../Particles';

export class JungleMap extends BaseMapStrategy {
  id = 'jungle';
  private sunGfx: PIXI.Graphics | null = null;
  private puddles: { x: number; width: number }[] = [];

  buildLayers(W: number, H: number, groundY: number): ColorLayer[] {
    const layers: ColorLayer[] = [];

    // Layer 1: Bầu trời xanh sáng (nhìn thấy qua kẽ lá) + Mặt trời
    const skyGfx = new PIXI.Graphics();

    // Mặt trời
    const sunGfx = new PIXI.Graphics();
    const auraSteps = 20;
    for (let i = 0; i < auraSteps; i++) {
      const radius = 100 - (i * 3.5);
      const alpha = 0.03 + (i / auraSteps) * 0.15;
      sunGfx.beginFill(0xff5722, alpha); // Orange-red aura
      sunGfx.drawCircle(0, 0, radius);
      sunGfx.endFill();
    }
    const numRays = 12;
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      sunGfx.beginFill(0xff7043, 0.5);
      sunGfx.moveTo(Math.cos(angle - 0.1) * 38, Math.sin(angle - 0.1) * 38);
      sunGfx.lineTo(Math.cos(angle) * 75, Math.sin(angle) * 75);
      sunGfx.lineTo(Math.cos(angle + 0.1) * 38, Math.sin(angle + 0.1) * 38);
      sunGfx.endFill();
    }
    sunGfx.beginFill(0xe64a19, 1); // Deep Red-Orange core
    sunGfx.drawCircle(0, 0, 38);
    sunGfx.endFill();

    sunGfx.x = W * 0.7;
    sunGfx.y = groundY - 220;
    this.sunGfx = sunGfx;
    skyGfx.addChild(sunGfx);

    // Vài đám mây trắng nhỏ nhìn qua tán cây
    for (let cx = 0; cx < 25000; cx += 380 + Math.random() * 200) {
      const cy = groundY - 200 - Math.random() * 80;
      skyGfx.beginFill(0xffffff, 0.7);
      skyGfx.drawEllipse(cx, cy, 55, 18);
      skyGfx.endFill();
    }
    layers.push({ gfx: skyGfx, scrollSpeed: 0.05, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 2: Cây rừng xa (mờ ơi, scroll chậm)
    const treeFarGfx = new PIXI.Graphics();
    for (let tx = -500; tx < 25000; tx += 55 + Math.random() * 40) {
      const th = 110 + Math.random() * 80;
      const tw = 22 + Math.random() * 18;
      treeFarGfx.beginFill(0x3e2723, 1);
      treeFarGfx.drawRect(tx - 16, groundY - th, 32, th);
      treeFarGfx.endFill();
      treeFarGfx.beginFill(0x33691e, 1);
      treeFarGfx.drawEllipse(tx, groundY - th, tw, tw * 0.6);
      treeFarGfx.drawEllipse(tx - 8, groundY - th + 15, tw * 0.65, tw * 0.5);
      treeFarGfx.drawEllipse(tx + 8, groundY - th + 15, tw * 0.65, tw * 0.5);
      treeFarGfx.endFill();
    }
    layers.push({ gfx: treeFarGfx, scrollSpeed: 0.2, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 3: Cây rừng giữa (dày, có động vật)
    const treeMidGfx = new PIXI.Graphics();
    const animalPositions: number[] = [];
    for (let tx = -400; tx < 25000; tx += 35 + Math.random() * 30) {
      const th = 130 + Math.random() * 100;
      const tw = 28 + Math.random() * 22;
      const green = Math.random() > 0.5 ? 0x2e7d32 : 0x388e3c;
      treeMidGfx.beginFill(0x4e342e, 1);
      treeMidGfx.drawRect(tx - 20, groundY - th, 40, th);
      treeMidGfx.endFill();
      treeMidGfx.beginFill(green, 0.8);
      treeMidGfx.drawEllipse(tx, groundY - th, tw, tw * 0.65);
      treeMidGfx.drawEllipse(tx - 15, groundY - th + 25, tw * 0.7, tw * 0.5);
      treeMidGfx.drawEllipse(tx + 15, groundY - th + 25, tw * 0.75, tw * 0.5);
      treeMidGfx.endFill();
      if (Math.random() < 0.055) animalPositions.push(tx);
    }

    // Vẽ khỉ trên cành cây
    animalPositions.forEach((ax, idx) => {
      if (idx % 2 === 0) {
        const ay = groundY - 150 - Math.random() * 60;
        treeMidGfx.beginFill(0x8b5e3c);
        treeMidGfx.drawEllipse(ax, ay, 9, 7);
        treeMidGfx.drawCircle(ax + 10, ay - 7, 6);
        treeMidGfx.endFill();
        treeMidGfx.beginFill(0xf0c080);
        treeMidGfx.drawEllipse(ax + 12, ay - 7, 3, 2.5);
        treeMidGfx.endFill();
        treeMidGfx.lineStyle(2, 0x6b3d1c, 1);
        treeMidGfx.moveTo(ax - 9, ay);
        treeMidGfx.bezierCurveTo(ax - 20, ay + 8, ax - 22, ay - 5, ax - 18, ay - 10);
        treeMidGfx.lineStyle(0);
      } else {
        const ay = groundY - 160 - Math.random() * 70;
        const colors = [0xe63946, 0x06d6a0, 0xffb703, 0x118ab2];
        const c = colors[Math.floor(Math.random() * colors.length)];
        treeMidGfx.beginFill(c, 0.95);
        treeMidGfx.drawPolygon([ax, ay - 14, ax - 7, ay + 6, ax + 7, ay + 6]);
        treeMidGfx.endFill();
        treeMidGfx.beginFill(0x222222);
        treeMidGfx.drawCircle(ax + 5, ay - 10, 2.5);
        treeMidGfx.endFill();
        treeMidGfx.beginFill(0xffb703);
        treeMidGfx.drawPolygon([ax + 6, ay - 10, ax + 12, ay - 8, ax + 6, ay - 6]);
        treeMidGfx.endFill();
      }
    });
    layers.push({ gfx: treeMidGfx, scrollSpeed: 0.5, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 4: Cây tiền cảnh
    const treeFgGfx = new PIXI.Graphics();
    for (let tx = -300; tx < 25000; tx += 70 + Math.random() * 50) {
      const th = 160 + Math.random() * 80;
      const tw = 42 + Math.random() * 28;
      treeFgGfx.beginFill(0x3e2723, 0.96);
      treeFgGfx.drawRect(tx - 24, groundY - th, 48, th);
      treeFgGfx.endFill();
      treeFgGfx.beginFill(0x1b5e20, 0.95);
      treeFgGfx.drawEllipse(tx, groundY - th - 10, tw, tw * 0.6);
      treeFgGfx.drawEllipse(tx - 25, groundY - th + 20, tw * 0.6, tw * 0.45);
      treeFgGfx.drawEllipse(tx + 25, groundY - th + 22, tw * 0.65, tw * 0.45);
      treeFgGfx.endFill();
      treeFgGfx.beginFill(0x2e7d32, 1);
      treeFgGfx.drawEllipse(tx, groundY - 8, 28, 8);
      treeFgGfx.endFill();
    }
    layers.push({ gfx: treeFgGfx, scrollSpeed: 0.85, offsetX: 0, color: 0, y: 0, h: 0 });

    return layers;
  }

  drawSkyGradient(g: PIXI.Graphics, W: number, H: number, progress: number): void {
    // Jungle doesn't use the regular gradient, it relies on skyGfx
  }

  drawGround(g: PIXI.Graphics, W: number, H: number, groundY: number, groundThickness: number): void {
    g.clear();
    const gTop = 0x4a3728;
    const gBot = 0x2e1e10;
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      g.beginFill(this._lerpColor(gTop, gBot, t));
      g.drawRect(-1000, H - groundThickness + (groundThickness) * i / steps, W + 2000, (groundThickness) / steps + 1000);
      g.endFill();
    }
  }

  updateLayers(layers: ColorLayer[], screenHeight: number, groundThickness: number): void {
    super.updateLayers(layers, screenHeight, groundThickness);
    if (this.sunGfx) {
      this.sunGfx.rotation += 0.005;
      // Adjust sun Y position based on screen resize if needed, but groundY stays same relative
    }
  }

  getRoadConfig() {
    return { amplitude: 10, roadColor: 0x5a3e28, lineColor: 0x4caf50 };
  }

  getDustColor() {
    return 0x6b4226;
  }

  generatePuddles(width: number): { x: number; width: number }[] {
    const puddles = [];
    const count = 4 + Math.floor(Math.random() * 3);
    const spacing = width / count;
    for (let i = 0; i < count; i++) {
      puddles.push({
        x: spacing * i + 40 + Math.random() * (spacing - 80),
        width: 30 + Math.random() * 45,
      });
    }
    this.puddles = puddles;
    return puddles;
  }

  drawRoadDecorations(g: PIXI.Graphics, puddles: { x: number; width: number }[], getGroundYAt: (x: number) => number): void {
    for (const pud of puddles) {
      const groundY = getGroundYAt(pud.x + pud.width / 2);
      g.beginFill(0x2a5298, 0.55);
      g.drawEllipse(pud.x + pud.width / 2, groundY - 3, pud.width / 2, 5);
      g.endFill();
      g.beginFill(0x7ec8e3, 0.3);
      g.drawEllipse(pud.x + pud.width / 2 - 5, groundY - 4, pud.width / 4, 2);
      g.endFill();
    }
  }

  emitGroundSplash(x: number, y: number, speed: number, isPuddle: boolean, emitCallback: (type: ParticleType, x: number, y: number, vx: number, vy: number, size: number, decay: number, color: number) => void): void {
    if (isPuddle) {
      const count = Math.floor(speed * 3);
      for (let i = 0; i < count; i++) {
        emitCallback('MUD', x + (Math.random() - 0.5) * 20, y, -(speed * 2 + Math.random() * 4), -(Math.random() * 4 + 2), 2 + Math.random() * 4, 0.02 + Math.random() * 0.05, 0x6b4226);
      }
    } else {
      super.emitGroundSplash(x, y, speed, isPuddle, emitCallback);
    }
  }
}
