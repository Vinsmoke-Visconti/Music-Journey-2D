// ============================================================
// Vehicle.ts - FSM + Physics + 3 Vehicle Types (Van/Jeep/Pickup)
// Music Journey 2D | Giai đoạn 2: Hoàn thiện
// ============================================================

import * as PIXI from 'pixi.js';
import type { Vehicle as VehicleConfig } from '../configs/vehicles';

export type VehicleState = 'IDLE' | 'ACCELERATING' | 'CRUISING' | 'BRAKING';

// ── Colour palettes ───────────────────────────────────────────
const VAN_COLORS = {
  body: 0xe8742a, bodyAccent: 0xd4601a, roof: 0xc45010,
  window: 0x7ec8e3, windowFrame: 0x333333,
  wheel: 0x222222, wheelHub: 0x888888, stripe: 0xf9c74f,
  bumper: 0x555555, light: 0xffee88, exhaust: 0x666666,
};
const JEEP_COLORS = {
  body: 0x4d5b45, bodyAccent: 0x3a4434, roof: 0x2c3328,
  window: 0x8ecae6, windowFrame: 0x1a1a1a,
  wheel: 0x1a1a1a, wheelHub: 0x666655, roofRack: 0x555544,
  light: 0xffee88, bumper: 0x222222,
};
const PICKUP_COLORS = {
  body: 0x1e3a5f, bodyAccent: 0x152b47, roof: 0x102035,
  window: 0x7ec8e3, windowFrame: 0x111111,
  wheel: 0x1a1a1a, wheelHub: 0x888888,
  bed: 0x162d4a, light: 0xffee88, bumper: 0x444444,
};

export class Vehicle {
  public container: PIXI.Container;
  private bodyGfx: PIXI.Graphics;
  private wheelFront: PIXI.Graphics;
  private wheelRear: PIXI.Graphics;
  private suspensionContainer: PIXI.Container;

  private app: PIXI.Application;
  private config: VehicleConfig;
  private vehicleType: string;

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
  private idleTime = 0;
  private bumpForce = 0;

  constructor(app: PIXI.Application, config: VehicleConfig) {
    this.app = app;
    this.config = config;
    this.vehicleType = config.id;
    this._setDimensions();

    this.container = new PIXI.Container();
    this.suspensionContainer = new PIXI.Container();
    this.bodyGfx = new PIXI.Graphics();
    this.wheelFront = new PIXI.Graphics();
    this.wheelRear = new PIXI.Graphics();

    this.container.addChild(this.wheelRear);
    this.container.addChild(this.wheelFront);
    this.container.addChild(this.suspensionContainer);
    this.suspensionContainer.addChild(this.bodyGfx);

    this._drawBody();
    this._drawWheels();

    this.container.x = app.screen.width * 0.28;
    this.container.y = app.screen.height * 0.68;
    app.stage.addChild(this.container);
  }

  private _setDimensions(): void {
    switch (this.vehicleType) {
      case 'jeep':
        this.W = 148; this.H = 65; this.WR = 24;
        this.wFrontX = this.W / 2 - 28;
        this.wRearX = -this.W / 2 + 28;
        break;
      case 'pickup':
        this.W = 175; this.H = 56; this.WR = 22;
        this.wFrontX = this.W / 2 - 32;
        this.wRearX = -this.W / 2 + 42;
        break;
      default: // van
        this.W = 140; this.H = 60; this.WR = 16;
        this.wFrontX = this.W / 2 - 28;
        this.wRearX = -this.W / 2 + 28;
    }
  }

  private _drawBody(): void {
    switch (this.vehicleType) {
      case 'jeep': this._drawJeep(); break;
      case 'pickup': this._drawPickup(); break;
      default: this._drawVan(); break;
    }
  }

