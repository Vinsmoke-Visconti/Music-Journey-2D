import { injectSpeedInsights } from '@vercel/speed-insights';
injectSpeedInsights();

import * as PIXI from 'pixi.js';
import { Parallax }  from './engine/Parallax';
import { Road }      from './engine/Road';
import { Vehicle }   from './engine/Vehicle';
import { Camera }    from './engine/Camera';
import { Particles } from './engine/Particles';
import { AudioSync } from './services/audioSync';
import { getEnvironmentById } from './configs/environments';
import { getVehicleById }     from './configs/vehicles';
import { getSkyColor } from './utils/index';
import { authUI } from './components/Auth';
import { shopUI } from './components/Shop';
import { supabase, getUserInventory, signOut } from './services/supabase';
import { processDemoPurchase } from './services/payment';

import { Visualizer } from './engine/Visualizer';
import { PixelEditor } from './engine/PixelEditor';
import { customVehicleStrategy } from './engine/strategies/VehicleRegistry';
import type { User } from '@supabase/supabase-js';

// ─── 0. Phase 4 State ─────────────────────────────────────────
let currentUser: User | null = null;
let userInventory: string[] = []; 

// Admin Mode check: All items unlocked if path is /admin or ?admin=true
const isAdminMode = window.location.pathname.includes('/admin') || window.location.search.includes('admin=true');
if (isAdminMode) {
  console.log('[Admin] Mode Enabled: All items unlocked.');
}
// ─── 1. PixiJS ────────────────────────────────────────────────
const app = new PIXI.Application({
  resizeTo:        window,
  backgroundColor: 0x87ceeb,
  antialias:       true,
  resolution:      window.devicePixelRatio || 1,
  autoDensity:     true,
});
document.getElementById('app')!.appendChild(app.view as HTMLCanvasElement);
document.getElementById('loading-screen')!.style.display = 'none';
console.log(`[Main] WebGL: ${app.renderer.type === PIXI.RENDERER_TYPE.WEBGL ? '✅' : '⚠️ Canvas'}`);

// ─── 2. State ─────────────────────────────────────────────────
let currentEnvId      = 'beach';
let currentVehicleId  = 'van';
let currentEnv        = getEnvironmentById(currentEnvId)!;
let currentVehicleCfg = getVehicleById(currentVehicleId)!;

// ─── 3. Layers & Engine systems ────────────────────────────────────────
const backgroundLayer = new PIXI.Container();
const parallaxLayer = new PIXI.Container();
const roadLayer = new PIXI.Container();
const vehicleLayer = new PIXI.Container();
const effectLayer = new PIXI.Container();
const uiLayer = new PIXI.Container(); // for future use

app.stage.addChild(backgroundLayer);
app.stage.addChild(parallaxLayer);
app.stage.addChild(roadLayer);
app.stage.addChild(vehicleLayer);
app.stage.addChild(effectLayer);
app.stage.addChild(uiLayer);

const parallax  = new Parallax(app, backgroundLayer, parallaxLayer);
const road      = new Road(app, roadLayer);
let   vehicle   = new Vehicle(app, currentVehicleCfg, vehicleLayer);
const camera    = new Camera(app.stage);
const particles = new Particles(app, effectLayer);
const audio     = new AudioSync();

parallax.loadEnvironment(currentEnv);
road.generatePoints(app.screen.width, currentEnvId);
road.draw(currentEnvId);
particles.setDustColor(currentEnv.particleColor);

// ─── 4. DOM refs ──────────────────────────────────────────────
const audioEl       = document.getElementById('audio-el')       as HTMLAudioElement;
const playBtn       = document.getElementById('play-btn')       as HTMLButtonElement;
const prevBtn       = document.getElementById('prev-btn')       as HTMLButtonElement;
const nextBtn       = document.getElementById('next-btn')       as HTMLButtonElement;
const volumeSlider  = document.getElementById('volume-slider')  as HTMLInputElement;
const progressBar   = document.getElementById('progress-bar')   as HTMLDivElement;
const progressFill  = document.getElementById('progress-fill')  as HTMLDivElement;
const timeEl        = document.getElementById('time-display')   as HTMLSpanElement;
const trackNameEl   = document.getElementById('track-name')     as HTMLSpanElement;
const envSelect     = document.getElementById('env-select')     as HTMLSelectElement;
const vehicleSelect = document.getElementById('vehicle-select') as HTMLSelectElement;
const stateLabel    = document.getElementById('fsm-state')      as HTMLSpanElement;
const speedBar      = document.getElementById('speed-bar')      as HTMLDivElement;
const bassBar       = document.getElementById('bass-bar')       as HTMLDivElement;
const visualizer    = new Visualizer('visualizer');
const lockToast     = document.getElementById('lock-toast')     as HTMLDivElement;
const albumArt      = document.getElementById('album-art')      as HTMLDivElement;

