import * as PIXI from 'pixi.js';
import { VehicleStrategy, VehicleDimensions } from '../VehicleStrategy';

const VAN_COLORS = {
  body: 0xe8742a, bodyAccent: 0xd4601a, roof: 0xc45010,
  window: 0x7ec8e3, windowFrame: 0x333333,
  wheel: 0x222222, wheelHub: 0x888888, stripe: 0xf9c74f,
  bumper: 0x555555, light: 0xffee88, exhaust: 0x666666,
};

export class VanStrategy implements VehicleStrategy {
  id = 'van';
  private W: number;
  private H: number;
  private WR: number;

  constructor() {
    const scale = 1.5;
    this.W = 140 * scale;
    this.H = 60 * scale;
    this.WR = 12 * scale;
  }

  getDimensions(): VehicleDimensions {
    return {
      W: this.W,
      H: this.H,
      WR: this.WR,
      wFrontX: (this.W / 2 - 75),
      wRearX: (-this.W / 2 + 60)
    };
  }

  drawBody(container: PIXI.Container): void {
    const sprite = PIXI.Sprite.from('assets/vehicles/vehicle_vans_no_wheel.png');
    sprite.anchor.set(0.5, 1);
    sprite.width = this.W;
    sprite.height = this.H;
    container.addChild(sprite);

    const g = new PIXI.Graphics();
    container.addChild(g);
  }

  drawWheels(frontContainer: PIXI.Container, rearContainer: PIXI.Container, WR: number): void {
    const drawVanWheel = (cont: PIXI.Container) => {
      const sprite = PIXI.Sprite.from('assets/vehicles/van_orange_wheel.png');
      sprite.anchor.set(0.5);
      sprite.width = WR * 2;
      sprite.height = WR * 2;
      cont.addChild(sprite);
    };

    drawVanWheel(frontContainer);
    drawVanWheel(rearContainer);
  }
}