  // ── VAN ──────────────────────────────────────────────────────
  private _drawVan(): void {
    const g = this.bodyGfx; g.clear();
    const W = this.W, H = this.H;

    g.beginFill(VAN_COLORS.body); g.drawRoundedRect(-W / 2, -H, W, H, 6); g.endFill();
    g.beginFill(VAN_COLORS.bodyAccent, 0.4); g.drawRoundedRect(-W / 2, -H / 2, W, H / 2, 6); g.endFill();
    // Mái xe thấp hơn
    g.beginFill(VAN_COLORS.roof); g.drawRoundedRect(-W / 2 + 5, -H - 5, W - 10, 10, 4); g.endFill();
    g.beginFill(VAN_COLORS.stripe, 0.9); g.drawRect(-W / 2, -H * 0.45, W, 5); g.endFill();

    // Cửa sổ (vẽ dịch xuống để nằm trong thân xe)
    g.beginFill(VAN_COLORS.windowFrame); g.drawRoundedRect(W / 2 - 42, -H + 5, 35, 27, 3); g.endFill();
    g.beginFill(VAN_COLORS.window, 0.85); g.drawRoundedRect(W / 2 - 40, -H + 7, 31, 23, 2); g.endFill();

    // Side windows
    for (let i = 0; i < 2; i++) {
      const wx = -W / 2 + 10 + i * 40;
      g.beginFill(VAN_COLORS.windowFrame); g.drawRoundedRect(wx, -H + 5, 32, 27, 3); g.endFill();
      g.beginFill(VAN_COLORS.window, 0.8); g.drawRoundedRect(wx + 2, -H + 7, 28, 23, 2); g.endFill();
    }
    // Lights
    g.beginFill(VAN_COLORS.light); g.drawRoundedRect(W / 2 - 8, -H + 35, 10, 8, 2); g.endFill();
    g.beginFill(0xffffff, 0.5); g.drawRoundedRect(W / 2 - 7, -H + 36, 6, 5, 1); g.endFill();
    g.beginFill(0xff4444); g.drawRoundedRect(-W / 2 - 2, -H + 35, 8, 8, 2); g.endFill();
    // Bumpers
    g.beginFill(VAN_COLORS.bumper);
    g.drawRoundedRect(W / 2 - 6, -H + 45, 10, 14, 2);
    g.drawRoundedRect(-W / 2 - 4, -H + 45, 10, 14, 2);
    g.endFill();
    g.beginFill(VAN_COLORS.exhaust); g.drawRoundedRect(-W / 2 + 5, -6, 20, 5, 2); g.endFill();
  }

