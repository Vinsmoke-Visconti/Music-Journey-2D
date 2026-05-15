import * as PIXI from 'pixi.js';
import { ParticleType } from '../Particles';

export interface ColorLayer {
  gfx: PIXI.Graphics;
  scrollSpeed: number;
  offsetX: number;
  color: number;
  y: number;
  h: number;
}

export interface MapStrategy {
  id: string;

  // Parallax methods
  buildLayers(W: number, H: number, groundY: number): ColorLayer[];
  drawSkyGradient(g: PIXI.Graphics, W: number, H: number, progress: number): void;
  drawGround(g: PIXI.Graphics, W: number, H: number, groundY: number, groundThickness: number): void;
  updateLayers(layers: ColorLayer[], screenHeight: number, groundThickness: number): void;
  
  // Road methods
  getRoadConfig(): { amplitude: number; roadColor: number; lineColor: number };
  generatePuddles(width: number): { x: number; width: number }[];
  drawRoadDecorations(g: PIXI.Graphics, puddles: { x: number; width: number }[], getGroundYAt: (x: number) => number): void;

  // Particles methods
  getDustColor(): number;
  emitAtmosphere(width: number, emitCallback: (type: ParticleType, x: number, y: number, vx: number, vy: number, size: number, decay: number, color: number, rotationSpeed?: number) => void): void;
  emitGroundSplash(x: number, y: number, speed: number, isPuddle: boolean, emitCallback: (type: ParticleType, x: number, y: number, vx: number, vy: number, size: number, decay: number, color: number) => void): void;
}
