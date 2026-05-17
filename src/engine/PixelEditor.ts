import {
  CUSTOM_GRID_COLS, CUSTOM_GRID_ROWS, CUSTOM_WHEEL_COLS, CUSTOM_WHEEL_ROWS,
  makeBlankGrid, makeBlankWheelGrid, makeDefaultBodyGrid, makeDefaultWheelGrid,
} from './strategies/vehicles/CustomVehicleStrategy';

// Canvas display pixel sizes
const BODY_CELL  = 10;
const WHEEL_CELL = 14;
const BODY_W  = CUSTOM_GRID_COLS * BODY_CELL;   // 640
const BODY_H  = CUSTOM_GRID_ROWS * BODY_CELL;   // 320
const WHEEL_W = CUSTOM_WHEEL_COLS * WHEEL_CELL; // 336
const WHEEL_H = CUSTOM_WHEEL_ROWS * WHEEL_CELL; // 336

const STORAGE_KEY = 'mj2d_custom_vehicles';
const DRAFT_KEY   = 'mj2d_draft';

// 32 palette colours (4 rows × 8)
const PALETTE: number[] = [
  0x1a1a2e,0x16213e,0x0f3460,0x533483,0x2d1b33,0x461b2b,0x321a1a,0x1a2a1a,
  0xe94560,0xf5a623,0xf9c74f,0x90be6d,0x43aa8b,0x4d908e,0x277da1,0x0096c7,
  0xff6b6b,0xffa726,0xffd54f,0xaed581,0x80cbc4,0x80deea,0x90caf9,0xce93d8,
  0xf8f9fa,0xe0e0e0,0xbdbdbd,0x9e9e9e,0x757575,0x616161,0x424242,0x212121,
];

export interface SavedVehicle { id:string; name:string; bodyGrid:number[][]; wheelGrid:number[][]; }
type Tool    = 'pen'|'eraser'|'fill'|'line'|'circle';
type TabMode = 'body'|'wheel'|'saved';

function numToCSS(v:number):string {
  if(v>0xFFFFFF){const a=((v>>>24)&0xFF)/255,r=(v>>>16)&0xFF,g=(v>>>8)&0xFF,b=v&0xFF;return `rgba(${r},${g},${b},${a.toFixed(3)})`;}
  return `#${v.toString(16).padStart(6,'0')}`;
}
function packColor(hex:number, alpha:number):number {
  // alpha 0-255, hex 24-bit RGB → ARGB 32-bit (or 0 if transparent)
  if(alpha===0)return 0;
  if(alpha===255)return hex&0xFFFFFF; // legacy format for full opacity
  return ((alpha&0xFF)<<24)|(hex&0xFFFFFF);
}

export class PixelEditor {
  private bodyGrid:number[][]  = makeDefaultBodyGrid();
  private wheelGrid:number[][] = makeDefaultWheelGrid();
  private bodyHist:number[][][] = [];
  private wheelHist:number[][][] = [];

  private color  = PALETTE[1];  // current RGB hex
  private opacity = 255;        // 0–255
  private tool:Tool    = 'pen';
  private mode:TabMode = 'body';
  private zoom  = 1.0;
  private painting = false;
  private dragStart:{col:number;row:number}|null = null;

  private bodyCanvas!:HTMLCanvasElement;  private bodyCtx!:CanvasRenderingContext2D;
  private wheelCanvas!:HTMLCanvasElement; private wheelCtx!:CanvasRenderingContext2D;
  private previewCanvas!:HTMLCanvasElement; private previewCtx!:CanvasRenderingContext2D;

  private onApply:(b:number[][],w:number[][],name:string,id:string)=>void;

