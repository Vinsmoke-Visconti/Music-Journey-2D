// ============================================================
// Road.ts - Procedural Road with Perlin Noise (Giai đoạn 3)
// Music Journey 2D | Infinite Terrain Generation
// ============================================================

import * as PIXI from 'pixi.js';

export class Road {
  private container: PIXI.Container;
  private gfx: PIXI.Graphics;
  private points: { x: number; y: number }[] = [];
  private screenW = 0;
  private screenH = 0;
  private noiseOffset = 0;

  private readonly SEGMENT_WIDTH = 15; // Độ chi tiết của đường
  private readonly GROUND_RATIO  = 0.65; // Vị trí mặt đất cơ bản (65% chiều cao màn hình)

  // Perlin Noise 1D simple implementation
  private seed = Math.random();
  private noiseValues: number[] = [];

  constructor(app: PIXI.Application) {
    this.container = new PIXI.Container();
    this.gfx = new PIXI.Graphics();
    this.container.addChild(this.gfx);
    app.stage.addChild(this.container);

    this.screenW = app.screen.width;
    this.screenH = app.screen.height;

    // Khởi tạo mảng noise ngẫu nhiên
    for (let i = 0; i < 200; i++) {
      this.noiseValues.push(Math.random());
    }
  }

  /** Thuật toán Noise 1D mượt mà */
  private getNoise(x: number): number {
    const scaledX = x * 0.01;
    const i = Math.floor(scaledX);
    const f = scaledX - i;
    
    const noise1 = this.noiseValues[i % this.noiseValues.length];
    const noise2 = this.noiseValues[(i + 1) % this.noiseValues.length];
    
    // Hàm nội suy mượt (Smoothstep)
    const ft = f * Math.PI;
    const f2 = (1 - Math.cos(ft)) * 0.5;
    
    return noise1 * (1 - f2) + noise2 * f2;
  }

  generatePoints(width: number): void {
    this.points = [];
    const count = Math.ceil(width / this.SEGMENT_WIDTH) + 5;
    
    for (let i = 0; i < count; i++) {
      const x = i * this.SEGMENT_WIDTH;
      // Kết hợp nhiều tầng noise (Octaves) để đường trông tự nhiên hơn
      const n1 = this.getNoise(x + this.noiseOffset);
      const n2 = this.getNoise((x + this.noiseOffset) * 2.5) * 0.4;
      const n3 = this.getNoise((x + this.noiseOffset) * 0.5) * 2.0;
      
      const noiseY = (n1 + n2 + n3) * 15; // Biên độ gập ghềnh giảm xuống cho mượt hơn
      
      this.points.push({
        x: x,
        y: this.screenH * this.GROUND_RATIO + noiseY
      });
    }
  }

  update(speed: number, width: number, envId: string): void {
    // Tăng offset dựa trên tốc độ xe
    this.noiseOffset += speed * 5;
    
    // Tạo lại các điểm dựa trên offset mới
    this.generatePoints(width);
    this.draw(envId);
  }

  draw(envId: string): void {
    const g = this.gfx;
    g.clear();

    // Chọn màu đường dựa trên môi trường
    let roadColor = 0x555555; // Mặc định: Nhựa đường
    let lineColor = 0xfff176; // Mặc định: Vạch vàng

    if (envId === 'desert') {
      roadColor = 0xd4a373; 
      lineColor = 0xfaedcd;
    } else if (envId === 'snow') {
      roadColor = 0xa2d2ff;
      lineColor = 0xffffff;
    }

    // Vẽ phần dưới của mặt đất
    g.beginFill(roadColor);
    g.moveTo(0, this.screenH);
    for (const p of this.points) {
      g.lineTo(p.x, p.y);
    }
    g.lineTo(this.screenW, this.screenH);
    g.endFill();

    // Vẽ vạch kẻ đường (vạch đứt)
    g.lineStyle(3, lineColor, 0.6);
    for (let i = 0; i < this.points.length - 2; i += 4) {
      const p = this.points[i];
      const pNext = this.points[i + 1];
      g.moveTo(p.x, p.y - 2);
      g.lineTo(pNext.x, pNext.y - 2);
    }
    g.lineStyle(0);
  }

  getGroundYAt(x: number): number {
    // Tìm đoạn thẳng chứa x và nội suy y
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

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }
}
