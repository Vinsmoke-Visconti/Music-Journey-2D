import * as PIXI from 'pixi.js';

export interface VehicleDimensions {
  W: number;
  H: number;
  WR: number;
  wFrontX: number;
  wRearX: number;
}

export interface VehicleStrategy {
  id: string;
  getDimensions(): VehicleDimensions;
  drawBody(container: PIXI.Container): void;
  drawWheels(frontContainer: PIXI.Container, rearContainer: PIXI.Container, WR: number): void;
}
