// ============================================================
// Road.ts - Procedural Road with Perlin Noise (Giai đoạn 3)
// Music Journey 2D | Infinite Terrain Generation
// ============================================================

import * as PIXI from 'pixi.js';

export class Road {
  private container: PIXI.Container;
  private gfx: PIXI.Graphics;
  private points: { x: number; y: number }[] = [];
  private app: PIXI.Application;
  private noiseOffset = 0;
  private puddles: { x: number; width: number }[] = [];
  private lastEnvId: string = '';

  private readonly SEGMENT_WIDTH = 15; // Độ chi tiết của đường
  private readonly GROUND_THICKNESS = 250; // Độ dày cố định của mặt đất từ cạnh dưới màn hình

  // Perlin Noise 1D simple implementation
  private seed = Math.random();
  private noiseValues: number[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.gfx = new PIXI.Graphics();
    this.container.addChild(this.gfx);
    app.stage.addChild(this.container);

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

  generatePoints(width: number, envId: string): void {
    this.points = [];
    const count = Math.ceil(width / this.SEGMENT_WIDTH) + 5;
    
    // Giảm độ gồ ghề cho Beach và Desert theo yêu cầu (giảm thêm 50% nữa)
    let amplitude = 15;
    if (envId === 'beach' || envId === 'desert') {
      amplitude = 3.75;
    } else if (envId === 'jungle') {
      amplitude = 10; // Hơi gồ ghề như đường mòn trong rừng
    }

    // Tạo vũng nước chỉ khi môi trường thay đổi (tránh flickering mỗi frame)
    if (envId !== this.lastEnvId) {
      this.lastEnvId = envId;
      this._generatePuddles(envId);
    }

    for (let i = 0; i < count; i++) {
      const x = i * this.SEGMENT_WIDTH;
      const n1 = this.getNoise(x + this.noiseOffset);
      const n2 = this.getNoise((x + this.noiseOffset) * 2.5) * 0.4;
      const n3 = this.getNoise((x + this.noiseOffset) * 0.5) * 2.0;
      
      const noiseY = (n1 + n2 + n3) * amplitude;
      
      this.points.push({
        x: x,
        y: this.app.screen.height - this.GROUND_THICKNESS + noiseY
      });
    }
  }

  update(speed: number, width: number, envId: string): void {
    this.noiseOffset += speed * 5;
    this.generatePoints(width, envId);
    this.draw(envId);
  }

  /** Tạo vũng nước cố định khi chuyển môi trường rừng */
  private _generatePuddles(envId: string): void {
    this.puddles = [];
    if (envId !== 'jungle') return;
    const count = 4 + Math.floor(Math.random() * 3); // 4-6 vũng cố định
    const spacing = this.app.screen.width / count;
    for (let i = 0; i < count; i++) {
      this.puddles.push({
        x: spacing * i + 40 + Math.random() * (spacing - 80),
        width: 30 + Math.random() * 45,
      });
    }
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
    } else if (envId === 'jungle') {
      roadColor = 0x5a3e28; // Đất rừng ẩm
      lineColor = 0x4caf50; // Vạch cỏ xanh
    }

    // Vẽ phần dưới của mặt đất (vẽ dư xuống 1000px để không bị lộ nền)
    g.beginFill(roadColor);
    g.moveTo(0, this.app.screen.height + 1000);
    for (const p of this.points) {
      g.lineTo(p.x, p.y);
    }
    const lastX = this.points.length > 0 ? this.points[this.points.length - 1].x : this.app.screen.width;
    g.lineTo(lastX, this.app.screen.height + 1000);
    g.endFill();

    // Vẽ vũng nước (Jungle)
    if (envId === 'jungle') {
      for (const pud of this.puddles) {
        const groundY = this.getGroundYAt(pud.x + pud.width / 2);
        // Bóng nước tối
        g.beginFill(0x2a5298, 0.55);
        g.drawEllipse(pud.x + pud.width / 2, groundY - 3, pud.width / 2, 5);
        g.endFill();
        // Ánh sáng phản chiếu trên mặt nước
        g.beginFill(0x7ec8e3, 0.3);
        g.drawEllipse(pud.x + pud.width / 2 - 5, groundY - 4, pud.width / 4, 2);
        g.endFill();
      }
    }

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
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + (p2.y - p1.y) * t;
      }
    }
    return this.app.screen.height - this.GROUND_THICKNESS;
  }

  /** Kiểm tra xe có đang đi qua vũng nước không */
  getPuddleAt(x: number): boolean {
    for (const pud of this.puddles) {
      if (x >= pud.x && x <= pud.x + pud.width) return true;
    }
    return false;
  }

  resize(w: number, h: number): void {}
}
