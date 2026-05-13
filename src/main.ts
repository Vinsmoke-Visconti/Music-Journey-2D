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

// ─── 0. Phase 4 State ─────────────────────────────────────────
let currentUser: any = null;
let userInventory: string[] = []; 

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

// ─── 3. Engine systems ────────────────────────────────────────
const parallax  = new Parallax(app);
const road      = new Road(app);
let   vehicle   = new Vehicle(app, currentVehicleCfg);   // ← let, not const
const camera    = new Camera(app.stage);
const particles = new Particles(app);
const audio     = new AudioSync();

parallax.loadEnvironment(currentEnv);
road.generatePoints(app.screen.width);
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
const visualizerEl  = document.getElementById('visualizer')     as HTMLCanvasElement;
const vizCtx        = visualizerEl?.getContext('2d');
const lockToast     = document.getElementById('lock-toast')     as HTMLDivElement;
const albumArt      = document.getElementById('album-art')      as HTMLDivElement;

// ─── 5. Playlist ──────────────────────────────────────────────
const PLAYLIST = [
  { name: '🎵 Lofi Chill Ride',  src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: '🚗 Road Trip Beats',  src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: '🌅 Sunset Drive',     src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];
let trackIndex = 0;

function loadTrack(idx: number): void {
  trackIndex = (idx + PLAYLIST.length) % PLAYLIST.length;
  audioEl.src = PLAYLIST[trackIndex].src;
  trackNameEl.textContent = PLAYLIST[trackIndex].name;
  progressFill.style.width = '0%';
  timeEl.textContent = '0:00 / 0:00';
  document.querySelectorAll('.pl-item').forEach((el, i) => {
    el.classList.toggle('active', i === trackIndex);
  });
}

// Expose globally so playlist panel clicks work
(window as any).__loadTrack = loadTrack;

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
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
  if (!audio.isConnected()) audio.connect(audioEl);
  audio.resume();
  if (audioEl.paused) {
    audioEl.play();
    playBtn.innerHTML = '<span class="icon">⏸</span>';
  } else {
    audioEl.pause();
    playBtn.innerHTML = '<span class="icon">▶</span>';
  }
});

prevBtn.addEventListener('click', () => {
  loadTrack(trackIndex - 1);
  audioEl.play();
  playBtn.innerHTML = '<span class="icon">⏸</span>';
});
nextBtn.addEventListener('click', () => {
  loadTrack(trackIndex + 1);
  audioEl.play();
  playBtn.innerHTML = '<span class="icon">⏸</span>';
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
  const isUnlocked = !newCfg.isLocked || userInventory.includes(newId);

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
  particles.setDustColor(currentEnv.particleColor);
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
  const isUnlocked = !newCfg.isLocked || userInventory.includes(newId);

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
  vehicle = new Vehicle(app, currentVehicleCfg);
});

audioEl.addEventListener('ended', () => {
  loadTrack(trackIndex + 1);
  audioEl.play();
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
    console.log('[Auth] Logged in:', currentUser.email, 'Items:', userInventory);
  }
  _updateAuthUI();
}

function _updateAuthUI() {
  const authBtn = document.getElementById('auth-btn');
  if (!authBtn) return;
  if (currentUser) {
    authBtn.innerHTML = `<span class="user-email">${currentUser.email.split('@')[0]}</span> (Logout)`;
    authBtn.onclick = () => signOut();
  } else {
    authBtn.innerHTML = 'Login / Sign Up';
    authBtn.onclick = () => authUI.show();
  }
}

initAuth();
loadTrack(0);

// --- Phase 5: Shop Logic ---
async function openShop() {
  if (!currentUser) {
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
      userId: currentUser.id,
      itemId: itemId,
      itemType: v ? 'vehicle' : 'environment',
      amount: (item as any).price || 0
    });

    if (success) {
      showToast(`🎉 Đã mở khóa ${item.name}!`);
      // Refresh inventory
      const inv = await getUserInventory(currentUser.id);
      userInventory = inv.map(i => i.item_id);
    } else {
      showToast(`❌ Lỗi khi mua vật phẩm.`);
    }
  });
}

const shopBtn = document.getElementById('shop-btn');
if (shopBtn) shopBtn.onclick = () => openShop();

// ─── 8. Visualizer ────────────────────────────────────────────
function drawVisualizer(data: Uint8Array | null): void {
  if (!vizCtx || !visualizerEl) return;
  const W = visualizerEl.width, H = visualizerEl.height;
  vizCtx.clearRect(0, 0, W, H);
  if (!data) return;

  const bars = 60;
  const step = Math.floor(data.length / bars);
  const barW = W / bars - 0.5;

  for (let i = 0; i < bars; i++) {
    const val  = data[i * step] / 255;
    const barH = val * H;
    const hue  = 40 + i * 2.5;   // gold → coral
    const sat  = 80 + val * 20;
    vizCtx.fillStyle = `hsl(${hue},${sat}%,${50 + val * 20}%)`;
    vizCtx.fillRect(i * (barW + 0.5), H - barH, barW, barH);
  }
}

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

  // Parallax: apply environment speedFactor and song progress
  parallax.update(spd * currentEnv.speedFactor, ad.progress);
  road.update(spd, app.screen.width, currentEnvId);

  // Particles
  if (spd > 0.3) {
    const wPos = vehicle.getWheelFrontWorldPos();
    const gY   = road.getGroundYAt(wPos.x);
    particles.emitDust(wPos.x, gY, spd);
    if (frameCount % 3 === 0) {
      const ePos = vehicle.getExhaustWorldPos();
      particles.emitSmoke(ePos.x, ePos.y, spd);
    }
  }
  // Atmospheric effects (Snow, Leaves, etc.)
  particles.emitAtmosphere(app.screen.width, app.screen.height, currentEnvId);
  particles.update();

  // Camera shake on bass kick
  if (ad.isBassKick && ad.isPlaying) {
    camera.shake(ad.bassEnergy * 2.5);
  }

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
      drawVisualizer(fftData);
    }
  }
});

// ─── 10. Resize ───────────────────────────────────────────────
window.addEventListener('resize', () => {
  road.resize(app.screen.width, app.screen.height);
  road.generatePoints(app.screen.width);
  road.draw(currentEnvId);
  parallax.loadEnvironment(currentEnv);
});

console.log('[Main] 🎵 Music Journey 2D — Giai đoạn 2 hoàn thiện!');
