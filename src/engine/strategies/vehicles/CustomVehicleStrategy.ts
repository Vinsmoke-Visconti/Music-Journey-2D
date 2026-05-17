// ============================================================
// CustomVehicleStrategy.ts - Pixel-art driven vehicle renderer
// Music Journey 2D | Option 4: Vehicle Customization
// ============================================================

import * as PIXI from 'pixi.js';
import { VehicleStrategy, VehicleDimensions } from '../VehicleStrategy';

// Grid dimensions (columns × rows)
export const CUSTOM_GRID_COLS = 32;
export const CUSTOM_GRID_ROWS = 16;

// Display pixel size (each grid cell = this many px in PixiJS world)
const PIXEL_SIZE = 6.5;

const W = CUSTOM_GRID_COLS * PIXEL_SIZE; // ~208px
const H = CUSTOM_GRID_ROWS * PIXEL_SIZE; // ~104px
const WR = 18;

// Default blank grid
export function makeBlankGrid(): number[][] {
  return Array.from({ length: CUSTOM_GRID_ROWS }, () =>
    new Array(CUSTOM_GRID_COLS).fill(0)
  );
}

// Default starter pixel art - a cute retro van silhouette
export function makeDefaultGrid(): number[][] {
  const _ = 0;            // transparent
  const B = 0x1a1a2e;    // dark body
  const C = 0x533483;    // accent purple
  const W2 = 0xf8f9fa;   // white (window)
  const Y = 0xf9c74f;    // yellow (headlight)
  const R = 0xe94560;    // red (taillight)
  const G = 0x6c757d;    // grey (bumper)
  const T = 0x343a40;    // tyre dark

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

export class CustomVehicleStrategy implements VehicleStrategy {
  id = 'custom';
  private grid: number[][];

  constructor(grid?: number[][]) {
    this.grid = grid ?? makeDefaultGrid();
  }

  /** Call this to update the pixel data at runtime */
  updateGrid(grid: number[][]): void {
    this.grid = grid;
  }

  getDimensions(): VehicleDimensions {
    return {
      W,
      H,
      WR,
      wFrontX:  W / 2 - 52,   // align with pixel wheels col ~24
      wRearX:  -W / 2 + 52,   // align with pixel wheels col ~8
    };
  }

  drawBody(container: PIXI.Container): void {
    const g = new PIXI.Graphics();
    container.addChild(g);

    const offsetX = -W / 2;
    const offsetY = -H;         // anchor at bottom-centre

    for (let row = 0; row < CUSTOM_GRID_ROWS; row++) {
      for (let col = 0; col < CUSTOM_GRID_COLS; col++) {
        const color = this.grid[row][col];
        if (color === 0) continue;          // transparent

        g.beginFill(color, 1);
        g.drawRect(
          offsetX + col * PIXEL_SIZE,
          offsetY + row * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE
        );
        g.endFill();
      }
    }
  }

  drawWheels(
    frontContainer: PIXI.Container,
    rearContainer: PIXI.Container,
    WR: number
  ): void {
    const drawWheel = (cont: PIXI.Container) => {
      const g = new PIXI.Graphics();
      cont.addChild(g);
      // Tyre
      g.beginFill(0x1a1a2e); g.drawCircle(0, 0, WR); g.endFill();
      g.lineStyle(2.5, 0x0d0f1a); g.drawCircle(0, 0, WR); g.lineStyle(0);
      // Hub cap
      g.beginFill(0x533483); g.drawCircle(0, 0, WR * 0.5); g.endFill();
      g.beginFill(0x1a1a2e); g.drawCircle(0, 0, WR * 0.18); g.endFill();
      // Spokes (5-spoke)
      g.lineStyle(1.8, 0x8a63d2, 0.85);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * WR * 0.46, Math.sin(a) * WR * 0.46);
      }
      g.lineStyle(0);
    };

    drawWheel(frontContainer);
    drawWheel(rearContainer);
  }
}