  constructor(onApply:(b:number[][],w:number[][],name:string,id:string)=>void){
    this.onApply=onApply;
    this.bodyCanvas   = document.getElementById('pe-body-canvas')   as HTMLCanvasElement;
    this.wheelCanvas  = document.getElementById('pe-wheel-canvas')  as HTMLCanvasElement;
    this.previewCanvas= document.getElementById('pe-preview-canvas')as HTMLCanvasElement;
    this.bodyCanvas.width=BODY_W;   this.bodyCanvas.height=BODY_H;
    this.wheelCanvas.width=WHEEL_W; this.wheelCanvas.height=WHEEL_H;
    this.previewCanvas.width=BODY_W;this.previewCanvas.height=BODY_H;
    this.bodyCtx    = this.bodyCanvas.getContext('2d')!;
    this.wheelCtx   = this.wheelCanvas.getContext('2d')!;
    this.previewCtx = this.previewCanvas.getContext('2d')!;
    this._buildPalette();
    this._bindEvents();
    this._setTab('body');
    this._loadDraft();
    this.renderBoth();
    this._renderSavedList();
  }

  open(){document.getElementById('pixel-editor-overlay')!.classList.add('open');this.renderBoth();}
  close(){document.getElementById('pixel-editor-overlay')!.classList.remove('open');}

