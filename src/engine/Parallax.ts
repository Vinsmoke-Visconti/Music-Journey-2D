// ============================================================
// Parallax.ts - Hệ thống nền nhiều lớp dùng PIXI.Graphics (không cần ảnh)
// Music Journey 2D | Giai đoạn 2
// ============================================================

import * as PIXI from 'pixi.js';
import type { Environment } from '../configs/environments';

interface ColorLayer {
  gfx: PIXI.Graphics;
  scrollSpeed: number;
  offsetX: number;
  color: number;
  y: number;
  h: number;
  shapes?: Array<{ x: number; y: number; w: number; h: number; color: number; alpha: number }>;
}

export class Parallax {
  private app: PIXI.Application;
  private layers: ColorLayer[] = [];
  private skyGfx: PIXI.Graphics;
  private groundGfx: PIXI.Graphics;
  private currentEnv: Environment | null = null;
  private currentProgress: number = 0;

  // Cấu hình màu bầu trời theo thời gian (Progress 0 -> 1)
  private readonly TIME_COLORS = [
    { p: 0.0, top: 0x1a1a4e, bot: 0x333366 }, // Đêm (Bắt đầu)
    { p: 0.2, top: 0x87ceeb, bot: 0xfde5a7 }, // Bình minh
    { p: 0.5, top: 0x00b4d8, bot: 0x90e0ef }, // Trưa
    { p: 0.8, top: 0xe07b39, bot: 0xf5c97d }, // Hoàng hôn
    { p: 1.0, top: 0x1a1a4e, bot: 0x333366 }, // Đêm (Kết thúc)
  ];

  constructor(app: PIXI.Application) {
    this.app = app;
    this.skyGfx = new PIXI.Graphics();
    this.groundGfx = new PIXI.Graphics();
    app.stage.addChildAt(this.skyGfx, 0);
    app.stage.addChildAt(this.groundGfx, 1);
  }

  loadEnvironment(env: Environment): void {
    this.currentEnv = env;
    // Xóa layers cũ
    this.layers.forEach(l => this.app.stage.removeChild(l.gfx));
    this.layers = [];

    const W = this.app.screen.width;
    const H = this.app.screen.height;

    this._drawSkyGradient();

    // Tạo layers theo môi trường
    if (env.id === 'beach') {
      this._buildBeachLayers(W, H);
    } else if (env.id === 'desert') {
      this._buildDesertLayers(W, H);
    } else if (env.id === 'snow') {
      this._buildSnowLayers(W, H);
    }

    // Thêm layers vào stage (sau skyGfx, trước road/vehicle)
    this.layers.forEach((l, i) => {
      this.app.stage.addChildAt(l.gfx, i + 2);
    });

    this._drawGround(env);
  }

