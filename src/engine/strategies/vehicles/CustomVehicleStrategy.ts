import * as PIXI from 'pixi.js';
import { VehicleStrategy, VehicleDimensions } from '../VehicleStrategy';

export const CUSTOM_GRID_COLS  = 64;
export const CUSTOM_GRID_ROWS  = 32;
export const CUSTOM_WHEEL_COLS = 24;
export const CUSTOM_WHEEL_ROWS = 24;

const BODY_PX  = 3.3;
const WHEEL_PX = 1.5;

const W  = CUSTOM_GRID_COLS  * BODY_PX;   // 211.2
const H  = CUSTOM_GRID_ROWS  * BODY_PX;   // 105.6
const WR = (CUSTOM_WHEEL_COLS * WHEEL_PX) / 2; // 18

export function makeBlankGrid(): number[][] {
  return Array.from({ length: CUSTOM_GRID_ROWS }, () => new Array(CUSTOM_GRID_COLS).fill(0));
}
export function makeBlankWheelGrid(): number[][] {
  return Array.from({ length: CUSTOM_WHEEL_ROWS }, () => new Array(CUSTOM_WHEEL_COLS).fill(0));
}

/** Scale-up the old 32×16 default body to 64×32 by doubling each pixel */
export function makeDefaultBodyGrid(): number[][] {
  const _ = 0, B = 0x1a1a2e, C = 0x533483, W2 = 0xf8f9fa,
        Y = 0xf9c74f, R = 0xe94560, G = 0x6c757d, T = 0x343a40;
  // prettier-ignore
  const small: number[][] = [
    [_,_,_,_,_,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,Y,Y,_,_],
    [_,_,_,_,R,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,Y,_],
    [_,_,_,R,B,B,C,C,C,C,C,B,B,B,B,B,W2,W2,W2,W2,W2,B,B,B,B,B,B,B,B,B,Y,_],
    [_,_,R,B,B,B,C,W2,W2,C,C,B,B,B,B,B,W2,W2,W2,W2,W2,B,B,B,B,B,B,B,B,B,B,_],
    [_,_,R,B,B,B,C,W2,W2,C,C,B,B,B,B,B,W2,W2,W2,W2,W2,B,B,B,B,B,B,B,B,B,B,_],
    [_,_,R,B,B,B,C,C,C,C,C,B,B,B,B,B,W2,W2,W2,W2,W2,B,B,B,B,B,B,B,B,B,B,_],
    [_,_,R,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_],
    [_,_,R,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_],
    [_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_],
    [_,_,_,_,T,T,T,T,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,_,_,_,_],
    [_,_,_,T,T,T,T,T,T,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,_,_,_],
    [_,_,_,T,T,_,_,T,T,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,_,_,T,T,_,_,_],
    [_,_,_,T,T,T,T,T,T,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,_,_,_],
    [_,_,_,_,T,T,T,T,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ];
  // Scale 2× by doubling each cell
  const big: number[][] = [];
  for (const row of small) {
    const r1: number[] = [], r2: number[] = [];
    for (const v of row) { r1.push(v, v); r2.push(v, v); }
    big.push(r1, r2);
  }
  return big;
}

export function makeDefaultWheelGrid(): number[][] {
  const _ = 0, T = 0x1a1a2e, H2 = 0x533483, S = 0x8a63d2, C2 = 0x0d0f1a, W2 = 0xadb5bd;
  // prettier-ignore  (24×24 circle wheel)
  return [
    [_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_,_,_],
    [_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_],
    [_,_,_,T,T,T,T,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,T,T,T,T,_,_,_],
    [_,_,T,T,T,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,T,T,T,_,_],
    [_,_,T,T,H2,H2,S,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,S,H2,H2,T,T,_,_],
    [_,T,T,H2,H2,S,S,S,H2,H2,H2,H2,H2,H2,H2,H2,S,S,S,H2,H2,T,T,_],
    [T,T,T,H2,H2,S,S,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,S,S,H2,H2,T,T,T],
    [T,T,H2,H2,H2,S,H2,H2,H2,S,S,S,S,S,S,H2,H2,H2,S,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,H2,H2,H2,S,S,C2,C2,C2,C2,S,S,H2,H2,H2,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,H2,H2,S,S,C2,W2,W2,W2,W2,C2,S,S,H2,H2,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,H2,H2,S,C2,W2,W2,W2,W2,W2,W2,C2,S,H2,H2,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,H2,H2,S,C2,W2,W2,C2,C2,W2,W2,C2,S,H2,H2,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,H2,H2,S,C2,W2,W2,C2,C2,W2,W2,C2,S,H2,H2,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,H2,H2,S,C2,W2,W2,W2,W2,W2,W2,C2,S,H2,H2,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,H2,H2,S,S,C2,W2,W2,W2,W2,C2,S,S,H2,H2,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,H2,H2,H2,S,S,C2,C2,C2,C2,S,S,H2,H2,H2,H2,H2,H2,T,T],
    [T,T,H2,H2,H2,S,H2,H2,H2,S,S,S,S,S,S,H2,H2,H2,S,H2,H2,H2,T,T],
    [T,T,T,H2,H2,S,S,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,S,S,H2,H2,T,T,T],
    [_,T,T,H2,H2,S,S,S,H2,H2,H2,H2,H2,H2,H2,H2,S,S,S,H2,H2,T,T,_],
    [_,_,T,T,H2,H2,S,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,S,H2,H2,T,T,_,_],
    [_,_,T,T,T,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,T,T,T,_,_],
    [_,_,_,T,T,T,T,H2,H2,H2,H2,H2,H2,H2,H2,H2,H2,T,T,T,T,_,_,_],
    [_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_],
    [_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_,_,_],
  ];
}

/** Color rendering: supports both legacy 24-bit RGB and new 32-bit ARGB */
export function colorToCSS(value: number): string | null {
  if (value === 0) return null;
  if (value > 0xFFFFFF) {
    const a = ((value >>> 24) & 0xFF) / 255;
    const r = (value >>> 16) & 0xFF;
    const g = (value >>> 8) & 0xFF;
    const b = value & 0xFF;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }
  const r = (value >>> 16) & 0xFF;
  const g = (value >>> 8) & 0xFF;
  const b = value & 0xFF;
  return `rgb(${r},${g},${b})`;
}

export class CustomVehicleStrategy implements VehicleStrategy {
  id = 'custom';
  private bodyGrid:  number[][];
  private wheelGrid: number[][];
  private bodyYOffset  = 0;
  private wheelYOffset = 0;
  private wheelDistance = 73;

  constructor(bodyGrid?: number[][], wheelGrid?: number[][], offsets?: {bodyYOff?:number; wheelYOff?:number; wheelDist?:number}) {
    this.bodyGrid  = bodyGrid  ?? makeDefaultBodyGrid();
    this.wheelGrid = wheelGrid ?? makeDefaultWheelGrid();
    if (offsets) {
      this.bodyYOffset   = offsets.bodyYOff  ?? 0;
      this.wheelYOffset  = offsets.wheelYOff ?? 0;
      this.wheelDistance = offsets.wheelDist ?? 73;
    }
  }

  updateGrid(bodyGrid: number[][], wheelGrid?: number[][], offsets?: {bodyYOff?:number; wheelYOff?:number; wheelDist?:number}): void {
    this.bodyGrid  = bodyGrid;
    if (wheelGrid) this.wheelGrid = wheelGrid;
    if (offsets) {
      if (offsets.bodyYOff  !== undefined) this.bodyYOffset   = offsets.bodyYOff;
      if (offsets.wheelYOff !== undefined) this.wheelYOffset  = offsets.wheelYOff;
      if (offsets.wheelDist !== undefined) this.wheelDistance = offsets.wheelDist;
    }
  }

  getDimensions(): VehicleDimensions {
    return {
      W, H, WR,
      wFrontX:  this.wheelDistance,
      wRearX:  -this.wheelDistance,
    };
  }

  drawBody(container: PIXI.Container): void {
    const g = new PIXI.Graphics();
    container.addChild(g);
    const ox = -W / 2;
    const oy = -H + this.bodyYOffset * BODY_PX;
    for (let row = 0; row < CUSTOM_GRID_ROWS; row++) {
      for (let col = 0; col < CUSTOM_GRID_COLS; col++) {
        const cv = this.bodyGrid[row]?.[col] ?? 0;
        if (cv === 0) continue;
        const css = colorToCSS(cv);
        if (!css) continue;
        const alpha = cv > 0xFFFFFF ? ((cv >>> 24) & 0xFF) / 255 : 1;
        g.beginFill(cv & 0xFFFFFF, alpha);
        g.drawRect(ox + col * BODY_PX, oy + row * BODY_PX, BODY_PX, BODY_PX);
        g.endFill();
      }
    }
  }

  drawWheels(frontContainer: PIXI.Container, rearContainer: PIXI.Container, _WR: number): void {
    [frontContainer, rearContainer].forEach(cont => {
      const g = new PIXI.Graphics();
      cont.addChild(g);
      const ox = -(CUSTOM_WHEEL_COLS * WHEEL_PX) / 2;
      const oy = -(CUSTOM_WHEEL_ROWS * WHEEL_PX) / 2 + this.wheelYOffset * WHEEL_PX;
      for (let row = 0; row < CUSTOM_WHEEL_ROWS; row++) {
        for (let col = 0; col < CUSTOM_WHEEL_COLS; col++) {
          const cv = this.wheelGrid[row]?.[col] ?? 0;
          if (cv === 0) continue;
          const alpha = cv > 0xFFFFFF ? ((cv >>> 24) & 0xFF) / 255 : 1;
          g.beginFill(cv & 0xFFFFFF, alpha);
          g.drawRect(ox + col * WHEEL_PX, oy + row * WHEEL_PX, WHEEL_PX, WHEEL_PX);
          g.endFill();
        }
      }
    });
  }
}
