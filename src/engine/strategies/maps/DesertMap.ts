import * as PIXI from 'pixi.js';
import { BaseMapStrategy } from '../BaseMapStrategy';
import { ColorLayer } from '../MapStrategy';

export class DesertMap extends BaseMapStrategy {
  id = 'desert';

  buildLayers(W: number, H: number, groundY: number): ColorLayer[] {
    const layers: ColorLayer[] = [];

    // Mây bụi
    const dustGfx = new PIXI.Graphics();
    for (let x = 80; x < 20000; x += 250 + Math.random() * 150) {
      dustGfx.beginFill(0xd4a855, 0.2);
      dustGfx.drawEllipse(x, 60 + Math.random() * 20, 100, 20);
      dustGfx.endFill();
    }
    layers.push({ gfx: dustGfx, scrollSpeed: 0.2, offsetX: 0, color: 0, y: 0, h: 0 });

    // Đồi cát
    const duneGfx = new PIXI.Graphics();
    duneGfx.beginFill(0xc4922a);
    for (let i = 0; i < 80; i++) {
      duneGfx.drawEllipse(i * 250 + 100, groundY - 30, 180, 50);
    }
    duneGfx.endFill();
    layers.push({ gfx: duneGfx, scrollSpeed: 0.5, offsetX: 0, color: 0, y: 0, h: 0 });

    // Xương rồng xa (nhỏ hơn, mờ hơn, ngẫu nhiên)
    const farCactusGfx = new PIXI.Graphics();
    for (let cx = 100; cx < 20000; cx += 400 + Math.random() * 300) {
      if (Math.random() > 0.3) { // Tỉ lệ xuất hiện
        farCactusGfx.beginFill(0x2a5d34);
        farCactusGfx.drawRoundedRect(cx - 6, groundY - 70, 12, 70, 4);
        farCactusGfx.drawRoundedRect(cx - 16, groundY - 40, 12, 8, 3); // ngang trái
        farCactusGfx.drawRoundedRect(cx - 16, groundY - 50, 6, 18, 3); // dọc trái
        farCactusGfx.drawRoundedRect(cx + 4, groundY - 50, 14, 8, 3); // ngang phải
        farCactusGfx.drawRoundedRect(cx + 12, groundY - 60, 6, 18, 3); // dọc phải
        farCactusGfx.endFill();
      }
    }
    layers.push({ gfx: farCactusGfx, scrollSpeed: 0.4, offsetX: 0, color: 0, y: 0, h: 0 });

    // Xương rồng gần (To gấp đôi, có gai, có hoa)
    const cactusGfx = new PIXI.Graphics();
    for (let cx = 150; cx < 20000; cx += 350 + Math.random() * 200) {
      cactusGfx.beginFill(0x3a7d44);
      // Thân chính
      const mainH = 150 + Math.random() * 50;
      cactusGfx.drawRoundedRect(cx - 14, groundY - mainH, 28, mainH, 10);
      
      // Nhánh trái
      const leftY = groundY - mainH * 0.6;
      cactusGfx.drawRoundedRect(cx - 40, leftY, 28, 16, 8); // ngang
      cactusGfx.drawRoundedRect(cx - 40, leftY - 30, 16, 46, 8); // dọc
      
      // Nhánh phải
      const rightY = groundY - mainH * 0.75;
      cactusGfx.drawRoundedRect(cx + 12, rightY, 32, 16, 8); // ngang
      cactusGfx.drawRoundedRect(cx + 28, rightY - 40, 16, 56, 8); // dọc
      cactusGfx.endFill();

      // Gai (thân chính)
      cactusGfx.lineStyle(2, 0x1b4d24, 0.8);
      for (let y = groundY - mainH + 20; y < groundY - 20; y += 30) {
         cactusGfx.moveTo(cx - 14, y); cactusGfx.lineTo(cx - 20, y - 4);
         cactusGfx.moveTo(cx + 14, y + 15); cactusGfx.lineTo(cx + 20, y + 11);
      }
      // Gai (nhánh dọc)
      cactusGfx.moveTo(cx - 40, leftY - 10); cactusGfx.lineTo(cx - 46, leftY - 14);
      cactusGfx.moveTo(cx + 44, rightY - 20); cactusGfx.lineTo(cx + 50, rightY - 24);
      cactusGfx.lineStyle(0);

      // Hoa (tỉ lệ xuất hiện 30%)
      if (Math.random() < 0.3) {
         cactusGfx.beginFill(0xe91e63); // Hoa hồng đỏ
         const fx = cx;
         const fy = groundY - mainH;
         cactusGfx.drawCircle(fx, fy - 2, 8);
         cactusGfx.drawCircle(fx - 6, fy + 2, 6);
         cactusGfx.drawCircle(fx + 6, fy + 2, 6);
         cactusGfx.endFill();
         
         cactusGfx.beginFill(0xffeb3b); // Nhụy vàng
         cactusGfx.drawCircle(fx, fy, 4);
         cactusGfx.endFill();
      }
    }
    layers.push({ gfx: cactusGfx, scrollSpeed: 0.8, offsetX: 0, color: 0, y: 0, h: 0 });

    return layers;
  }

  drawGround(g: PIXI.Graphics, W: number, H: number, groundY: number, groundThickness: number): void {
    g.clear();
    g.beginFill(0xebd78d); // Màu cát
    g.drawRect(-1000, H - groundThickness, W + 2000, groundThickness);
    g.endFill();
  }

  getRoadConfig() {
    return { amplitude: 3.75, roadColor: 0xd4a373, lineColor: 0xfaedcd };
  }

  getDustColor() {
    return 0xc4a35a;
  }
}