// ─── 5. Playlist ──────────────────────────────────────────
interface TrackEntry {
  name: string;
  src: string;
  isCustom?: boolean;
  objectUrl?: string; // For revocation later
}

let PLAYLIST: TrackEntry[] = [
  { name: '🎵 Viper Beat (Original)', src: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3' },
];
let trackIndex = 0;

// ─── IndexedDB helpers for local audio persistence ──────────────
const IDB_NAME = 'mj2d_audio_v1';
const IDB_STORE = 'tracks';
function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE))
        req.result.createObjectStore(IDB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
}
async function saveTrackIDB(id: string, name: string, buf: ArrayBuffer): Promise<void> {
  const db = await openAudioDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ id, name, data: buf });
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}
async function loadAllTracksIDB(): Promise<{id:string; name:string; blob:Blob}[]> {
  const db = await openAudioDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => res((req.result as any[]).map(r => ({
      id: r.id, name: r.name,
      blob: new Blob([r.data], { type: 'audio/mpeg' })
    })));
    req.onerror = () => rej(req.error);
  });
}
async function deleteTrackIDB(id: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}

// Restore persisted local tracks on startup
(async () => {
  try {
    const saved = await loadAllTracksIDB();
    saved.forEach(t => {
      const objectUrl = URL.createObjectURL(t.blob);
      PLAYLIST.push({ name: t.name, src: objectUrl, isCustom: true, objectUrl, id: t.id } as any);
    });
    renderPlaylist();
  } catch(e) { console.warn('[IDB] Could not load saved tracks:', e); }
})();

function loadTrack(idx: number): void {
  trackIndex = (idx + PLAYLIST.length) % PLAYLIST.length;
  audioEl.src = PLAYLIST[trackIndex].src;
  trackNameEl.textContent = PLAYLIST[trackIndex].name;
  progressFill.style.width = '0%';
  timeEl.textContent = '0:00 / 0:00';
  
  // Cập nhật trạng thái active trong UI
  document.querySelectorAll('.pl-item').forEach((el, i) => {
    el.classList.toggle('active', i === trackIndex);
  });
}

// Hàm khởi tạo danh sách nhạc trong UI
function renderPlaylist(): void {
  const container = document.getElementById('playlist-items');
  if (!container) return;
  container.innerHTML = '';
  PLAYLIST.forEach((track, i) => {
    const item = document.createElement('div');
    item.className = 'pl-item' + (i === trackIndex ? ' active' : '');
    item.setAttribute('data-idx', i.toString());

    // Marquee wrapper — CSS handles scrolling if text overflows
    item.innerHTML = `
      <span class="pl-num">${i + 1}</span>
      <span class="pl-name-wrap">
        <span class="pl-name">${track.name}</span>
      </span>
      ${track.isCustom ? `<span class="pl-badge-custom">📲</span>
        <button class="pl-del-btn" title="Xóa bài này" data-del="${i}">✕</button>` : ''}
    `;

    // Play on row click (but not on the delete button)
    item.onclick = (e) => {
      if ((e.target as HTMLElement).classList.contains('pl-del-btn')) return;
      loadTrack(i); forcePlayAudio();
    };

    // Delete local track
    const delBtn = item.querySelector('.pl-del-btn') as HTMLButtonElement | null;
    if (delBtn) {
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        const idx = parseInt(delBtn.dataset.del ?? '0');
        const t = PLAYLIST[idx] as any;
        if (t?.objectUrl) URL.revokeObjectURL(t.objectUrl);
        if (t?.id) { try { await deleteTrackIDB(t.id); } catch(_) {} }
        PLAYLIST.splice(idx, 1);
        if (trackIndex >= PLAYLIST.length) trackIndex = PLAYLIST.length - 1;
        renderPlaylist();
      };
    }

    container.appendChild(item);
  });
}