  // ── JEEP ─────────────────────────────────────────────────────
  private _drawJeep(): void {
    const g = this.bodyGfx; g.clear();
    const W = this.W, H = this.H;

    // Body
    g.beginFill(JEEP_COLORS.body); g.drawRoundedRect(-W / 2, -H, W, H, 4); g.endFill();
    g.beginFill(JEEP_COLORS.bodyAccent, 0.5); g.drawRoundedRect(-W / 2, -H / 2, W, H / 2, 4); g.endFill();
    // Flat roof
    g.beginFill(JEEP_COLORS.roof); g.drawRect(-W / 2 + 6, -H - 30, W - 12, 32); g.endFill();
    // Roof rack rails
    g.lineStyle(3, JEEP_COLORS.roofRack, 0.9);
    g.moveTo(-W / 2 + 10, -H - 28); g.lineTo(W / 2 - 10, -H - 28);
    g.moveTo(-W / 2 + 10, -H - 24); g.lineTo(W / 2 - 10, -H - 24);
    for (let cx = -W / 2 + 22; cx < W / 2 - 10; cx += 24) {
      g.moveTo(cx, -H - 29); g.lineTo(cx, -H - 23);
    }
    g.lineStyle(0);

    // Windshield (upright)
    g.beginFill(JEEP_COLORS.windowFrame); g.drawRect(W / 2 - 48, -H - 28, 42, 30); g.endFill();
    g.beginFill(JEEP_COLORS.window, 0.8); g.drawRect(W / 2 - 46, -H - 26, 38, 26); g.endFill();
    g.beginFill(0xffffff, 0.15); g.drawRect(W / 2 - 45, -H - 25, 10, 12); g.endFill();
    // Side window
    g.beginFill(JEEP_COLORS.windowFrame); g.drawRect(-W / 2 + 10, -H - 28, 52, 30); g.endFill();
    g.beginFill(JEEP_COLORS.window, 0.75); g.drawRect(-W / 2 + 12, -H - 26, 48, 26); g.endFill();
    g.beginFill(0xffffff, 0.12); g.drawRect(-W / 2 + 14, -H - 25, 12, 11); g.endFill();

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

  // ── PICKUP ───────────────────────────────────────────────────
  private _drawPickup(): void {
    const g = this.bodyGfx; g.clear();
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
    g.moveTo(cabX + 5, -H - 26); g.lineTo(cabX + cabW - 8, -H - 26);
    g.lineTo(cabX + cabW - 2, -H); g.lineTo(cabX, -H);
    g.closePath(); g.endFill();

    // Windshield
    g.beginFill(PICKUP_COLORS.windowFrame); g.drawRoundedRect(cabX + cabW - 48, -H - 24, 42, 26, 3); g.endFill();
    g.beginFill(PICKUP_COLORS.window, 0.82); g.drawRoundedRect(cabX + cabW - 46, -H - 22, 38, 22, 2); g.endFill();
    g.beginFill(0xffffff, 0.15); g.drawRect(cabX + cabW - 45, -H - 21, 10, 10); g.endFill();
    // Side window
    g.beginFill(PICKUP_COLORS.windowFrame); g.drawRoundedRect(cabX + 8, -H - 24, 35, 26, 3); g.endFill();
    g.beginFill(PICKUP_COLORS.window, 0.78); g.drawRoundedRect(cabX + 10, -H - 22, 31, 22, 2); g.endFill();
    g.beginFill(0xffffff, 0.12); g.drawRect(cabX + 12, -H - 21, 9, 10); g.endFill();

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

  // ── WHEELS ───────────────────────────────────────────────────
  private _drawWheels(): void {
    const R = this.WR;
    const wheelColor = this.vehicleType === 'van' ? VAN_COLORS.wheel : this.vehicleType === 'jeep' ? JEEP_COLORS.wheel : PICKUP_COLORS.wheel;
    const hubColor = this.vehicleType === 'van' ? VAN_COLORS.wheelHub : this.vehicleType === 'jeep' ? JEEP_COLORS.wheelHub : PICKUP_COLORS.wheelHub;
    const spokeCount = this.vehicleType === 'jeep' ? 6 : 5;

    [this.wheelFront, this.wheelRear].forEach((wg, i) => {
      wg.clear();
      // Draw everything at local (0,0) so it rotates around its own center
      const localX = 0;

      // Tyre
      wg.beginFill(wheelColor); wg.drawCircle(localX, 0, R); wg.endFill();
      wg.lineStyle(this.vehicleType === 'jeep' ? 4 : 3, 0x111111); wg.drawCircle(localX, 0, R); wg.lineStyle(0);

      // Tread detail for Jeep
      if (this.vehicleType === 'jeep') {
        wg.lineStyle(2, 0x111111, 0.5);
        for (let t = 0; t < 8; t++) {
          const a = (t / 8) * Math.PI * 2;
          wg.moveTo(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3));
          wg.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        }
        wg.lineStyle(0);
      }
      // Hub
      wg.beginFill(hubColor); wg.drawCircle(localX, 0, R * 0.55); wg.endFill();
      wg.beginFill(0x444444); wg.drawCircle(localX, 0, R * 0.15); wg.endFill();
      // Spokes
      wg.lineStyle(2, 0xaaaaaa, 0.9);
      for (let s = 0; s < spokeCount; s++) {
        const a = (s / spokeCount) * Math.PI * 2;
        wg.moveTo(0, 0);
        wg.lineTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5);
      }
      wg.lineStyle(0);
    });
  }

  private _updateWheelPositions(): void {
    const R = this.WR;
    const time = Date.now() * 0.005;

    // Chỉ dao động khi xe đang chạy (tỉ lệ theo tốc độ)
    const speedFactor = Math.min(1, this.speed / 0.5);
    const oscillateF = Math.sin(time * 3) * 1 * speedFactor;
    const oscillateR = Math.sin(time * 3 + 1) * 1 * speedFactor;

    this.wheelFront.x = this.wFrontX;
    this.wheelFront.y = R + oscillateF;
    this.wheelFront.rotation = this.wheelAngle;

    this.wheelRear.x = this.wRearX;
    this.wheelRear.y = R + oscillateR;
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
