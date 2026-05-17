// ============================================================
// PixelEditor.ts - Pixel Art Vehicle Editor (Body + Wheel tabs)
// Supports naming, draft save (localStorage), and apply to game.
// Music Journey 2D | Option 4: Vehicle Customization
// ============================================================

import {
  CUSTOM_GRID_COLS, CUSTOM_GRID_ROWS,
  CUSTOM_WHEEL_COLS, CUSTOM_WHEEL_ROWS,
  makeBlankGrid, makeBlankWheelGrid,
  makeDefaultBodyGrid, makeDefaultWheelGrid,
} from './strategies/vehicles/CustomVehicleStrategy';

// Display pixel sizes
const BODY_CELL  = 16; // px per grid cell on canvas
const WHEEL_CELL = 22; // px per wheel cell on canvas

const BODY_W  = CUSTOM_GRID_COLS  * BODY_CELL;   // 512
const BODY_H  = CUSTOM_GRID_ROWS  * BODY_CELL;   // 256
const WHEEL_W = CUSTOM_WHEEL_COLS * WHEEL_CELL;  // 264
const WHEEL_H = CUSTOM_WHEEL_ROWS * WHEEL_CELL;  // 264

const STORAGE_KEY     = 'mj2d_custom_vehicles';
const DRAFT_KEY       = 'mj2d_draft';

// ── Colour palette ────────────────────────────────────────────
const PALETTE: number[] = [
  0x1a1a2e, 0x16213e, 0x0f3460, 0x533483,
  0xe94560, 0xf5a623, 0xf9c74f, 0x90be6d,
  0x43aa8b, 0x4d908e, 0x577590, 0x277da1,
  0xf8f9fa, 0xadb5bd, 0x6c757d, 0x343a40,
];

export interface SavedVehicle {
  id: string;
  name: string;
  bodyGrid: number[][];
  wheelGrid: number[][];
}

type Tool    = 'pen' | 'eraser' | 'fill';
type TabMode = 'body' | 'wheel';

function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

export class PixelEditor {
  // Grids
  private bodyGrid:  number[][] = makeDefaultBodyGrid();
  private wheelGrid: number[][] = makeDefaultWheelGrid();

  // History per tab
  private bodyHistory:  number[][][] = [];
  private wheelHistory: number[][][] = [];

  // Drawing state
  private activeColor: number = PALETTE[0];
  private tool: Tool     = 'pen';
  private mode: TabMode  = 'body';
  private painting       = false;

  // Canvas refs
  private bodyCanvas:  HTMLCanvasElement;
  private bodyCtx:     CanvasRenderingContext2D;
  private wheelCanvas: HTMLCanvasElement;
  private wheelCtx:    CanvasRenderingContext2D;

  private onApply: (bodyGrid: number[][], wheelGrid: number[][], name: string, id: string) => void;

  constructor(
    onApply: (bodyGrid: number[][], wheelGrid: number[][], name: string, id: string) => void
  ) {
    this.onApply = onApply;

    this.bodyCanvas  = document.getElementById('pe-body-canvas')  as HTMLCanvasElement;
    this.wheelCanvas = document.getElementById('pe-wheel-canvas') as HTMLCanvasElement;

    this.bodyCanvas.width   = BODY_W;
    this.bodyCanvas.height  = BODY_H;
    this.wheelCanvas.width  = WHEEL_W;
    this.wheelCanvas.height = WHEEL_H;

    this.bodyCtx  = this.bodyCanvas.getContext('2d')!;
    this.wheelCtx = this.wheelCanvas.getContext('2d')!;

    this._buildPalette();
    this._bindEvents();
    this._setTab('body');
    this._loadDraft();
    this.renderBoth();
    this._renderSavedList();
  }

  // ── Open / Close ───────────────────────────────────────────
  open(): void {
    document.getElementById('pixel-editor-overlay')!.classList.add('open');
    this.renderBoth();
  }
  close(): void {
    document.getElementById('pixel-editor-overlay')!.classList.remove('open');
  }