  // ── Tabs ──────────────────────────────────────────────────
  private _setTab(t:TabMode){
    this.mode=t;
    const bw=document.getElementById('pe-body-wrap')!;
    const ww=document.getElementById('pe-wheel-wrap')!;
    const sw=document.getElementById('pe-saved-wrap')!;
    bw.style.display=t==='body'?'block':'none';
    ww.style.display=t==='wheel'?'block':'none';
    sw.style.display=t==='saved'?'block':'none';
    document.querySelectorAll('.pe-tab-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById(`pe-tab-${t}`)?.classList.add('active');
    if(t==='saved')this._renderSavedList();
  }

  // ── Palette ───────────────────────────────────────────────
  private _buildPalette(){
    const c=document.getElementById('pe-palette')!;
    c.innerHTML='';
    // Eraser
    const er=document.createElement('div');
    er.className='pe-swatch pe-swatch-eraser';er.title='Tẩy';
    er.addEventListener('click',()=>{this.tool='eraser';this._setActiveTool('eraser');this._setActiveSwatch(er);});
    c.appendChild(er);
    PALETTE.forEach(hex=>{
      const s=document.createElement('div');
      s.className='pe-swatch';s.style.background=`#${hex.toString(16).padStart(6,'0')}`;
      s.addEventListener('click',()=>{
        this.color=hex;if(this.tool==='eraser'){this.tool='pen';this._setActiveTool('pen');}
        this._setActiveSwatch(s);this._syncColorUI();
      });
      c.appendChild(s);
    });
    // mark first swatch active
    (c.children[1] as HTMLElement)?.classList.add('active');
    this._syncColorUI();
  }
  private _setActiveSwatch(el:HTMLElement){document.querySelectorAll('.pe-swatch').forEach(s=>s.classList.remove('active'));el.classList.add('active');}
  private _syncColorUI(){
    const hex=`#${this.color.toString(16).padStart(6,'0')}`;
    (document.getElementById('pe-hex-input') as HTMLInputElement).value=hex;
    (document.getElementById('pe-color-preview') as HTMLElement).style.background=hex;
    (document.getElementById('pe-opacity-slider') as HTMLInputElement).value=String(this.opacity);
    (document.getElementById('pe-opacity-val') as HTMLElement).textContent=`${Math.round(this.opacity/2.55)}%`;
  }

  private _setActiveTool(t:Tool){
    this.tool=t;
    document.querySelectorAll('.pe-tool-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById(`pe-tool-${t}`)?.classList.add('active');
  }

  // ── Events ────────────────────────────────────────────────
  private _bindEvents(){
    // Tabs
    (['body','wheel','saved'] as TabMode[]).forEach(t=>
      document.getElementById(`pe-tab-${t}`)?.addEventListener('click',()=>this._setTab(t)));
    // Tools
    (['pen','eraser','fill','line','circle'] as Tool[]).forEach(t=>
      document.getElementById(`pe-tool-${t}`)?.addEventListener('click',()=>this._setActiveTool(t)));
    // Undo
    document.getElementById('pe-tool-undo')?.addEventListener('click',()=>this._undo());
    // Zoom
    document.getElementById('pe-zoom-in')?.addEventListener('click',()=>this._setZoom(Math.min(this.zoom+0.25,3)));
    document.getElementById('pe-zoom-out')?.addEventListener('click',()=>this._setZoom(Math.max(this.zoom-0.25,0.5)));
    // Hex colour input
    document.getElementById('pe-hex-input')?.addEventListener('change',(e)=>{
      const v=(e.target as HTMLInputElement).value.replace('#','');
      const n=parseInt(v,16);if(!isNaN(n)){this.color=n;this._syncColorUI();}
    });
    // Opacity slider
    document.getElementById('pe-opacity-slider')?.addEventListener('input',(e)=>{
      this.opacity=parseInt((e.target as HTMLInputElement).value);this._syncColorUI();
    });
    // Actions
    document.getElementById('pe-reset-btn')?.addEventListener('click',()=>this._reset());
    document.getElementById('pe-default-btn')?.addEventListener('click',()=>this._loadDefault());
    document.getElementById('pe-draft-btn')?.addEventListener('click',()=>this._saveDraft());
    document.getElementById('pe-apply-btn')?.addEventListener('click',()=>this._apply());
    document.getElementById('pe-close-btn')?.addEventListener('click',()=>this.close());
    // Keyboard
    window.addEventListener('keydown',(e:KeyboardEvent)=>{
      if(!document.getElementById('pixel-editor-overlay')!.classList.contains('open'))return;
      const k=e.key.toLowerCase();
      if(!e.ctrlKey&&!e.metaKey){
        if(k==='p')this._setActiveTool('pen');
        if(k==='e')this._setActiveTool('eraser');
        if(k==='f')this._setActiveTool('fill');
        if(k==='l')this._setActiveTool('line');
        if(k==='c')this._setActiveTool('circle');
      }
      if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();this._undo();}
      if(e.key==='Escape')this.close();
    });
    // Canvas
    this._bindCanvas(this.bodyCanvas,'body');
    this._bindCanvas(this.wheelCanvas,'wheel');
    // Single global mouseup listener (avoid duplicate registration per canvas)
    window.addEventListener('mouseup', this._onMouseUp);
  }

  private _bindCanvas(canvas:HTMLCanvasElement,tab:TabMode){
    canvas.addEventListener('mousedown',(e)=>{
      this.painting=true;
      this.dragStart=this._getCell(e,tab);
      if(this.tool==='pen'||this.tool==='eraser'||this.tool==='fill')this._handlePaint(e,tab);
    });
    canvas.addEventListener('mousemove',(e)=>{
      if(!this.painting)return;
      if(this.tool==='line'||this.tool==='circle'){this._drawPreview(e,tab);}
      else if(this.tool!=='fill')this._handlePaint(e,tab);
    });
    canvas.addEventListener('touchstart',(e)=>{e.preventDefault();this.painting=true;const t=e.touches[0] as any;this.dragStart=this._getCell(t,tab);this._handlePaint(t,tab);},{passive:false});
    canvas.addEventListener('touchmove',(e)=>{e.preventDefault();if(!this.painting||this.tool==='fill')return;this._handlePaint(e.touches[0] as any,tab);},{passive:false});
    canvas.addEventListener('touchend',()=>{this.painting=false;this.dragStart=null;});
  }

  // Single global mouseup — registered once in _bindEvents, not per-canvas
  private _onMouseUp=(e:MouseEvent)=>{
    if(!this.painting)return;
    this.painting=false;
    if((this.tool==='line'||this.tool==='circle')&&this.dragStart){
      this._commitShape(e, this.mode==='wheel'?'wheel':'body');
    }
    this.dragStart=null;
    this.previewCtx.clearRect(0,0,BODY_W,BODY_H);
  };

  private _getCell(e:{clientX:number;clientY:number},tab:TabMode):{col:number;row:number}{
    const canvas = tab==='body' ? this.bodyCanvas : this.wheelCanvas;
    // Derive cols/rows from the ACTUAL grid array to avoid any import caching mismatch
    const grid   = tab==='body' ? this.bodyGrid   : this.wheelGrid;
    const rows   = grid.length;
    const cols   = grid[0]?.length ?? 1;
    const rect   = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / rect.width  * cols);
    const row = Math.floor((e.clientY - rect.top)  / rect.height * rows);
    return { col, row };
  }

