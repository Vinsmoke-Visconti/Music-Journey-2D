import * as PIXI from 'pixi.js';
import { VehicleStrategy, VehicleDimensions } from '../VehicleStrategy';

const JEEP_COLORS = {
  body: 0x4d5b45, bodyAccent: 0x3a4434, roof: 0x2c3328,
  window: 0x8ecae6, windowFrame: 0x1a1a1a,
  wheel: 0x1a1a1a, wheelHub: 0x666655, roofRack: 0x555544,
  light: 0xffee88, bumper: 0x222222,
};

export class JeepStrategy implements VehicleStrategy {
  id = 'jeep';
  private W: number = 140;
  private H: number = 60;
  private WR: number = 20;

  getDimensions(): VehicleDimensions {
    return {
      W: this.W,
      H: this.H,
      WR: this.WR,
      wFrontX: this.W / 2 - 25,
      wRearX: -this.W / 2 + 25
    };
  }

  drawBody(container: PIXI.Container): void {
    const g = new PIXI.Graphics();
    container.addChild(g);
    const W = this.W, H = this.H;

    // Body
    g.beginFill(JEEP_COLORS.body); g.drawRoundedRect(-W / 2, -H, W, H, 4); g.endFill();
    g.beginFill(JEEP_COLORS.bodyAccent, 0.5); g.drawRoundedRect(-W / 2, -H / 2, W, H / 2, 4); g.endFill();
    // Flat roof
    g.beginFill(JEEP_COLORS.roof); g.drawRect(-W / 2 + 6, -H, W - 12, 32); g.endFill();
    // Roof rack rails
    g.lineStyle(3, JEEP_COLORS.roofRack, 0.9);
    g.moveTo(-W / 2 + 10, -H + 2); g.lineTo(W / 2 - 10, -H + 2);
    g.moveTo(-W / 2 + 10, -H + 6); g.lineTo(W / 2 - 10, -H + 6);
    for (let cx = -W / 2 + 22; cx < W / 2 - 10; cx += 24) {
      g.moveTo(cx, -H + 1); g.lineTo(cx, -H + 7);
    }
    g.lineStyle(0);

    // Windshield (upright)
    g.beginFill(JEEP_COLORS.windowFrame); g.drawRect(W / 2 - 48, -H + 2, 42, 30); g.endFill();
    g.beginFill(JEEP_COLORS.window, 0.8); g.drawRect(W / 2 - 46, -H + 4, 38, 26); g.endFill();
    g.beginFill(0xffffff, 0.15); g.drawRect(W / 2 - 45, -H + 5, 10, 12); g.endFill();
    // Side window
    g.beginFill(JEEP_COLORS.windowFrame); g.drawRect(-W / 2 + 10, -H + 2, 52, 30); g.endFill();
    g.beginFill(JEEP_COLORS.window, 0.75); g.drawRect(-W / 2 + 12, -H + 4, 48, 26); g.endFill();
    g.beginFill(0xffffff, 0.12); g.drawRect(-W / 2 + 14, -H + 5, 12, 11); g.endFill();

    // Front grille
    g.beginFill(0x1a1a1a); g.drawRoundedRect(W / 2 - 6, -H + 4, 12, 22, 2); g.endFill();
    g.lineStyle(1.5, 0x333333);
    for (let gy = -H + 7; gy < -H + 24; gy += 4) { g.moveTo(W / 2 - 5, gy); g.lineTo(W / 2 + 5, gy); }
    g.lineStyle(0);

    // Round headlights
    g.beginFill(JEEP_COLORS.light, 0.95); g.drawCircle(W / 2 + 2, -H + 14, 6); g.endFill();
    g.beginFill(0xffffff, 0.6); g.drawCircle(W / 2 + 1, -H + 13, 3); g.endFill();
    // Taillight
    g.beginFill(0xff3333); g.drawRoundedRect(-W / 2 - 4, -H + 8, 8, 14, 2); g.endFill();
    // Bumpers
    g.beginFill(JEEP_COLORS.bumper);
    g.drawRect(W / 2 - 4, -H + 26, 12, 10);
    g.drawRect(-W / 2 - 6, -H + 26, 12, 10);
    g.endFill();
    // Spare tire on back
    g.beginFill(JEEP_COLORS.wheel); g.drawCircle(-W / 2 - 10, -H + 18, 13); g.endFill();
    g.beginFill(0x555544); g.drawCircle(-W / 2 - 10, -H + 18, 7); g.endFill();
    g.beginFill(0x222211); g.drawCircle(-W / 2 - 10, -H + 18, 2.5); g.endFill();
    // Tow hook
    g.lineStyle(3, 0x444444);
    g.moveTo(W / 2 + 8, -H + 28); g.lineTo(W / 2 + 12, -H + 28); g.lineTo(W / 2 + 12, -H + 34);
    g.lineStyle(0);
  }

  drawWheels(frontContainer: PIXI.Container, rearContainer: PIXI.Container, WR: number): void {
    const drawJeepWheel = (cont: PIXI.Container) => {
      const wg = new PIXI.Graphics();
      cont.addChild(wg);
      const localX = 0;

      // Tyre
      wg.beginFill(JEEP_COLORS.wheel); wg.drawCircle(localX, 0, WR); wg.endFill();
      wg.lineStyle(4, 0x111111); wg.drawCircle(localX, 0, WR); wg.lineStyle(0);

      // Tread detail for Jeep
      wg.lineStyle(2, 0x111111, 0.5);
      for (let t = 0; t < 8; t++) {
        const a = (t / 8) * Math.PI * 2;
        wg.moveTo(Math.cos(a) * (WR - 3), Math.sin(a) * (WR - 3));
        wg.lineTo(Math.cos(a) * WR, Math.sin(a) * WR);
      }
      wg.lineStyle(0);
      
      // Hub
      wg.beginFill(JEEP_COLORS.wheelHub); wg.drawCircle(localX, 0, WR * 0.55); wg.endFill();
      wg.beginFill(0x444444); wg.drawCircle(localX, 0, WR * 0.15); wg.endFill();
      // Spokes
      const spokeCount = 6;
      wg.lineStyle(2, 0xaaaaaa, 0.9);
      for (let s = 0; s < spokeCount; s++) {
        const a = (s / spokeCount) * Math.PI * 2;
        wg.moveTo(0, 0);
        wg.lineTo(Math.cos(a) * WR * 0.5, Math.sin(a) * WR * 0.5);
      }
      wg.lineStyle(0);
    };

    drawJeepWheel(frontContainer);
    drawJeepWheel(rearContainer);
  }
}
