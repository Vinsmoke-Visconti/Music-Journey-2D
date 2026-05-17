// ============================================================
// Visualizer.ts - Audio frequency visualizer
// Music Journey 2D | Strategy Pattern Refactored
// ============================================================

export class Visualizer {
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null | undefined;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d');
  }

  draw(data: Uint8Array | null): void {
    if (!this.ctx || !this.canvas) return;
    
    const W = this.canvas.width;
    const H = this.canvas.height;
    
    this.ctx.clearRect(0, 0, W, H);
    if (!data) return;

    const bars = 60;
    const step = Math.floor(data.length / bars);
    const barW = W / bars - 0.5;

    for (let i = 0; i < bars; i++) {
      const val  = data[i * step] / 255;
      const barH = val * H;
      const hue  = 40 + i * 2.5;   // gold → coral
      const sat  = 80 + val * 20;
      this.ctx.fillStyle = `hsl(${hue},${sat}%,${50 + val * 20}%)`;
      this.ctx.fillRect(i * (barW + 0.5), H - barH, barW, barH);
    }
  }
}