  private _handlePaint(e:{clientX:number;clientY:number},tab:TabMode){
    const grid=tab==='body'?this.bodyGrid:this.wheelGrid;
    const {col,row}=this._getCell(e,tab);
    // Use ACTUAL grid dimensions to ensure full grid is accessible
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    if(col<0||col>=cols||row<0||row>=rows)return;
    if(this.tool==='fill'){
      this._pushHistory(tab);
      this._floodFill(grid,col,row,cols,rows,grid[row][col],packColor(this.color,this.opacity));
    }else{
      const nc=this.tool==='eraser'?0:packColor(this.color,this.opacity);
      if(grid[row][col]===nc)return;
      this._pushHistory(tab);
      grid[row][col]=nc;
    }
    tab==='body'?this.renderBody():this.renderWheel();
  }

  // ── Shape preview ─────────────────────────────────────────
  private _drawPreview(e:MouseEvent,tab:TabMode){
    if(!this.dragStart||tab!=='body')return;
    const {col,row}=this._getCell(e,'body');
    const cell=BODY_CELL;
    this.previewCtx.clearRect(0,0,BODY_W,BODY_H);
    this.previewCtx.strokeStyle=numToCSS(this.color);
    this.previewCtx.lineWidth=cell;
    this.previewCtx.beginPath();
    if(this.tool==='line'){
      this.previewCtx.moveTo(this.dragStart.col*cell+cell/2,this.dragStart.row*cell+cell/2);
      this.previewCtx.lineTo(col*cell+cell/2,row*cell+cell/2);
    }else if(this.tool==='circle'){
      const r=Math.hypot(col-this.dragStart.col,row-this.dragStart.row)*cell;
      this.previewCtx.arc(this.dragStart.col*cell+cell/2,this.dragStart.row*cell+cell/2,r,0,Math.PI*2);
    }
    this.previewCtx.stroke();
  }

  private _commitShape(e:MouseEvent,tab:TabMode){
    if(!this.dragStart)return;
    const grid=tab==='body'?this.bodyGrid:this.wheelGrid;
    const {col,row}=this._getCell(e,tab);
    const nc=packColor(this.color,this.opacity);
    this._pushHistory(tab);
    if(this.tool==='line'){
      this._bresenhamLine(grid,this.dragStart.col,this.dragStart.row,col,row,nc,
        tab==='body'?CUSTOM_GRID_COLS:CUSTOM_WHEEL_COLS,tab==='body'?CUSTOM_GRID_ROWS:CUSTOM_WHEEL_ROWS);
    }else if(this.tool==='circle'){
      const r=Math.round(Math.hypot(col-this.dragStart.col,row-this.dragStart.row));
      this._bresenhamCircle(grid,this.dragStart.col,this.dragStart.row,r,nc,
        tab==='body'?CUSTOM_GRID_COLS:CUSTOM_WHEEL_COLS,tab==='body'?CUSTOM_GRID_ROWS:CUSTOM_WHEEL_ROWS);
    }
    tab==='body'?this.renderBody():this.renderWheel();
  }

  private _bresenhamLine(g:number[][],x0:number,y0:number,x1:number,y1:number,c:number,cols:number,rows:number){
    const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;
    let err=dx-dy;
    for(;;){
      if(x0>=0&&x0<cols&&y0>=0&&y0<rows)g[y0][x0]=c;
      if(x0===x1&&y0===y1)break;
      const e2=2*err;
      if(e2>-dy){err-=dy;x0+=sx;}
      if(e2<dx){err+=dx;y0+=sy;}
    }
  }

  private _bresenhamCircle(g:number[][],cx:number,cy:number,r:number,c:number,cols:number,rows:number){
    const sp=(x:number,y:number)=>{if(x>=0&&x<cols&&y>=0&&y<rows)g[y][x]=c;};
    let x=0,y=r,d=3-2*r;
    const pts=()=>{sp(cx+x,cy+y);sp(cx-x,cy+y);sp(cx+x,cy-y);sp(cx-x,cy-y);sp(cx+y,cy+x);sp(cx-y,cy+x);sp(cx+y,cy-x);sp(cx-y,cy-x);};
    pts();
    while(y>=x){x++;if(d>0){y--;d=d+4*(x-y)+10;}else{d=d+4*x+6;}pts();}
  }

