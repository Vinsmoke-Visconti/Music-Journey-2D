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
  private readonly GROUND_THICKNESS = 250; // Match Road.ts thickness

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
    } else if (env.id === 'jungle') {
      this._buildJungleLayers(W, H);
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
      // Vẽ rộng ra 2 bên để tránh hở khi rung màn hình (camera shake)
      g.drawRect(-1000, (H * 0.72 * i) / steps, W + 2000, H * 0.72 / steps + 1);
      g.endFill();
    }
  }

  private _buildBeachLayers(W: number, H: number): void {
    const groundY = 0;

    // Layer 1: Mây xa (cuộn chậm)
    const cloudGfx = new PIXI.Graphics();
    // Vẽ từ âm để tránh hở lề trái
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
    this.layers.push({ gfx: cloudGfx, scrollSpeed: 0.3, offsetX: 0, color: 0, y: 0, h: 0 });

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
    this.layers.push({ gfx: seaGfx, scrollSpeed: 0.5, offsetX: 0, color: 0, y: 0, h: 0 });

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
    this.layers.push({ gfx: palmGfx, scrollSpeed: 0.75, offsetX: 0, color: 0, y: 0, h: 0 });
  }

  private _buildDesertLayers(W: number, H: number): void {
    const groundY = 0;

    // Mây bụi
    const dustGfx = new PIXI.Graphics();
    for (let x = 80; x < 20000; x += 250 + Math.random() * 150) {
      dustGfx.beginFill(0xd4a855, 0.2);
      dustGfx.drawEllipse(x, 60 + Math.random() * 20, 100, 20);
      dustGfx.endFill();
    }
    this.layers.push({ gfx: dustGfx, scrollSpeed: 0.2, offsetX: 0, color: 0, y: 0, h: 0 });

    // Đồi cát
    const duneGfx = new PIXI.Graphics();
    duneGfx.beginFill(0xc4922a);
    for (let i = 0; i < 80; i++) {
      duneGfx.drawEllipse(i * 250 + 100, groundY - 30, 180, 50);
    }
    duneGfx.endFill();
    this.layers.push({ gfx: duneGfx, scrollSpeed: 0.5, offsetX: 0, color: 0, y: 0, h: 0 });

    // Xương rồng
    const cactusGfx = new PIXI.Graphics();
    for (let cx = 150; cx < 20000; cx += 300 + Math.random() * 100) {
      cactusGfx.beginFill(0x3a7d44);
      cactusGfx.drawRoundedRect(cx - 7, groundY - 90, 14, 90, 5);
      cactusGfx.drawRoundedRect(cx - 22, groundY - 60, 16, 8, 3);
      cactusGfx.drawRoundedRect(cx + 6, groundY - 70, 16, 8, 3);
      cactusGfx.endFill();
    }
    this.layers.push({ gfx: cactusGfx, scrollSpeed: 0.8, offsetX: 0, color: 0, y: 0, h: 0 });
  }

  private _buildSnowLayers(W: number, H: number): void {
    const groundY = 0;

    // Núi xa
    const mountainGfx = new PIXI.Graphics();
    mountainGfx.beginFill(0x8aafc0);
    for (let mx = 100; mx < 20000; mx += 250) {
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
    for (let mx = 100; mx < 20000; mx += 250) {
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
    for (let tx = 80; tx < 20000; tx += 200 + Math.random() * 80) {
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

  private _buildJungleLayers(W: number, H: number): void {
    const groundY = H - this.GROUND_THICKNESS;

    // Layer 1: Bầu trời xanh sáng (nhìn thấy qua kẽ lá) + Mặt trời
    const skyGfx = new PIXI.Graphics();
    // Mặt trời
    skyGfx.beginFill(0xffe066, 0.9);
    skyGfx.drawCircle(W * 0.7, groundY - 220, 38);
    skyGfx.endFill();
    skyGfx.beginFill(0xfff4a3, 0.3);
    skyGfx.drawCircle(W * 0.7, groundY - 220, 58);
    skyGfx.endFill();
    // Vài đám mây trắng nhỏ nhìn qua tán cây
    for (let cx = 0; cx < 25000; cx += 380 + Math.random() * 200) {
      const cy = groundY - 200 - Math.random() * 80;
      skyGfx.beginFill(0xffffff, 0.7);
      skyGfx.drawEllipse(cx, cy, 55, 18);
      skyGfx.endFill();
    }
    this.layers.push({ gfx: skyGfx, scrollSpeed: 0.05, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 2: Cây rừng xa (mờ, scroll chậm)
    const treeFarGfx = new PIXI.Graphics();
    for (let tx = -500; tx < 25000; tx += 55 + Math.random() * 40) {
      const th = 110 + Math.random() * 80;
      const tw = 22 + Math.random() * 18;
      // Thân cây
      treeFarGfx.beginFill(0x2d4a1e, 0.6);
      treeFarGfx.drawRect(tx - 4, groundY - th, 8, th);
      treeFarGfx.endFill();
      // Tán lá oval
      treeFarGfx.beginFill(0x1a3d12, 0.55);
      treeFarGfx.drawEllipse(tx, groundY - th, tw, tw * 0.6);
      treeFarGfx.endFill();
    }
    this.layers.push({ gfx: treeFarGfx, scrollSpeed: 0.2, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 3: Cây rừng giữa (dày, có động vật)
    const treeMidGfx = new PIXI.Graphics();
    const animalPositions: number[] = [];
    for (let tx = -400; tx < 25000; tx += 35 + Math.random() * 30) {
      const th = 130 + Math.random() * 100;
      const tw = 28 + Math.random() * 22;
      const green = Math.random() > 0.5 ? 0x2d6a4f : 0x3a7d44;
      treeMidGfx.beginFill(0x3b2507, 0.9);
      treeMidGfx.drawRect(tx - 5, groundY - th, 10, th);
      treeMidGfx.endFill();
      treeMidGfx.beginFill(green, 0.85);
      treeMidGfx.drawEllipse(tx, groundY - th, tw, tw * 0.65);
      treeMidGfx.drawEllipse(tx - 10, groundY - th + 20, tw * 0.7, tw * 0.5);
      treeMidGfx.drawEllipse(tx + 10, groundY - th + 22, tw * 0.75, tw * 0.5);
      treeMidGfx.endFill();
      // Chọn vị trí đặt động vật ngẫu nhiên (khoảng 1/18)
      if (Math.random() < 0.055) animalPositions.push(tx);
    }

    // Vẽ khỉ trên cành cây
    animalPositions.forEach((ax, idx) => {
      if (idx % 2 === 0) {
        // Khỉ: oval thân + đầu + đuôi
        const ay = groundY - 150 - Math.random() * 60;
        treeMidGfx.beginFill(0x8b5e3c);
        treeMidGfx.drawEllipse(ax, ay, 9, 7);       // Thân
        treeMidGfx.drawCircle(ax + 10, ay - 7, 6);  // Đầu
        treeMidGfx.endFill();
        treeMidGfx.beginFill(0xf0c080);
        treeMidGfx.drawEllipse(ax + 12, ay - 7, 3, 2.5); // Mặt
        treeMidGfx.endFill();
        // Đuôi cong
        treeMidGfx.lineStyle(2, 0x6b3d1c, 1);
        treeMidGfx.moveTo(ax - 9, ay);
        treeMidGfx.bezierCurveTo(ax - 20, ay + 8, ax - 22, ay - 5, ax - 18, ay - 10);
        treeMidGfx.lineStyle(0);
      } else {
        // Chim vẹt: hình tam giác màu sắc
        const ay = groundY - 160 - Math.random() * 70;
        const colors = [0xe63946, 0x06d6a0, 0xffb703, 0x118ab2];
        const c = colors[Math.floor(Math.random() * colors.length)];
        treeMidGfx.beginFill(c, 0.95);
        treeMidGfx.drawPolygon([ax, ay - 14, ax - 7, ay + 6, ax + 7, ay + 6]); // Cánh
        treeMidGfx.endFill();
        treeMidGfx.beginFill(0x222222);
        treeMidGfx.drawCircle(ax + 5, ay - 10, 2.5);  // Mắt
        treeMidGfx.endFill();
        treeMidGfx.beginFill(0xffb703);
        treeMidGfx.drawPolygon([ax + 6, ay - 10, ax + 12, ay - 8, ax + 6, ay - 6]); // Mỏ
        treeMidGfx.endFill();
      }
    });
    this.layers.push({ gfx: treeMidGfx, scrollSpeed: 0.5, offsetX: 0, color: 0, y: 0, h: 0 });

    // Layer 4: Cây tiền cảnh (sát nhất, tán lá to)
    const treeFgGfx = new PIXI.Graphics();
    for (let tx = -300; tx < 25000; tx += 70 + Math.random() * 50) {
      const th = 160 + Math.random() * 80;
      const tw = 42 + Math.random() * 28;
      treeFgGfx.beginFill(0x1b2e10, 0.95);
      treeFgGfx.drawRect(tx - 7, groundY - th, 14, th);
      treeFgGfx.endFill();
      treeFgGfx.beginFill(0x1a4d2e, 0.9);
      treeFgGfx.drawEllipse(tx, groundY - th - 10, tw, tw * 0.6);
      treeFgGfx.drawEllipse(tx - 18, groundY - th + 18, tw * 0.6, tw * 0.45);
      treeFgGfx.drawEllipse(tx + 20, groundY - th + 20, tw * 0.65, tw * 0.45);
      treeFgGfx.endFill();
      // Dương xỉ / cỏ rừng dưới gốc
      treeFgGfx.beginFill(0x2d5a1b, 0.7);
      treeFgGfx.drawEllipse(tx, groundY - 8, 28, 8);
      treeFgGfx.endFill();
    }
    this.layers.push({ gfx: treeFgGfx, scrollSpeed: 0.85, offsetX: 0, color: 0, y: 0, h: 0 });
  }

  private _drawGround(env: Environment): void {
    const g = this.groundGfx;
    g.clear();
    const W = 20000;
    const H = this.app.screen.height;
    const groundY = H - this.GROUND_THICKNESS;

    const groundColors: Record<string, [number, number]> = {
      beach:  [0xf5d17a, 0xe8b84b],
      desert: [0xd4922a, 0xb87820],
      snow:   [0xe8f4f8, 0xc8dce8],
      jungle: [0x4a3728, 0x2e1e10], // Đất rừng ẩm màu nâu
    };
    const [gTop, gBot] = groundColors[env.id] ?? [0x4a7c3f, 0x2d5a2a];
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      g.beginFill(this._lerpColor(gTop, gBot, t));
      g.drawRect(-1000, groundY + (this.GROUND_THICKNESS) * i / steps, W + 2000, (this.GROUND_THICKNESS) / steps + 1000);
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
      
      // Dynamic y positioning based on current screen height
      layer.gfx.y = this.app.screen.height - this.GROUND_THICKNESS;
    });
  }

  resize(env: Environment): void {
    // Only redraw the sky and ground to fill the new screen bounds.
    // We do NOT call loadEnvironment() here to prevent trees/clouds from regenerating and jumping.
    this._drawSkyGradient();
    this._drawGround(env);
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