// Expose globally so playlist panel clicks work
(window as any).__loadTrack = loadTrack;

// ─── Custom Track Upload Handler ───────────────────────────────
const uploadBtn   = document.getElementById('upload-track-btn') as HTMLButtonElement | null;
const uploadInput = document.getElementById('custom-track-input') as HTMLInputElement | null;

if (uploadBtn && uploadInput) {
  uploadBtn.addEventListener('click', () => uploadInput.click());

  uploadInput.addEventListener('change', async () => {
    const files = uploadInput.files;
    if (!files || files.length === 0) return;
    const firstNewIdx = PLAYLIST.length;

    for (const file of Array.from(files)) {
      const existing = PLAYLIST.find((t: any) => t.isCustom && t.id && t.name === `🎶 ${file.name.replace(/\.(mp3|wav|ogg|flac|m4a|aac)$/i, '')}`);
      if ((existing as any)?.objectUrl) URL.revokeObjectURL((existing as any).objectUrl);

      const objectUrl = URL.createObjectURL(file);
      const displayName = file.name.replace(/\.(mp3|wav|ogg|flac|m4a|aac)$/i, '');
      const id = `local_${Date.now()}_${file.name}`;
      const entry: any = { id, name: `🎶 ${displayName}`, src: objectUrl, isCustom: true, objectUrl };
      PLAYLIST.push(entry);

      // Persist to IndexedDB
      try {
        const buf = await file.arrayBuffer();
        await saveTrackIDB(id, entry.name, buf);
      } catch(e) { console.warn('[IDB] Save failed:', e); }
    }

    renderPlaylist();
    loadTrack(firstNewIdx);
    forcePlayAudio();
    showToast(`✅ Đã thêm ${files.length} bài nhạc từ máy tính!`);
    uploadInput.value = '';
  });
}

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function forcePlayAudio() {
  if (!audio.isConnected()) {
    try {
      audio.connect(audioEl);
    } catch (e) {
      console.warn('[Audio] Context connection failed:', e);
    }
  }
  audio.resume();
  audioEl.play().catch(err => {
    console.error('[Audio] Play error:', err);
    showToast('❌ Không thể phát bài này. Thử bài khác nhé!');
    playBtn.innerHTML = '<span class="icon">▶</span>';
  });
  playBtn.innerHTML = '<span class="icon">⏸</span>';
}

// ─── 6. Toast helper ──────────────────────────────────────────
function showToast(msg: string, durationMs = 2500): void {
  if (!lockToast) return;
  lockToast.textContent = msg;
  lockToast.classList.add('visible');
  setTimeout(() => lockToast.classList.remove('visible'), durationMs);
}

// ─── 7. Event Listeners ───────────────────────────────────────
playBtn.addEventListener('click', () => {
  if (!audio.isConnected()) {
    try {
      audio.connect(audioEl);
    } catch (e) {
      console.warn('[Audio] Context connection failed:', e);
    }
  }
  audio.resume();

  if (audioEl.paused) {
    audioEl.play().catch(err => {
      console.error('[Audio] Play error:', err);
      showToast('❌ Không thể phát bài này. Thử bài khác nhé!');
      playBtn.innerHTML = '<span class="icon">▶</span>';
    });
    playBtn.innerHTML = '<span class="icon">⏸</span>';
  } else {
    audioEl.pause();
    playBtn.innerHTML = '<span class="icon">▶</span>';
  }
});

// Lắng nghe lỗi audio
audioEl.addEventListener('error', (e) => {
  console.error('[Audio] Element error:', e);
  showToast('❌ Lỗi tải nhạc. Vui lòng kiểm tra kết nối!');
  playBtn.innerHTML = '<span class="icon">▶</span>';
  vehicle.pause();
});

audioEl.addEventListener('stalled', () => {
  console.warn('[Audio] Playback stalled...');
});

prevBtn.addEventListener('click', () => {
  loadTrack(trackIndex - 1);
  forcePlayAudio();
});
nextBtn.addEventListener('click', () => {
  loadTrack(trackIndex + 1);
  forcePlayAudio();
});

volumeSlider.addEventListener('input', () => {
  audioEl.volume = parseFloat(volumeSlider.value);
});

progressBar.addEventListener('click', (e) => {
  if (!audioEl.duration) return;
  const rect  = progressBar.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  audioEl.currentTime = ratio * audioEl.duration;
});