  // ── Flood fill (O(n) BFS with pointer, not shift()) ────────────
  private _floodFill(g:number[][],sc:number,sr:number,cols:number,rows:number,tgt:number,fill:number){
    if(tgt===fill)return;
    const visited=new Uint8Array(cols*rows); // fast bitset
    const q=new Int32Array(cols*rows*2);     // pre-allocated pair buffer
    let head=0,tail=0;
    q[tail++]=sc; q[tail++]=sr;
    while(head<tail){
      const c=q[head++],r=q[head++];
      if(c<0||c>=cols||r<0||r>=rows)continue;
      const k=r*cols+c;
      if(visited[k]||g[r][c]!==tgt)continue;
      visited[k]=1; g[r][c]=fill;
      q[tail++]=c+1;q[tail++]=r;
      q[tail++]=c-1;q[tail++]=r;
      q[tail++]=c;  q[tail++]=r+1;
      q[tail++]=c;  q[tail++]=r-1;
    }
  }

  // ── History ───────────────────────────────────────────────
  private _pushHistory(tab:TabMode){
    const hist=tab==='body'?this.bodyHist:this.wheelHist;
    const grid=tab==='body'?this.bodyGrid:this.wheelGrid;
    if(hist.length>40)hist.shift();
    hist.push(grid.map(r=>[...r]));
  }
  private _undo(){
    if(this.mode==='body'&&this.bodyHist.length){this.bodyGrid=this.bodyHist.pop()!;this.renderBody();}
    else if(this.mode==='wheel'&&this.wheelHist.length){this.wheelGrid=this.wheelHist.pop()!;this.renderWheel();}
  }

  // ── Zoom ─────────────────────────────────────────────────
  private _setZoom(z:number){
    this.zoom=z;
    const bi=document.getElementById('pe-body-inner')!;
    const wi=document.getElementById('pe-wheel-inner')!;
    bi.style.transform=`scale(${z})`;
    wi.style.transform=`scale(${z})`;
    bi.style.width=`${BODY_W*z}px`;  bi.style.height=`${BODY_H*z}px`;
    wi.style.width=`${WHEEL_W*z}px`; wi.style.height=`${WHEEL_H*z}px`;
    (document.getElementById('pe-zoom-val') as HTMLElement).textContent=`${Math.round(z*100)}%`;
  }

  // ── Actions ───────────────────────────────────────────────
  private _reset(){
    if(this.mode==='body'){this._pushHistory('body');this.bodyGrid=makeBlankGrid();this.renderBody();}
    else if(this.mode==='wheel'){this._pushHistory('wheel');this.wheelGrid=makeBlankWheelGrid();this.renderWheel();}
  }
  private _loadDefault(){
    this._pushHistory('body');this._pushHistory('wheel');
    this.bodyGrid=makeDefaultBodyGrid();this.wheelGrid=makeDefaultWheelGrid();
    this.renderBoth();
  }
  private _getName():string{return (document.getElementById('pe-vehicle-name') as HTMLInputElement)?.value.trim()||'Xe Pixel';}
  private _saveDraft(){
    localStorage.setItem(DRAFT_KEY,JSON.stringify({bodyGrid:this.bodyGrid,wheelGrid:this.wheelGrid,name:this._getName()}));
    this._toast('📋 Đã lưu nháp!');
  }
  private _loadDraft(){
    try{const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');
      if(d.bodyGrid)this.bodyGrid=d.bodyGrid;if(d.wheelGrid)this.wheelGrid=d.wheelGrid;
      if(d.name)(document.getElementById('pe-vehicle-name') as HTMLInputElement).value=d.name;
    }catch(_){}
  }
  private _apply(){
    const name=this._getName(),id=`custom_${Date.now()}`;
    const entry:SavedVehicle={id,name,bodyGrid:this.bodyGrid.map(r=>[...r]),wheelGrid:this.wheelGrid.map(r=>[...r])};
    this._saveToStorage(entry);
    this.onApply(entry.bodyGrid,entry.wheelGrid,name,id);
    this._renderSavedList();
    this.close();
  }

