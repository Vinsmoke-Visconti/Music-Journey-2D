import * as PIXI from 'pixi.js';
import { VehicleStrategy, VehicleDimensions } from '../VehicleStrategy';

const PICKUP_COLORS = {
  body: 0x1e3a5f, bodyAccent: 0x152b47, roof: 0x102035,
  window: 0x7ec8e3, windowFrame: 0x111111,
  wheel: 0x1a1a1a, wheelHub: 0x888888,
  bed: 0x162d4a, light: 0xffee88, bumper: 0x444444,
};

export class PickupStrategy implements VehicleStrategy {
  id = 'pickup';
  private W: number = 150;
  private H: number = 55;
  private WR: number = 18;

  getDimensions(): VehicleDimensions {
    return {
      W: this.W,
      H: this.H,
      WR: this.WR,
      wFrontX: this.W / 2 - 30,
      wRearX: -this.W / 2 + 30
    };
  }

  drawBody(container: PIXI.Container): void {
    const g = new PIXI.Graphics();
    container.addChild(g);
    const W = this.W, H = this.H;
    const cabW = 95; // cab takes 95px from front

    // Flatbed (rear, lower)
    g.beginFill(PICKUP_COLORS.bed); g.drawRoundedRect(-W / 2, -H + 14, W - cabW + 10, H - 14, 3); g.endFill();
    // Bed inner floor
    g.beginFill(PICKUP_COLORS.bed); g.drawRect(-W / 2 + 4, -H + 18, W - cabW + 2, H - 22); g.endFill();
    // Bed side rails
    g.lineStyle(3, PICKUP_COLORS.bodyAccent, 1);
    g.moveTo(-W / 2 + 2, -H + 14); g.lineTo(-W / 2 + 2, -H + 4);
    g.lineStyle(0);
    // Roll bar
    g.lineStyle(5, 0x334455, 1);
    g.moveTo(-W / 2 + W - cabW - 8, -H + 14); g.lineTo(-W / 2 + W - cabW - 8, -H - 8);
    g.moveTo(-W / 2 + W - cabW - 28, -H + 14); g.lineTo(-W / 2 + W - cabW - 28, -H - 8);
    g.moveTo(-W / 2 + W - cabW - 8, -H - 8); g.lineTo(-W / 2 + W - cabW - 28, -H - 8);
    g.lineStyle(0);

    // Cab body
    const cabX = W / 2 - cabW;
    g.beginFill(PICKUP_COLORS.body); g.drawRoundedRect(cabX, -H, cabW, H, 5); g.endFill();
    g.beginFill(PICKUP_COLORS.bodyAccent, 0.45); g.drawRoundedRect(cabX, -H / 2, cabW, H / 2, 5); g.endFill();
    // Cab roof (slight slope)
    g.beginFill(PICKUP_COLORS.roof);
    g.moveTo(cabX + 5, -H); g.lineTo(cabX + cabW - 8, -H);
    g.lineTo(cabX + cabW - 2, -H + 26); g.lineTo(cabX, -H + 26);
    g.closePath(); g.endFill();

    // Windshield
    g.beginFill(PICKUP_COLORS.windowFrame); g.drawRoundedRect(cabX + cabW - 48, -H + 2, 42, 26, 3); g.endFill();
    g.beginFill(PICKUP_COLORS.window, 0.82); g.drawRoundedRect(cabX + cabW - 46, -H + 4, 38, 22, 2); g.endFill();
    g.beginFill(0xffffff, 0.15); g.drawRect(cabX + cabW - 45, -H + 5, 10, 10); g.endFill();
    // Side window
    g.beginFill(PICKUP_COLORS.windowFrame); g.drawRoundedRect(cabX + 8, -H + 2, 35, 26, 3); g.endFill();
    g.beginFill(PICKUP_COLORS.window, 0.78); g.drawRoundedRect(cabX + 10, -H + 4, 31, 22, 2); g.endFill();
    g.beginFill(0xffffff, 0.12); g.drawRect(cabX + 12, -H + 5, 9, 10); g.endFill();

    // Headlight
    g.beginFill(PICKUP_COLORS.light); g.drawRoundedRect(W / 2 - 8, -H + 8, 10, 9, 2); g.endFill();
    g.beginFill(0xffffff, 0.5); g.drawRoundedRect(W / 2 - 7, -H + 9, 7, 6, 1); g.endFill();
    // DRL strip
    g.lineStyle(2, PICKUP_COLORS.light, 0.7);
    g.moveTo(W / 2 - 8, -H + 7); g.lineTo(W / 2 - 8, -H + 19);
    g.lineStyle(0);
    // Taillight
    g.beginFill(0xff3333); g.drawRoundedRect(-W / 2 - 2, -H + 20, 6, 14, 2); g.endFill();
    // Front bumper
    g.beginFill(PICKUP_COLORS.bumper); g.drawRoundedRect(W / 2 - 6, -H + 20, 10, 14, 2); g.endFill();
    // Rear bumper
    g.beginFill(PICKUP_COLORS.bumper); g.drawRoundedRect(-W / 2 - 4, -H + 24, 10, 10, 2); g.endFill();
    // Toolbox in bed
    g.beginFill(0x334466); g.drawRoundedRect(-W / 2 + W - cabW - 24, -H + 19, 30, 12, 2); g.endFill();
    g.lineStyle(1, 0x445577); g.moveTo(-W / 2 + W - cabW - 10, -H + 19); g.lineTo(-W / 2 + W - cabW - 10, -H + 31); g.lineStyle(0);
  }

  drawWheels(frontContainer: PIXI.Container, rearContainer: PIXI.Container, WR: number): void {
    const drawPickupWheel = (cont: PIXI.Container) => {
      const wg = new PIXI.Graphics();
      cont.addChild(wg);
      const localX = 0;

      // Tyre
      wg.beginFill(PICKUP_COLORS.wheel); wg.drawCircle(localX, 0, WR); wg.endFill();
      wg.lineStyle(3, 0x111111); wg.drawCircle(localX, 0, WR); wg.lineStyle(0);

      // Hub
      wg.beginFill(PICKUP_COLORS.wheelHub); wg.drawCircle(localX, 0, WR * 0.55); wg.endFill();
      wg.beginFill(0x444444); wg.drawCircle(localX, 0, WR * 0.15); wg.endFill();
      // Spokes
      const spokeCount = 5;
      wg.lineStyle(2, 0xaaaaaa, 0.9);
      for (let s = 0; s < spokeCount; s++) {
        const a = (s / spokeCount) * Math.PI * 2;
        wg.moveTo(0, 0);
        wg.lineTo(Math.cos(a) * WR * 0.5, Math.sin(a) * WR * 0.5);
      }
      wg.lineStyle(0);
    };

    drawPickupWheel(frontContainer);
    drawPickupWheel(rearContainer);
  }
}