// Environment change: check lock, reload parallax + apply audio filter
envSelect.addEventListener('change', () => {
  const newId  = envSelect.value;
  const newCfg = getEnvironmentById(newId)!;

  // Phase 5 Lock Check for Environment
  const isUnlocked = isAdminMode || !newCfg.isLocked || userInventory.includes(newId);

  if (!isUnlocked) {
    envSelect.value = currentEnvId;
    if (!currentUser) {
      showToast(`🔒 Vui lòng Đăng nhập để mở khóa ${newCfg.name}`);
      authUI.show();
    } else {
      showToast(`🔒 ${newCfg.name} là môi trường Premium!`);
    }
    return;
  }

  currentEnvId = newId;
  currentEnv   = newCfg;
  parallax.loadEnvironment(currentEnv);
  const strategy = parallax.getCurrentStrategy();
  if (strategy) {
    particles.setDustColor(strategy.getDustColor().toString(16));
  }
  road.draw(currentEnvId);
  if (audio.isConnected()) {
    audio.setLowpass(currentEnv.audioFilters.lowpass);
  }
});

// Vehicle change: check lock, destroy old, create new
vehicleSelect.addEventListener('change', () => {
  const newId  = vehicleSelect.value;
  const newCfg = getVehicleById(newId)!;

  // Phase 4 Lock Check
  const isUnlocked = isAdminMode || !newCfg.isLocked || userInventory.includes(newId);

  if (!isUnlocked) {
    // Revert select
    vehicleSelect.value = currentVehicleId;
    
    if (!currentUser) {
      showToast(`🔒 Vui lòng Đăng nhập để mở khóa ${newCfg.name}`);
      authUI.show();
    } else {
      const priceStr = newCfg.price ? `${(newCfg.price / 1000).toFixed(0)}k VNĐ` : 'Premium';
      showToast(`🔒 ${newCfg.name} là xe Premium (${priceStr}) — Cần mua tại Shop`);
    }
    return;
  }

  // Properly replace vehicle
  vehicle.destroy();
  currentVehicleId  = newId;
  currentVehicleCfg = newCfg;
  vehicle = new Vehicle(app, currentVehicleCfg, vehicleLayer);

  // If custom selected, open pixel editor immediately
  if (newId === 'custom') {
    pixelEditor.open();
    showToast('🎨 Hãy thiết kế xe của bạn và nhấn “Áp dụng”!');
  }
});

// ─── Pixel Art Editor Bootstrap ───────────────────────────────
function applyCustomVehicle(
  bodyGrid: number[][], wheelGrid: number[][], name: string, id: string
): void {
  // 1. Update the strategy pixel data
  customVehicleStrategy.updateGrid(bodyGrid, wheelGrid);

  // 2. Ensure 'custom' config is set so vehicle uses CustomVehicleStrategy
  const customCfg = getVehicleById('custom')!;
  currentVehicleId  = 'custom';
  currentVehicleCfg = customCfg;

  // 3. Rebuild vehicle
  vehicle.destroy();
  vehicle = new Vehicle(app, currentVehicleCfg, vehicleLayer);

  // 4. Sync the dropdown — add option if it's a new named save, or select 'custom'
  const vSelect = vehicleSelect;
  let opt = Array.from(vSelect.options).find(o => o.value === id);
  if (!opt) {
    // See if there's an existing option for this id to avoid duplicates
    opt = document.createElement('option');
    opt.value = id;
    vSelect.appendChild(opt);
  }
  opt.textContent = `🎨 ${name}`;
  vSelect.value = id;

  // 5. Toast
  showToast(`🎨 Áp dụng xe “${name}” thành công!`);
}

const pixelEditor = new PixelEditor(applyCustomVehicle);

// On start, rebuild dropdown with any saved vehicles from localStorage
(function _restoreSavedVehicles() {
  pixelEditor.getSavedVehicles().forEach(v => {
    const vSelect = vehicleSelect;
    if (!Array.from(vSelect.options).find(o => o.value === v.id)) {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `🎨 ${v.name}`;
      vSelect.appendChild(opt);
    }
  });
  // Wire saved-vehicle clicks from dropdown (id starts with 'custom_')
  vehicleSelect.addEventListener('change', () => {
    const val = vehicleSelect.value;
    if (val.startsWith('custom_')) {
      const saved = pixelEditor.getSavedVehicles().find(v => v.id === val);
      if (saved) {
        applyCustomVehicle(saved.bodyGrid, saved.wheelGrid, saved.name, saved.id);
      }
    }
  });
})();