  // ── Storage ───────────────────────────────────────────────
  private _getSaved():SavedVehicle[]{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch{return[];}}
  private _saveToStorage(e:SavedVehicle){const l=this._getSaved().filter(v=>v.id!==e.id);l.unshift(e);if(l.length>20)l.length=20;localStorage.setItem(STORAGE_KEY,JSON.stringify(l));}
  private _deleteFromStorage(id:string){localStorage.setItem(STORAGE_KEY,JSON.stringify(this._getSaved().filter(v=>v.id!==id)));}

  getSavedVehicles():SavedVehicle[]{return this._getSaved();}
  loadSaved(v:SavedVehicle){
    this.bodyGrid=v.bodyGrid.map(r=>[...r]);this.wheelGrid=v.wheelGrid.map(r=>[...r]);
    (document.getElementById('pe-vehicle-name') as HTMLInputElement).value=v.name;
    this.renderBoth();
  }

  private _renderSavedList(){
    const list=document.getElementById('pe-saved-list')!;
    if(!list)return;
    const saved=this._getSaved();
    if(!saved.length){list.innerHTML='<p style="color:var(--muted);font-size:.75rem;padding:8px">Chưa có mẫu xe nào.</p>';return;}
    list.innerHTML='';
    saved.forEach(v=>{
      const row=document.createElement('div');row.className='pe-saved-item';
      row.innerHTML=`<span class="pe-saved-name">🎨 ${v.name}</span>
        <button class="pe-saved-load" title="Tải vào editor">✏️</button>
        <button class="pe-saved-apply" title="Áp dụng ngay">▶</button>
        <button class="pe-saved-del" title="Xóa">🗑</button>`;
      row.querySelector('.pe-saved-load')!.addEventListener('click',()=>{this.loadSaved(v);this._setTab('body');this._toast(`📂 Đã tải "${v.name}"`)});
      row.querySelector('.pe-saved-apply')!.addEventListener('click',()=>{this.onApply(v.bodyGrid,v.wheelGrid,v.name,v.id);this.close();});
      row.querySelector('.pe-saved-del')!.addEventListener('click',()=>{this._deleteFromStorage(v.id);this._renderSavedList();});
      list.appendChild(row);
    });
  }

  private _toast(msg:string){
    const t=document.getElementById('pe-toast');if(!t)return;
    t.textContent=msg;t.classList.add('visible');setTimeout(()=>t.classList.remove('visible'),2200);
  }

  // ── Render ────────────────────────────────────────────────
  renderBoth(){this.renderBody();this.renderWheel();}

  renderBody(){
    this._renderGrid(this.bodyCtx,this.bodyGrid,CUSTOM_GRID_COLS,CUSTOM_GRID_ROWS,BODY_CELL,BODY_W,BODY_H);
  }
  renderWheel(){
    this._renderGrid(this.wheelCtx,this.wheelGrid,CUSTOM_WHEEL_COLS,CUSTOM_WHEEL_ROWS,WHEEL_CELL,WHEEL_W,WHEEL_H);
  }

  private _renderGrid(ctx:CanvasRenderingContext2D,grid:number[][],cols:number,rows:number,cell:number,cW:number,cH:number){
    ctx.clearRect(0,0,cW,cH);
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const v=grid[r]?.[c]??0;
        // Light gray-white checkerboard for empty cells (easy to see both dark and light colors)
        ctx.fillStyle=v===0?((c+r)%2===0?'#c8c8c8':'#d8d8d8'):numToCSS(v);
        ctx.fillRect(c*cell,r*cell,cell,cell);
      }
    }
    ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.lineWidth=0.5;
    for(let c=0;c<=cols;c++){ctx.beginPath();ctx.moveTo(c*cell,0);ctx.lineTo(c*cell,cH);ctx.stroke();}
    for(let r=0;r<=rows;r++){ctx.beginPath();ctx.moveTo(0,r*cell);ctx.lineTo(cW,r*cell);ctx.stroke();}
  }
}
