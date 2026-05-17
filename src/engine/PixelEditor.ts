// ============================================================
// PixelEditor.ts - Pixel Art Vehicle Editor
// Music Journey 2D | Option 4: Vehicle Customization
// ============================================================

import {
  CUSTOM_GRID_COLS,
  CUSTOM_GRID_ROWS,
  makeBlankGrid,
  makeDefaultGrid,
} from './strategies/vehicles/CustomVehicleStrategy';

const CELL = 18; // display px per grid cell
const CANVAS_W = CUSTOM_GRID_COLS * CELL; // 576
const CANVAS_H = CUSTOM_GRID_ROWS * CELL; // 288

const PALETTE: number[] = [
  0x1a1a2e, 0x16213e, 0x0f3460, 0x533483,
  0xe94560, 0xf5a623, 0xf9c74f, 0x90be6d,
  0x43aa8b, 0x4d908e, 0x577590, 0x277da1,
  0xf8f9fa, 0xadb5bd, 0x6c757d, 0x343a40,
];

type Tool = 'pen' | 'eraser' | 'fill';

function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

export class PixelEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grid: number[][];
  private history: number[][][] = [];
  private activeColor: number = PALETTE[0];
  private tool: Tool = 'pen';
  private painting = false;

  private onApply: (grid: number[][]) => void;

  constructor(onApply: (grid: number[][]) => void) {
    this.onApply = onApply;
    this.grid = makeDefaultGrid();

    this.canvas = document.getElementById('pe-canvas') as HTMLCanvasElement;
    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.ctx = this.canvas.getContext('2d')!;

    this._buildPalette();
    this._bindEvents();
    this.render();
  }

  // ── Open / Close ───────────────────────────────────────────
  open(): void {
    document.getElementById('pixel-editor-overlay')!.classList.add('open');
  }
  close(): void {
    document.getElementById('pixel-editor-overlay')!.classList.remove('open');
  }

  // ── Palette ────────────────────────────────────────────────
  private _buildPalette(): void {
    const container = document.getElementById('pe-palette')!;
    container.innerHTML = '';

    // Eraser swatch
    const eraser = document.createElement('div');
    eraser.className = 'pe-swatch pe-swatch-eraser';
    eraser.title = 'Tẩy (trong suốt)';
    eraser.addEventListener('click', () => {
      this.tool = 'eraser';
      this.activeColor = 0;
      this._setActiveTool('eraser');
      this._setActiveSwatch(eraser);
    });
    container.appendChild(eraser);

    PALETTE.forEach(hex => {
      const swatch = document.createElement('div');
      swatch.className = 'pe-swatch' + (hex === this.activeColor ? ' active' : '');
      swatch.style.background = hexToCSS(hex);
      swatch.title = hexToCSS(hex);
      swatch.addEventListener('click', () => {
        this.activeColor = hex;
        this.tool = 'pen';
        this._setActiveTool('pen');
        this._setActiveSwatch(swatch);
      });
      container.appendChild(swatch);
    });
  }

  private _setActiveSwatch(active: HTMLElement): void {
    document.querySelectorAll('.pe-swatch').forEach(s => s.classList.remove('active'));
    active.classList.add('active');
  }

  // ── Tool management ────────────────────────────────────────
  private _setActiveTool(id: Tool): void {
    this.tool = id;
    document.querySelectorAll('.pe-tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`pe-tool-${id}`);
    btn?.classList.add('active');
  }

  // ── Event Bindings ─────────────────────────────────────────
  private _bindEvents(): void {
    // Tool buttons
    document.getElementById('pe-tool-pen')!   .addEventListener('click', () => { this.tool = 'pen';    this._setActiveTool('pen'); });
    document.getElementById('pe-tool-eraser')!.addEventListener('click', () => { this.tool = 'eraser'; this._setActiveTool('eraser'); });
    document.getElementById('pe-tool-fill')!  .addEventListener('click', () => { this.tool = 'fill';   this._setActiveTool('fill'); });
    document.getElementById('pe-tool-undo')!  .addEventListener('click', () => this._undo());

    // Action buttons
    document.getElementById('pe-reset-btn')!  .addEventListener('click', () => this._reset());
    document.getElementById('pe-default-btn')!.addEventListener('click', () => this._loadDefault());
    document.getElementById('pe-apply-btn')!  .addEventListener('click', () => this._apply());
    document.getElementById('pe-close-btn')!  .addEventListener('click', () => this.close());

    // Keyboard shortcuts
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!document.getElementById('pixel-editor-overlay')!.classList.contains('open')) return;
      if (e.key === 'p' || e.key === 'P') this._setActiveTool('pen');
      if (e.key === 'e' || e.key === 'E') this._setActiveTool('eraser');
      if (e.key === 'f' || e.key === 'F') this._setActiveTool('fill');
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this._undo(); }
      if (e.key === 'Escape') this.close();
    });

    // Canvas drawing
    this.canvas.addEventListener('mousedown', (e) => {
      this.painting = true;
      this._handlePaint(e);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.painting) return;
      if (this.tool !== 'fill') this._handlePaint(e);
    });
    window.addEventListener('mouseup', () => { this.painting = false; });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.painting = true;
      this._handlePaint(e.touches[0] as any);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.painting || this.tool === 'fill') return;
      this._handlePaint(e.touches[0] as any);
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => { this.painting = false; });
  }

  private _getCellFromEvent(e: MouseEvent): { col: number; row: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / CELL);
    const row = Math.floor((e.clientY - rect.top)  * scaleY / CELL);
    return { col, row };
  }

  private _handlePaint(e: MouseEvent): void {
    const { col, row } = this._getCellFromEvent(e);
    if (col < 0 || col >= CUSTOM_GRID_COLS || row < 0 || row >= CUSTOM_GRID_ROWS) return;

    if (this.tool === 'fill') {
      this._pushHistory();
      this._floodFill(col, row, this.grid[row][col], this.activeColor);
    } else {
      const newColor = this.tool === 'eraser' ? 0 : this.activeColor;
      if (this.grid[row][col] === newColor) return;
      if (!this.painting || this.tool !== 'eraser') this._pushHistory(); // only one history per stroke
      this.grid[row][col] = newColor;
    }
    this.render();
  }

  // ── Flood Fill (BFS) ───────────────────────────────────────
  private _floodFill(startCol: number, startRow: number, targetColor: number, fillColor: number): void {
    if (targetColor === fillColor) return;
    const queue: [number, number][] = [[startCol, startRow]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [c, r] = queue.shift()!;
      const key = `${c},${r}`;
      if (visited.has(key)) continue;
      if (c < 0 || c >= CUSTOM_GRID_COLS || r < 0 || r >= CUSTOM_GRID_ROWS) continue;
      if (this.grid[r][c] !== targetColor) continue;

      visited.add(key);
      this.grid[r][c] = fillColor;
      queue.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
    }
  }

  // ── History ────────────────────────────────────────────────
  private _pushHistory(): void {
    if (this.history.length > 40) this.history.shift();
    this.history.push(this.grid.map(row => [...row]));
  }

  private _undo(): void {
    if (this.history.length === 0) return;
    this.grid = this.history.pop()!;
    this.render();
  }

  // ── Actions ────────────────────────────────────────────────
  private _reset(): void {
    this._pushHistory();
    this.grid = makeBlankGrid();
    this.render();
  }

  private _loadDefault(): void {
    this._pushHistory();
    this.grid = makeDefaultGrid();
    this.render();
  }

  private _apply(): void {
    // Deep-copy to avoid mutation issues
    this.onApply(this.grid.map(row => [...row]));
    this.close();
  }

  // ── Render ─────────────────────────────────────────────────
  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    for (let row = 0; row < CUSTOM_GRID_ROWS; row++) {
      for (let col = 0; col < CUSTOM_GRID_COLS; col++) {
        const color = this.grid[row][col];
        const x = col * CELL;
        const y = row * CELL;

        if (color === 0) {
          // Transparent - draw checker
          ctx.fillStyle = (col + row) % 2 === 0 ? '#1c1e2e' : '#222436';
          ctx.fillRect(x, y, CELL, CELL);
        } else {
          ctx.fillStyle = hexToCSS(color);
          ctx.fillRect(x, y, CELL, CELL);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let col = 0; col <= CUSTOM_GRID_COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(col * CELL, 0);
      ctx.lineTo(col * CELL, CANVAS_H);
      ctx.stroke();
    }
    for (let row = 0; row <= CUSTOM_GRID_ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * CELL);
      ctx.lineTo(CANVAS_W, row * CELL);
      ctx.stroke();
    }
  }
}