// Expose globally so the inline <script> design button can open it
(window as any).__openPixelEditor = () => pixelEditor.open();

audioEl.addEventListener('ended', () => {
  loadTrack(trackIndex + 1);
  forcePlayAudio();
});

// Sync album art animation
audioEl.addEventListener('play',  () => albumArt?.classList.add('playing'));
audioEl.addEventListener('pause', () => albumArt?.classList.remove('playing'));

// --- Phase 4: Init Auth ---
async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user || null;
  if (currentUser) {
    const inv = await getUserInventory(currentUser.id);
    userInventory = inv.map(item => item.item_id);
    console.log('[Auth] Logged in:', currentUser.email || 'Unknown', 'Items:', userInventory);
    updateSelectUI();
  }
  _updateAuthUI();
}

function _updateAuthUI() {
  const authBtn = document.getElementById('auth-btn');
  if (!authBtn) return;
  if (currentUser) {
    authBtn.innerHTML = `<span class="user-email">${currentUser.email?.split('@')[0] || 'User'}</span> (Logout)`;
    authBtn.onclick = () => signOut();
  } else {
    authBtn.innerHTML = 'Login / Sign Up';
    authBtn.onclick = () => authUI.show();
  }
}

initAuth();
renderPlaylist(); // Khởi tạo danh sách nhạc
loadTrack(0);
updateSelectUI(); // Ensure UI reflects admin mode status immediately

// --- Phase 5: Shop Logic ---
async function openShop() {
  const user = currentUser;
  if (!user) {
    showToast('Vui lòng đăng nhập để mua sắm!');
    authUI.show();
    return;
  }
  
  shopUI.show(userInventory, async (itemId) => {
    const v = getVehicleById(itemId);
    const e = getEnvironmentById(itemId);
    const item = v || e;
    if (!item) return;

    showToast(`Đang xử lý mua ${item.name}...`);
    const success = await processDemoPurchase({
      userId: user.id,
      itemId: itemId,
      itemType: v ? 'vehicle' : 'environment',
      amount: (item as any).price || 0
    });

    if (success) {
      showToast(`🎉 Đã mở khóa ${item.name}!`);
      // Refresh inventory
      const inv = await getUserInventory(user.id);
      userInventory = inv.map(i => i.item_id);
      updateSelectUI(); // <-- Cập nhật lại giao diện nút chọn
    } else {
      showToast(`❌ Lỗi khi mua vật phẩm.`);
    }
  });
}

// --- Dynamic UI Update for Selects ---
function updateSelectUI() {
  const vSelect = document.getElementById('vehicle-select') as HTMLSelectElement;
  const eSelect = document.getElementById('env-select') as HTMLSelectElement;

  if (vSelect) {
    const vIcons: Record<string, string> = { van: '🚐', jeep: '🚙', pickup: '🛻', custom: '🎨' };
    Array.from(vSelect.options).forEach(opt => {
      const id = opt.value;
      const v = getVehicleById(id);
      if (v && (isAdminMode || !v.isLocked || userInventory.includes(id))) {
        opt.textContent = opt.textContent!.replace('🔒 ', '').replace(' 🔒', '').replace('🔒', '').split(' – ')[0].trim();
        const icon = vIcons[id] || '✅';
        // Tránh lặp lại icon nếu đã có
        if (!opt.textContent.includes(icon)) {
           opt.textContent = icon + ' ' + opt.textContent.replace('🚐 ', '');
        }
      }
    });
  }

  if (eSelect) {
    const eIcons: Record<string, string> = { beach: '🏖️', desert: '🏜️', snow: '🏔️', jungle: '🌿' };
    Array.from(eSelect.options).forEach(opt => {
      const id = opt.value;
      const e = getEnvironmentById(id);
      if (e && (isAdminMode || !e.isLocked || userInventory.includes(id))) {
        opt.textContent = opt.textContent!.replace('🔒 ', '').replace(' 🔒', '').replace('🔒', '').split(' – ')[0].trim();
        const icon = eIcons[id] || '✅';
        if (!opt.textContent.includes(icon)) {
          opt.textContent = icon + ' ' + opt.textContent.replace('🏖️ ', '');
        }
      }
    });
  }
}

