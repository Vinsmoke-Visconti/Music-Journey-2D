// ============================================================
// Vehicle.ts - FSM + Physics
// Music Journey 2D | Strategy Pattern Refactored
// ============================================================

import * as PIXI from 'pixi.js';
import type { Vehicle as VehicleConfig } from '../configs/vehicles';
import { VehicleStrategy } from './strategies/VehicleStrategy';
import { getVehicleStrategy } from './strategies/VehicleRegistry';

export type VehicleState = 'IDLE' | 'ACCELERATING' | 'CRUISING' | 'BRAKING';

export class Vehicle {
  public container: PIXI.Container;
  private bodyGfx: PIXI.Container;
  private wheelFront: PIXI.Container;
  private wheelRear: PIXI.Container;
  private suspensionContainer: PIXI.Container;

  private app: PIXI.Application;
  private config: VehicleConfig;
  private vehicleType: string;
  private strategy: VehicleStrategy;

  // Dimensions (per vehicle)
  private W = 140; private H = 60; private WR = 20;
  private wFrontX = 0; private wRearX = 0;

  // Road following
  private groundYFront: number = 0;
  private groundYRear: number = 0;
  private roadTiltAngle: number = 0;

  // FSM
  public state: VehicleState = 'IDLE';
  public speed: number = 0;

  // Suspension
  private suspY = 0; private suspV = 0;
  private tiltAngle = 0;

  // Wheel
  private wheelAngle = 0;

  // Misc
  private idleTime = 0;
  private bumpForce = 0;

  constructor(app: PIXI.Application, config: VehicleConfig) {
    this.app = app;
    this.config = config;
    this.vehicleType = config.id;
    this.strategy = getVehicleStrategy(this.vehicleType);

    this._setDimensions();

    this.container = new PIXI.Container();
    this.suspensionContainer = new PIXI.Container();
    this.bodyGfx = new PIXI.Container();
    this.wheelFront = new PIXI.Container();
    this.wheelRear = new PIXI.Container();

    this.container.addChild(this.suspensionContainer);
    this.suspensionContainer.addChild(this.wheelRear);
    this.suspensionContainer.addChild(this.wheelFront);
    this.suspensionContainer.addChild(this.bodyGfx);

    this.strategy.drawBody(this.bodyGfx);
    this.strategy.drawWheels(this.wheelFront, this.wheelRear, this.WR);

    this.container.x = app.screen.width * 0.28;
    this.container.y = app.screen.height * 0.68;
    app.stage.addChild(this.container);
  }

  private _setDimensions(): void {
    const dims = this.strategy.getDimensions();
    this.W = dims.W;
    this.H = dims.H;
    this.WR = dims.WR;
    this.wFrontX = dims.wFrontX;
    this.wRearX = dims.wRearX;
  }

  private _updateWheelPositions(): void {
    const R = this.WR;
    const time = Date.now() * 0.005;

    // Chỉ dao động khi xe đang chạy (tỉ lệ theo tốc độ)
    const speedFactor = Math.min(1, this.speed / 0.5);
    const oscillateF = Math.sin(time * 3) * 1 * speedFactor;
    const oscillateR = Math.sin(time * 3 + 1) * 1 * speedFactor;

    this.wheelFront.x = this.wFrontX;
    this.wheelFront.y = R * 0.05 + oscillateF - 22;
    this.wheelFront.rotation = this.wheelAngle;

    this.wheelRear.x = this.wRearX;
    this.wheelRear.y = R * 0.05 + oscillateR - 22;
    this.wheelRear.rotation = this.wheelAngle;
  }

  // ── UPDATE LOOP ───────────────────────────────────────────────
  update(groundYFront: number, groundYRear: number, bassEnergy = 0, trebleEnergy = 0): void {
    this.groundYFront = groundYFront;
    this.groundYRear = groundYRear;

    // Calculate road tilt (slope)
    const dx = this.wFrontX - this.wRearX;
    const dy = this.groundYFront - this.groundYRear;
    this.roadTiltAngle = Math.atan2(dy, dx);

    this._updateFSM();
    this._updateSuspension(bassEnergy);
    this._updateWheelRotation();
    this._applyTransforms(trebleEnergy);
  }

