// ============================================================
// audioSync.ts - Web Audio API FFT + Environmental Lowpass Filter
// Music Journey 2D | Giai đoạn 2: Hoàn thiện
// ============================================================

export interface AudioData {
  bassEnergy:   number;
  trebleEnergy: number;
  midEnergy:    number;
  isPlaying:    boolean;
  progress:     number;
  currentTime:  number;
  duration:     number;
  isBassKick:   boolean;
}

export class AudioSync {
  public  analyser:  AnalyserNode | null = null;
  private ctx:       AudioContext | null = null;
  private source:    MediaElementAudioSourceNode | null = null;
  private lowpass:   BiquadFilterNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  private audioEl:   HTMLAudioElement | null = null;
  private connected  = false;

  private readonly BASS_KICK_THRESHOLD = 0.70;
  private smoothBass   = 0;
  private smoothTreble = 0;
  private smoothMid    = 0;

  connect(el: HTMLAudioElement): void {
    if (this.connected) return;
    this.audioEl = el;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;
    this.dataArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

    this.lowpass = this.ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 20000; // default: pass all

    this.source = this.ctx.createMediaElementSource(el);
    // Chain: source → analyser (for visualizer) → lowpass → destination
    this.source.connect(this.analyser);
    this.analyser.connect(this.lowpass);
    this.lowpass.connect(this.ctx.destination);

    this.connected = true;
    console.log('[AudioSync] Web Audio API connected ✅');
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  /** Áp dụng lowpass filter theo môi trường (từ environments.ts) */
  setLowpass(freq: number): void {
    if (this.lowpass) {
      this.lowpass.frequency.setTargetAtTime(freq, this.ctx!.currentTime, 0.3);
    }
  }

  analyze(): AudioData {
    if (!this.analyser || !this.audioEl) {
      return { bassEnergy:0, trebleEnergy:0, midEnergy:0,
               isPlaying:false, progress:0, currentTime:0,
               duration:0, isBassKick:false };
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    const sampleRate = this.ctx!.sampleRate;
    const binCount   = this.analyser.frequencyBinCount;
    const binHz      = sampleRate / (binCount * 2);

    const energy = (fLow: number, fHigh: number): number => {
      const iL = Math.max(0, Math.floor(fLow / binHz));
      const iH = Math.min(binCount - 1, Math.floor(fHigh / binHz));
      if (iH <= iL) return 0;
      let s = 0;
      for (let i = iL; i <= iH; i++) s += this.dataArray[i];
      return s / ((iH - iL + 1) * 255);
    };

    const rawBass   = energy(20, 150);
    const rawMid    = energy(300, 2000);
    const rawTreble = energy(4000, 16000);

    const α = 0.25;
    this.smoothBass   += (rawBass   - this.smoothBass)   * α;
    this.smoothMid    += (rawMid    - this.smoothMid)    * α;
    this.smoothTreble += (rawTreble - this.smoothTreble) * α;

    const dur = this.audioEl.duration  || 0;
    const cur = this.audioEl.currentTime;

    return {
      bassEnergy:   Math.min(1, this.smoothBass),
      trebleEnergy: Math.min(1, this.smoothTreble),
      midEnergy:    Math.min(1, this.smoothMid),
      isPlaying:    !this.audioEl.paused && !this.audioEl.ended,
      progress:     dur > 0 ? cur / dur : 0,
      currentTime:  cur,
      duration:     dur,
      isBassKick:   rawBass > this.BASS_KICK_THRESHOLD,
    };
  }

  getFftData(): Uint8Array | null {
    if (!this.analyser) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  isConnected(): boolean { return this.connected; }

  disconnect(): void {
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.lowpass?.disconnect();
    this.connected = false;
  }
}