const shopBtn = document.getElementById('shop-btn');
if (shopBtn) shopBtn.onclick = () => openShop();

// ─── 8. Visualizer (Moved to Visualizer.ts) ───────────────────

// ─── 9. Game Loop ─────────────────────────────────────────────
let frameCount = 0;

app.ticker.add(() => {
  frameCount++;
  const ad = audio.analyze();

  // FSM control
  if (ad.isPlaying) { vehicle.play(); } else { vehicle.pause(); }

  // Ground detection for both wheels
  const offsets = vehicle.getWheelXOffsets();
  const gYFront = road.getGroundYAt(vehicle.container.x + offsets.front);
  const gYRear  = road.getGroundYAt(vehicle.container.x + offsets.rear);

  vehicle.update(gYFront, gYRear, ad.bassEnergy, ad.trebleEnergy);
  const spd = vehicle.getSpeed();

  // Parallax: apply environment speedFactor, song progress, and bassEnergy for beat-reactive bounce
  parallax.update(spd * currentEnv.speedFactor, ad.progress, ad.bassEnergy);
  road.update(spd, app.screen.width, currentEnvId);

  // Particles
  if (spd > 0.3) {
    const wPos = vehicle.getWheelFrontWorldPos();
    const gY   = road.getGroundYAt(wPos.x);
    
    const strategy = parallax.getCurrentStrategy();
    if (strategy) {
      strategy.emitGroundSplash(wPos.x, gY, spd, road.getPuddleAt(wPos.x), particles.emit.bind(particles));
    }

    if (frameCount % 3 === 0) {
      const ePos = vehicle.getExhaustWorldPos();
      particles.emitSmoke(ePos.x, ePos.y, spd);
    }
  }
  // Atmospheric effects (Snow, Leaves, etc.)
  const strategy = parallax.getCurrentStrategy();
  if (strategy) {
    strategy.emitAtmosphere(app.screen.width, particles.emit.bind(particles));
  }
  particles.update();

  // Camera shake on bass kick — decays automatically, never drifts
  if (ad.isBassKick && ad.isPlaying) {
    camera.shake(Math.min(ad.bassEnergy * 2.0, 8));
  }
  camera.decayShake(); // decay shake each frame, no position lerp needed

  // Sky colour time-sync
  if (ad.duration > 0) {
    const skyHex = getSkyColor(ad.progress);
    const skyNum = parseInt(skyHex.replace('#', ''), 16);
    // Support both Pixi v6 (backgroundColor) and v7 (background.color)
    const rnd = app.renderer as any;
    if (rnd.background) rnd.background.color = skyNum;
    else if (rnd.backgroundColor !== undefined) rnd.backgroundColor = skyNum;
  }

  // Progress bar + time
  if (ad.duration > 0) {
    progressFill.style.width = `${ad.progress * 100}%`;
    timeEl.textContent = `${formatTime(ad.currentTime)} / ${formatTime(ad.duration)}`;
  }

  // FSM badge
  const stateColors: Record<string, string> = {
    IDLE: '#6b7280', ACCELERATING: '#f59e0b',
    CRUISING: '#10b981', BRAKING: '#ef4444',
  };
  const st = vehicle.getState();
  if (stateLabel) {
    stateLabel.textContent = st;
    stateLabel.style.background = stateColors[st] ?? '#6b7280';
  }

  if (speedBar) speedBar.style.width = `${(spd / currentVehicleCfg.maxSpeed) * 100}%`;
  if (bassBar)  bassBar.style.width  = `${ad.bassEnergy * 100}%`;

  // Visualizer (every 2 frames)
  if (frameCount % 2 === 0 && audio.isConnected()) {
    const analyserRef = audio.analyser;
    if (analyserRef) {
      const fftData = new Uint8Array(analyserRef.frequencyBinCount);
      analyserRef.getByteFrequencyData(fftData);
      visualizer.draw(fftData);
    }
  }
});

// ─── 10. Resize ───────────────────────────────────────────────
window.addEventListener('resize', () => {
  road.resize(app.screen.width, app.screen.height);
  road.generatePoints(app.screen.width, currentEnvId);
  road.draw(currentEnvId);
  parallax.resize(currentEnv);
});

console.log('[Main] 🎵 Music Journey 2D — Giai đoạn 5 (Refactored) hoàn thiện!');