  // ── Tab switching ──────────────────────────────────────────
  private _setTab(tab: TabMode): void {
    this.mode = tab;
    const bodyWrap  = document.getElementById('pe-body-wrap')!;
    const wheelWrap = document.getElementById('pe-wheel-wrap')!;
    const btnBody   = document.getElementById('pe-tab-body')!;
    const btnWheel  = document.getElementById('pe-tab-wheel')!;

    if (tab === 'body') {
      bodyWrap.style.display  = 'block';
      wheelWrap.style.display = 'none';
      btnBody.classList.add('active');
      btnWheel.classList.remove('active');
    } else {
      bodyWrap.style.display  = 'none';
      wheelWrap.style.display = 'block';
      btnBody.classList.remove('active');
      btnWheel.classList.add('active');
    }
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
      this.tool = 'eraser'; this.activeColor = 0;
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
        if (this.tool === 'eraser') { this.tool = 'pen'; this._setActiveTool('pen'); }
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
    document.getElementById(`pe-tool-${id}`)?.classList.add('active');
  }

  // ── Events ────────────────────────────────────────────────
  private _bindEvents(): void {
    // Tab buttons
    document.getElementById('pe-tab-body')! .addEventListener('click', () => this._setTab('body'));
    document.getElementById('pe-tab-wheel')!.addEventListener('click', () => this._setTab('wheel'));

    // Tools
    document.getElementById('pe-tool-pen')!   .addEventListener('click', () => this._setActiveTool('pen'));
    document.getElementById('pe-tool-eraser')!.addEventListener('click', () => this._setActiveTool('eraser'));
    document.getElementById('pe-tool-fill')!  .addEventListener('click', () => this._setActiveTool('fill'));
    document.getElementById('pe-tool-undo')!  .addEventListener('click', () => this._undo());

    // Actions
    document.getElementById('pe-reset-btn')!  .addEventListener('click', () => this._reset());
    document.getElementById('pe-default-btn')!.addEventListener('click', () => this._loadDefault());
    document.getElementById('pe-draft-btn')!  .addEventListener('click', () => this._saveDraft());
    document.getElementById('pe-apply-btn')!  .addEventListener('click', () => this._apply());
    document.getElementById('pe-close-btn')!  .addEventListener('click', () => this.close());

    // Keyboard
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!document.getElementById('pixel-editor-overlay')!.classList.contains('open')) return;
      if (e.key === 'p' || e.key === 'P') this._setActiveTool('pen');
      if (e.key === 'e' || e.key === 'E') this._setActiveTool('eraser');
      if (e.key === 'f' || e.key === 'F') this._setActiveTool('fill');
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this._undo(); }
      if (e.key === 'Escape') this.close();
    });

    // Mouse / touch on BOTH canvases
    this._bindCanvas(this.bodyCanvas,  'body');
    this._bindCanvas(this.wheelCanvas, 'wheel');
  }

  private _bindCanvas(canvas: HTMLCanvasElement, tab: TabMode): void {
    canvas.addEventListener('mousedown', (e) => {
      this.painting = true; this._setTab(tab); this._handlePaint(e, tab);
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!this.painting || this.tool === 'fill') return;
      this._handlePaint(e, tab);
    });
    window.addEventListener('mouseup', () => { this.painting = false; });

    canvas.addEventListener('touchstart',  (e) => {
      e.preventDefault(); this.painting = true;
      this._handlePaint(e.touches[0] as any, tab);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.painting || this.tool === 'fill') return;
      this._handlePaint(e.touches[0] as any, tab);
    }, { passive: false });
    canvas.addEventListener('touchend', () => { this.painting = false; });
  }

  private _getCell(e: MouseEvent, tab: TabMode): { col: number; row: number } {
    const canvas = tab === 'body' ? this.bodyCanvas : this.wheelCanvas;
    const cols   = tab === 'body' ? CUSTOM_GRID_COLS  : CUSTOM_WHEEL_COLS;
    const rows   = tab === 'body' ? CUSTOM_GRID_ROWS  : CUSTOM_WHEEL_ROWS;
    const cW     = tab === 'body' ? BODY_W  : WHEEL_W;
    const cH     = tab === 'body' ? BODY_H  : WHEEL_H;

    const rect   = canvas.getBoundingClientRect();
    const scaleX = cW / rect.width;
    const scaleY = cH / rect.height;
    const cellW  = cW / cols;
    const cellH  = cH / rows;

    return {
      col: Math.floor((e.clientX - rect.left) * scaleX / cellW),
      row: Math.floor((e.clientY - rect.top)  * scaleY / cellH),
    };
  }

  private _handlePaint(e: MouseEvent, tab: TabMode): void {
    const cols = tab === 'body' ? CUSTOM_GRID_COLS  : CUSTOM_WHEEL_COLS;
    const rows = tab === 'body' ? CUSTOM_GRID_ROWS  : CUSTOM_WHEEL_ROWS;
    const grid = tab === 'body' ? this.bodyGrid     : this.wheelGrid;

    const { col, row } = this._getCell(e, tab);
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;

    if (this.tool === 'fill') {
      this._pushHistory(tab);
      this._floodFill(grid, col, row, cols, rows, grid[row][col], this.activeColor);
    } else {
      const newColor = this.tool === 'eraser' ? 0 : this.activeColor;
      if (grid[row][col] === newColor) return;
      this._pushHistory(tab);
      grid[row][col] = newColor;
    }
    tab === 'body' ? this.renderBody() : this.renderWheel();
  }

  // ── Flood Fill ────────────────────────────────────────────
  private _floodFill(
    grid: number[][], startCol: number, startRow: number,
    cols: number, rows: number, target: number, fill: number
  ): void {
    if (target === fill) return;
    const queue: [number, number][] = [[startCol, startRow]];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const [c, r] = queue.shift()!;
      const key = `${c},${r}`;
      if (visited.has(key)) continue;
      if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
      if (grid[r][c] !== target) continue;
      visited.add(key);
      grid[r][c] = fill;
      queue.push([c+1,r],[c-1,r],[c,r+1],[c,r-1]);
    }
  }

  // ── History ────────────────────────────────────────────────
  private _pushHistory(tab: TabMode): void {
    const hist = tab === 'body' ? this.bodyHistory : this.wheelHistory;
    const grid = tab === 'body' ? this.bodyGrid    : this.wheelGrid;
    if (hist.length > 40) hist.shift();
    hist.push(grid.map(row => [...row]));
  }

  private _undo(): void {
    if (this.mode === 'body') {
      if (this.bodyHistory.length === 0) return;
      this.bodyGrid = this.bodyHistory.pop()!;
      this.renderBody();
    } else {
      if (this.wheelHistory.length === 0) return;
      this.wheelGrid = this.wheelHistory.pop()!;
      this.renderWheel();
    }
  }

  // ── Actions ────────────────────────────────────────────────
  private _reset(): void {
    if (this.mode === 'body') {
      this._pushHistory('body');
      this.bodyGrid = makeBlankGrid();
      this.renderBody();
    } else {
      this._pushHistory('wheel');
      this.wheelGrid = makeBlankWheelGrid();
      this.renderWheel();
    }
  }

  private _loadDefault(): void {
    this._pushHistory('body');
    this._pushHistory('wheel');
    this.bodyGrid  = makeDefaultBodyGrid();
    this.wheelGrid = makeDefaultWheelGrid();
    this.renderBoth();
  }

  private _getVehicleName(): string {
    const inp = document.getElementById('pe-vehicle-name') as HTMLInputElement;
    return inp?.value.trim() || 'Xe Pixel Tùy Chỉnh';
  }

  private _saveDraft(): void {
    const draft = {
      bodyGrid:  this.bodyGrid.map(r => [...r]),
      wheelGrid: this.wheelGrid.map(r => [...r]),
      name: this._getVehicleName(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    this._showEditorToast('📋 Đã lưu nháp!');
  }

  private _loadDraft(): void {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.bodyGrid)  this.bodyGrid  = d.bodyGrid;
      if (d.wheelGrid) this.wheelGrid = d.wheelGrid;
      if (d.name) {
        const inp = document.getElementById('pe-vehicle-name') as HTMLInputElement;
        if (inp) inp.value = d.name;
      }
    } catch (_) { /* silent */ }
  }

  private _apply(): void {
    const name = this._getVehicleName();
    const id   = `custom_${Date.now()}`;
    const entry: SavedVehicle = {
      id, name,
      bodyGrid:  this.bodyGrid.map(r => [...r]),
      wheelGrid: this.wheelGrid.map(r => [...r]),
    };
    this._saveToStorage(entry);
    this.onApply(entry.bodyGrid, entry.wheelGrid, name, id);
    this._renderSavedList();
    this.close();
  }

  // ── LocalStorage ──────────────────────────────────────────
  private _getSaved(): SavedVehicle[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  private _saveToStorage(entry: SavedVehicle): void {
    const list = this._getSaved().filter(v => v.id !== entry.id);
    list.unshift(entry); // newest first
    if (list.length > 20) list.length = 20; // max 20 saved
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  /** Called from main.ts to load a saved vehicle into the editor */
  loadSaved(v: SavedVehicle): void {
    this.bodyGrid  = v.bodyGrid.map(r => [...r]);
    this.wheelGrid = v.wheelGrid.map(r => [...r]);
    const inp = document.getElementById('pe-vehicle-name') as HTMLInputElement;
    if (inp) inp.value = v.name;
    this.renderBoth();
  }

  /** Return all saved vehicles (for rebuilding dropdown) */
  getSavedVehicles(): SavedVehicle[] {
    return this._getSaved();
  }

  // ── Saved vehicles list inside the editor ─────────────────
  private _renderSavedList(): void {
    const list = document.getElementById('pe-saved-list');
    if (!list) return;
    const saved = this._getSaved();
    if (saved.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);font-size:.75rem;">Chưa có mẫu xe nào được lưu.</p>';
      return;
    }
    list.innerHTML = '';
    saved.forEach(v => {
      const row = document.createElement('div');
      row.className = 'pe-saved-item';
      row.innerHTML = `
        <span class="pe-saved-name">🎨 ${v.name}</span>
        <button class="pe-saved-load" data-id="${v.id}" title="Tải vào editor">✏️</button>
        <button class="pe-saved-apply" data-id="${v.id}" title="Áp dụng ngay">▶</button>
        <button class="pe-saved-del" data-id="${v.id}" title="Xóa">🗑</button>
      `;
      row.querySelector('.pe-saved-load')!.addEventListener('click', () => {
        this.loadSaved(v);
        this._showEditorToast(`📂 Đã tải "${v.name}" vào editor`);
      });
      row.querySelector('.pe-saved-apply')!.addEventListener('click', () => {
        this.onApply(v.bodyGrid, v.wheelGrid, v.name, v.id);
        this.close();
      });
      row.querySelector('.pe-saved-del')!.addEventListener('click', () => {
        this._deleteFromStorage(v.id);
        this._renderSavedList();
      });
      list.appendChild(row);
    });
  }

  private _deleteFromStorage(id: string): void {
    const list = this._getSaved().filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  private _showEditorToast(msg: string): void {
    const t = document.getElementById('pe-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 2000);
  }

  // ── Render ─────────────────────────────────────────────────
  renderBoth(): void {
    this.renderBody();
    this.renderWheel();
  }

  renderBody(): void {
    this._renderGrid(
      this.bodyCtx, this.bodyGrid,
      CUSTOM_GRID_COLS, CUSTOM_GRID_ROWS,
      BODY_CELL, BODY_W, BODY_H
    );
  }

  renderWheel(): void {
    this._renderGrid(
      this.wheelCtx, this.wheelGrid,
      CUSTOM_WHEEL_COLS, CUSTOM_WHEEL_ROWS,
      WHEEL_CELL, WHEEL_W, WHEEL_H
    );
  }

  private _renderGrid(
    ctx: CanvasRenderingContext2D,
    grid: number[][],
    cols: number, rows: number,
    cell: number, cW: number, cH: number
  ): void {
    ctx.clearRect(0, 0, cW, cH);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = grid[r]?.[c] ?? 0;
        const x = c * cell; const y = r * cell;
        if (color === 0) {
          ctx.fillStyle = (c + r) % 2 === 0 ? '#1c1e2e' : '#222436';
        } else {
          ctx.fillStyle = hexToCSS(color);
        }
        ctx.fillRect(x, y, cell, cell);
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, cH); ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * cell); ctx.lineTo(cW, r * cell); ctx.stroke();
    }
  }
}