  private _drawSkyGradient(): void {
    if (!this.currentEnv) return;
    const g = this.skyGfx;
    g.clear();
    const W = 4000;
    const H = this.app.screen.height;

    // Tìm 2 mốc thời gian gần nhất để nội suy
    let startIdx = 0;
    for (let i = 0; i < this.TIME_COLORS.length - 1; i++) {
      if (this.currentProgress >= this.TIME_COLORS[i].p && this.currentProgress <= this.TIME_COLORS[i + 1].p) {
        startIdx = i;
        break;
      }
    }

    const c1 = this.TIME_COLORS[startIdx];
    const c2 = this.TIME_COLORS[startIdx + 1];
    const t = (this.currentProgress - c1.p) / (c2.p - c1.p);

    const top = this._lerpColor(c1.top, c2.top, t);
    const bot = this._lerpColor(c1.bot, c2.bot, t);

    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const stepT = i / steps;
      const color = this._lerpColor(top, bot, stepT);
      g.beginFill(color);
      g.drawRect(0, (H * 0.72 * i) / steps, W, H * 0.72 / steps + 1);
      g.endFill();
    }
  }

  private _buildBeachLayers(W: number, H: number): void {
    const groundY = H * 0.72;

    // Layer 1: Mây xa (cuộn chậm)
    const cloudGfx = new PIXI.Graphics();
    for (let cx = 60; cx < 4000; cx += 220 + Math.random() * 100) {
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
    this.layers.push({ gfx: cloudGfx, scrollSpeed: 0.3, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 2: Biển xa (cuộn vừa)
    const seaGfx = new PIXI.Graphics();
    seaGfx.beginFill(0x3a9bd5, 0.8);
    seaGfx.drawRect(0, groundY - 80, 4000, 80);
    seaGfx.endFill();
    // Sóng biển
    for (let i = 0; i < 22; i++) {
      seaGfx.beginFill(0x5ab4e8, 0.4);
      seaGfx.drawEllipse(i * 180 + 80, groundY - 50, 90, 12);
      seaGfx.endFill();
    }
    this.layers.push({ gfx: seaGfx, scrollSpeed: 0.5, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 3: Cây dừa (cuộn gần)
    const palmGfx = new PIXI.Graphics();
    for (let px = 120; px < 4000; px += 250 + Math.random() * 100) {
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
    this.layers.push({ gfx: palmGfx, scrollSpeed: 0.75, offsetX: 0, color: 0, y: 0, h: 0 });
  }

  private _buildDesertLayers(W: number, H: number): void {
    const groundY = H * 0.72;

    // Mây bụi
    const dustGfx = new PIXI.Graphics();
    for (let x = 80; x < 4000; x += 250 + Math.random() * 150) {
      dustGfx.beginFill(0xd4a855, 0.2);
      dustGfx.drawEllipse(x, 60 + Math.random() * 20, 100, 20);
      dustGfx.endFill();
    }
    this.layers.push({ gfx: dustGfx, scrollSpeed: 0.2, offsetX: 0, color: 0, y: 0, h: 0 });

    // Đồi cát
    const duneGfx = new PIXI.Graphics();
    duneGfx.beginFill(0xc4922a);
    for (let i = 0; i < 16; i++) {
      duneGfx.drawEllipse(i * 250 + 100, groundY - 30, 180, 50);
    }
    duneGfx.endFill();
    this.layers.push({ gfx: duneGfx, scrollSpeed: 0.5, offsetX: 0, color: 0, y: 0, h: 0 });

    // Xương rồng
    const cactusGfx = new PIXI.Graphics();
    for (let cx = 150; cx < 4000; cx += 300 + Math.random() * 100) {
      cactusGfx.beginFill(0x3a7d44);
      cactusGfx.drawRoundedRect(cx - 7, groundY - 90, 14, 90, 5);
      cactusGfx.drawRoundedRect(cx - 22, groundY - 60, 16, 8, 3);
      cactusGfx.drawRoundedRect(cx + 6, groundY - 70, 16, 8, 3);
      cactusGfx.endFill();
    }
    this.layers.push({ gfx: cactusGfx, scrollSpeed: 0.8, offsetX: 0, color: 0, y: 0, h: 0 });
  }

  private _buildSnowLayers(W: number, H: number): void {
    const groundY = H * 0.72;

    // Núi xa
    const mountainGfx = new PIXI.Graphics();
    mountainGfx.beginFill(0x8aafc0);
    for (let mx = 100; mx < 4000; mx += 250) {
      const mh = 180 + Math.random() * 70;
      mountainGfx.drawPolygon([mx - 120, groundY - 20, mx, groundY - mh, mx + 120, groundY - 20]);
    }
    mountainGfx.endFill();
    // Tuyết đỉnh núi
    mountainGfx.beginFill(0xffffff, 0.9);
    for (let mx = 100; mx < 4000; mx += 250) {
      const mh = 180 + Math.random() * 70; // (Approx same random sequence if seeded, but it's okay for visual effect to just overlap snow roughly, wait actually the random height won't match the mountain height!)
    }
    // Let's use a deterministic approach instead of random inside the loop for snow to match mountain height
    // Hoặc lưu vào array
    const mountains: {x: number, h: number}[] = [];
    for (let mx = 100; mx < 4000; mx += 250) {
      mountains.push({ x: mx, h: 180 + Math.random() * 70 });
    }
    mountainGfx.clear();
    mountainGfx.beginFill(0x8aafc0);
    mountains.forEach(m => {
      mountainGfx.drawPolygon([m.x - 120, groundY - 20, m.x, groundY - m.h, m.x + 120, groundY - 20]);
    });
    mountainGfx.endFill();
    
    mountainGfx.beginFill(0xffffff, 0.9);
    mountains.forEach(m => {
      mountainGfx.drawPolygon([m.x - 40, groundY - m.h + 60, m.x, groundY - m.h, m.x + 40, groundY - m.h + 60]);
    });
    mountainGfx.endFill();
    this.layers.push({ gfx: mountainGfx, scrollSpeed: 0.25, offsetX: 0, color: 0, y: 0, h: 0 });

    // Cây thông
    const treeGfx = new PIXI.Graphics();
    for (let tx = 80; tx < 4000; tx += 200 + Math.random() * 80) {
      treeGfx.beginFill(0x2d5a27);
      treeGfx.drawPolygon([tx, groundY - 80, tx - 30, groundY - 20, tx + 30, groundY - 20]);
      treeGfx.drawPolygon([tx, groundY - 100, tx - 22, groundY - 50, tx + 22, groundY - 50]);
      treeGfx.endFill();
      treeGfx.beginFill(0x5c3d1e);
      treeGfx.drawRect(tx - 5, groundY - 20, 10, 20);
      treeGfx.endFill();
      // Tuyết trên cây
      treeGfx.beginFill(0xffffff, 0.7);
      treeGfx.drawEllipse(tx, groundY - 95, 15, 6);
      treeGfx.endFill();
    }
    this.layers.push({ gfx: treeGfx, scrollSpeed: 0.7, offsetX: 0, color: 0, y: 0, h: 0 });
  }

  private _drawGround(env: Environment): void {
    const g = this.groundGfx;
    g.clear();
    const W = 4000;
    const H = this.app.screen.height;
    const groundY = H * 0.72;

    const groundColors: Record<string, [number, number]> = {
      beach:  [0xf5d17a, 0xe8b84b],
      desert: [0xd4922a, 0xb87820],
      snow:   [0xe8f4f8, 0xc8dce8],
    };
    const [gTop, gBot] = groundColors[env.id] ?? [0x4a7c3f, 0x2d5a2a];
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      g.beginFill(this._lerpColor(gTop, gBot, t));
      g.drawRect(0, groundY + (H - groundY) * i / steps, W, (H - groundY) / steps + 1);
      g.endFill();
    }
  }

  // Cập nhật mỗi frame
  update(vehicleSpeed: number, progress: number = 0): void {
    this.currentProgress = progress;
    const W = this.app.screen.width;
    
    // Cập nhật bầu trời theo thời gian
    this._drawSkyGradient();

    this.layers.forEach(layer => {
      layer.offsetX -= vehicleSpeed * layer.scrollSpeed;
      if (layer.offsetX < -W * 1.5) layer.offsetX += W * 1.5;
      layer.gfx.x = layer.offsetX;
      
      // Độ sáng của vật thể (núi, cây) giảm xuống khi về đêm
      const nightFactor = Math.cos((this.currentProgress - 0.5) * Math.PI * 2) * 0.5 + 0.5;
      layer.gfx.alpha = 0.4 + nightFactor * 0.6;
    });
  }

  resize(env: Environment): void {
    this.loadEnvironment(env);
  }

  private _lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return (rr << 16) | (rg << 8) | rb;
  }
}
