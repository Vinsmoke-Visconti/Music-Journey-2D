// ============================================================
// CustomVehicleStrategy.ts - Pixel-art driven vehicle renderer
// Supports separate body grid and wheel grid.
// Music Journey 2D | Option 4: Vehicle Customization
// ============================================================

import * as PIXI from 'pixi.js';
import { VehicleStrategy, VehicleDimensions } from '../VehicleStrategy';

// Grid dimensions (columns × rows)
export const CUSTOM_GRID_COLS      = 32;
export const CUSTOM_GRID_ROWS      = 16;
export const CUSTOM_WHEEL_COLS     = 12;
export const CUSTOM_WHEEL_ROWS     = 12;

// Display pixel size
const BODY_PIXEL  = 6.5;
const WHEEL_PIXEL = 3.0;

const W  = CUSTOM_GRID_COLS  * BODY_PIXEL;  // ~208px
const H  = CUSTOM_GRID_ROWS  * BODY_PIXEL;  // ~104px
const WR = (CUSTOM_WHEEL_COLS * WHEEL_PIXEL) / 2; // radius ≈ 18px

// ── Default blank grids ───────────────────────────────────────
export function makeBlankGrid(): number[][] {
  return Array.from({ length: CUSTOM_GRID_ROWS }, () =>
    new Array(CUSTOM_GRID_COLS).fill(0)
  );
}

export function makeBlankWheelGrid(): number[][] {
  return Array.from({ length: CUSTOM_WHEEL_ROWS }, () =>
    new Array(CUSTOM_WHEEL_COLS).fill(0)
  );
}

// ── Default body: cute retro van silhouette ───────────────────
export function makeDefaultBodyGrid(): number[][] {
  const _ = 0;
  const B  = 0x1a1a2e;
  const C  = 0x533483;
  const W2 = 0xf8f9fa;
  const Y  = 0xf9c74f;
  const R  = 0xe94560;
  const G  = 0x6c757d;
  const T  = 0x343a40;

  // prettier-ignore
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
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
  ];
}

// ── Default wheel: simple pixel circle ───────────────────────
export function makeDefaultWheelGrid(): number[][] {
  const _ = 0;
  const T = 0x1a1a2e;   // tyre dark
  const H = 0x533483;   // hub purple
  const S = 0x8a63d2;   // spoke
  const C2 = 0x0d0f1a;  // center

  // prettier-ignore
  return [
    [_,_,_,T,T,T,T,T,T,_,_,_],
    [_,_,T,T,T,T,T,T,T,T,_,_],
    [_,T,T,T,H,H,H,H,T,T,T,_],
    [T,T,T,H,H,S,H,H,H,T,T,T],
    [T,T,H,H,S,H,S,H,H,H,T,T],
    [T,T,H,S,H,C2,H,S,H,H,T,T],
    [T,T,H,H,S,H,S,H,H,H,T,T],
    [T,T,T,H,H,S,H,H,H,T,T,T],
    [_,T,T,T,H,H,H,H,T,T,T,_],
    [_,_,T,T,T,T,T,T,T,T,_,_],
    [_,_,_,T,T,T,T,T,T,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_],
  ];
}

// ── Strategy ─────────────────────────────────────────────────
export class CustomVehicleStrategy implements VehicleStrategy {
  id = 'custom';
  private bodyGrid: number[][];
  private wheelGrid: number[][];

  constructor(bodyGrid?: number[][], wheelGrid?: number[][]) {
    this.bodyGrid  = bodyGrid  ?? makeDefaultBodyGrid();
    this.wheelGrid = wheelGrid ?? makeDefaultWheelGrid();
  }

  updateGrid(bodyGrid: number[][], wheelGrid?: number[][]): void {
    this.bodyGrid  = bodyGrid;
    if (wheelGrid) this.wheelGrid = wheelGrid;
  }

  getDimensions(): VehicleDimensions {
    return {
      W,
      H,
      WR,
      wFrontX:  W / 2 - 52,
      wRearX:  -W / 2 + 52,
    };
  }

  drawBody(container: PIXI.Container): void {
    const g = new PIXI.Graphics();
    container.addChild(g);

    const offsetX = -W / 2;
    const offsetY = -H;

    for (let row = 0; row < CUSTOM_GRID_ROWS; row++) {
      for (let col = 0; col < CUSTOM_GRID_COLS; col++) {
        const color = this.bodyGrid[row]?.[col] ?? 0;
        if (color === 0) continue;
        g.beginFill(color, 1);
        g.drawRect(
          offsetX + col * BODY_PIXEL,
          offsetY + row * BODY_PIXEL,
          BODY_PIXEL,
          BODY_PIXEL
        );
        g.endFill();
      }
    }
  }

  drawWheels(
    frontContainer: PIXI.Container,
    rearContainer: PIXI.Container,
    _WR: number
  ): void {
    [frontContainer, rearContainer].forEach(cont => {
      const g = new PIXI.Graphics();
      cont.addChild(g);

      // Center the wheel grid
      const offX = -(CUSTOM_WHEEL_COLS * WHEEL_PIXEL) / 2;
      const offY = -(CUSTOM_WHEEL_ROWS * WHEEL_PIXEL) / 2;

      for (let row = 0; row < CUSTOM_WHEEL_ROWS; row++) {
        for (let col = 0; col < CUSTOM_WHEEL_COLS; col++) {
          const color = this.wheelGrid[row]?.[col] ?? 0;
          if (color === 0) continue;
          g.beginFill(color, 1);
          g.drawRect(
            offX + col * WHEEL_PIXEL,
            offY + row * WHEEL_PIXEL,
            WHEEL_PIXEL,
            WHEEL_PIXEL
          );
          g.endFill();
        }
      }
    });
  }
}
