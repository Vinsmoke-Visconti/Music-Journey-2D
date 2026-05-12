// ============================================================
// Player.tsx - Trình phát nhạc và thanh tiến trình
// Music Journey 2D | Giai đoạn 1: Placeholder Component
// (Sẽ được xây dựng đầy đủ ở Giai đoạn 2 & 4)
// ============================================================

// NOTE: File này là placeholder TypeScript thuần.
// Khi tích hợp React/Vue ở Giai đoạn 4, sẽ chuyển sang JSX/TSX đầy đủ.

export interface PlayerProps {
  audioSrc: string;
  trackName: string;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onTimeUpdate: (progress: number) => void; // 0.0-1.0, dùng cho Time Sync màu trời
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;        // 0.0 - 1.0
  isMuted: boolean;
}

/**
 * Placeholder: Khởi tạo giao diện Player (Vanilla JS trước khi tích hợp React)
 * Giai đoạn 1: Chỉ cần audio element để test AudioSync
 */
export function createPlayerElement(container: HTMLElement, trackName: string, audioSrc: string): HTMLAudioElement {
  // Tạo audio element ẩn để AudioSync phân tích
  const audio = document.createElement('audio');
  audio.id = 'audio-player';
  audio.src = audioSrc;
  audio.controls = true;
  audio.style.position = 'fixed';
  audio.style.bottom = '20px';
  audio.style.left = '50%';
  audio.style.transform = 'translateX(-50%)';
  audio.style.zIndex = '1000';
  audio.style.borderRadius = '8px';
  container.appendChild(audio);

  console.log(`[Player] Placeholder khởi tạo: ${trackName}`);
  return audio;
}