  private _updateFSM(): void {
    switch (this.state) {
      case 'IDLE':
        this.speed = Math.max(0, this.speed - this.config.deceleration * 0.5);
        this.idleTime += 0.05; break;
      case 'ACCELERATING': {
        const diff = this.config.maxSpeed - this.speed;
        this.speed += diff * this.config.acceleration * 0.8;
        if (this.speed >= this.config.maxSpeed * 0.92) this.state = 'CRUISING';
        break;
      }
      case 'CRUISING':
        this.speed += (this.config.maxSpeed - this.speed) * 0.02; break;
      case 'BRAKING':
        this.speed = Math.max(0, this.speed - this.config.deceleration * 1.5);
        if (this.speed <= 0.05) { this.speed = 0; this.state = 'IDLE'; }
        break;
    }
  }

  private _updateSuspension(bassEnergy: number): void {
    const str = this.config.suspensionStrength;
    if (this.state === 'CRUISING' || this.state === 'ACCELERATING') {
      this.bumpForce = bassEnergy * 18 * str;
      const vib = (Math.sin(Date.now() * 0.015) * 1.5) * (this.speed / this.config.maxSpeed);
      this.suspV -= (this.bumpForce + vib) * 0.4;
    } else if (this.state === 'IDLE') {
      this.suspV -= Math.sin(this.idleTime * 8) * 1.2 * 0.05;
    }
    const spring = -this.suspY * 0.3 * str;
    const damp = -this.suspV * 0.55;
    this.suspV += spring + damp;
    this.suspY += this.suspV;
    const tgt = this.state === 'BRAKING' ? 0.04 * (this.speed / this.config.maxSpeed) : 0;
    this.tiltAngle += (tgt - this.tiltAngle) * 0.1;
  }

  private _updateWheelRotation(): void {
    // Perfect Rolling: Góc xoay = Quãng đường / Bán kính
    this.wheelAngle += this.speed / this.WR;
  }

  private _applyTransforms(_t: number): void {
    // Rotation logic: Road tilt + Inertia tilt (bodyTiltAngle)
    this.suspensionContainer.rotation = this.tiltAngle;
    this.container.rotation = this.roadTiltAngle;

    // Hạ thấp thân xe xuống để "hợp nhất" với bánh (giảm từ 1.8 xuống 0.5)
    this.suspensionContainer.y = this.suspY + this.WR * 0.95;

    this._updateWheelPositions();

    // Position the vehicle at the average ground height
    this.container.y = (this.groundYFront + this.groundYRear) / 2;
  }

  // ── CONTROLS ─────────────────────────────────────────────────
  play(): void {
    if (this.state === 'IDLE' || this.state === 'BRAKING') this.state = 'ACCELERATING';
  }
  pause(): void {
    if (this.state !== 'IDLE') this.state = 'BRAKING';
  }

  // ── QUERIES ──────────────────────────────────────────────────
  getSpeed(): number { return this.speed; }
  getState(): VehicleState { return this.state; }

  getWheelXOffsets(): { front: number; rear: number } {
    return { front: this.wFrontX, rear: this.wRearX };
  }

  getWheelFrontWorldPos(): { x: number; y: number } {
    return { x: this.container.x + this.wFrontX, y: this.container.y + this.WR };
  }
  getWheelRearWorldPos(): { x: number; y: number } {
    return { x: this.container.x + this.wRearX, y: this.container.y + this.WR };
  }
  getExhaustWorldPos(): { x: number; y: number } {
    return { x: this.container.x - this.W / 2 + 15, y: this.container.y - 6 };
  }

  // ── CLEANUP ───────────────────────────────────────────────────
  destroy(): void {
    if (this.container.parent) this.container.parent.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
