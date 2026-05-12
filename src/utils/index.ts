// ============================================================
// utils/index.ts - Các hàm bổ trợ (Toán học, nội suy màu sắc)
// Music Journey 2D | Giai đoạn 1: Thiết lập cấu trúc
// ============================================================

// ---- Nội suy tuyến tính ----

/**
 * Lerp: Nội suy tuyến tính giữa hai giá trị
 * @param a - Giá trị bắt đầu
 * @param b - Giá trị kết thúc
 * @param t - Tiến trình (0.0 - 1.0)
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp: Giới hạn giá trị trong khoảng [min, max]
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map: Ánh xạ giá trị từ khoảng này sang khoảng khác
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

// ---- Nội suy màu sắc (Time Sync: Hoàng hôn → Đêm) ----

interface RGB { r: number; g: number; b: number; }

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(rgb: RGB): string {
  return '#' + [rgb.r, rgb.g, rgb.b]
    .map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Nội suy màu giữa hai màu hex theo tiến trình t (0.0 - 1.0)
 * Dùng để đổi màu bầu trời theo tiến độ bài hát
 */
export function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex({
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  });
}

// ---- Các màu trời theo thời gian bài hát ----
export const SKY_COLORS = {
  dawn:    '#ff9a5e',  // Bình minh
  day:     '#87ceeb',  // Ban ngày
  sunset:  '#ff6b6b',  // Hoàng hôn
  night:   '#1a1a4e',  // Đêm
};

/**
 * Lấy màu bầu trời dựa trên tiến độ bài hát (0.0 - 1.0)
 */
export function getSkyColor(progress: number): string {
  if (progress < 0.25) {
    return lerpColor(SKY_COLORS.dawn, SKY_COLORS.day, progress / 0.25);
  } else if (progress < 0.5) {
    return lerpColor(SKY_COLORS.day, SKY_COLORS.sunset, (progress - 0.25) / 0.25);
  } else if (progress < 0.75) {
    return lerpColor(SKY_COLORS.sunset, SKY_COLORS.night, (progress - 0.5) / 0.25);
  } else {
    return SKY_COLORS.night;
  }
}

// ---- Easing Functions ----

/** Exponential Out - dùng cho gia tốc xe */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Ease In Quad - dùng cho phanh xe */
export function easeInQuad(t: number): number {
  return t * t;
}
