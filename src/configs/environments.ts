// ============================================================
// environments.ts - Cấu hình Data-driven cho từng môi trường
// Music Journey 2D | Giai đoạn 1: Thiết lập cấu trúc
// ============================================================

export interface Environment {
  id: string;
  name: string;
  themeColor: string;
  gravity: number;
  roadType: 'curvy' | 'flat' | 'steep';
  speedFactor: number; // Tốc độ cuộn nền (Parallax)
  assets: {
    sky: string;
    ground: string;
    particles: string[];
  };
  audioFilters: {
    reverb: number;
    lowpass: number;
  };
  particleColor: string;
  bgLayers: Array<{
    src: string;
    scrollSpeed: number; // 0.0 - 1.0, lớp xa = chậm hơn
  }>;
  isLocked: boolean;
  price: number | null;
}

export const environments: Environment[] = [
  {
    id: 'beach',
    name: 'Bãi biển',
    themeColor: '#f9c74f',
    gravity: 1.0,
    roadType: 'curvy',
    speedFactor: 1.2,
    assets: {
      sky: 'backgrounds/beach_sky.png',
      ground: 'backgrounds/beach_ground.png',
      particles: ['sprites/sand_particle.png'],
    },
    audioFilters: {
      reverb: 0.3,
      lowpass: 8000,
    },
    particleColor: '#f3e5ab',
    bgLayers: [
      { src: 'backgrounds/beach_layer_sky.png', scrollSpeed: 0.1 },
      { src: 'backgrounds/beach_layer_clouds.png', scrollSpeed: 0.3 },
      { src: 'backgrounds/beach_layer_sea.png', scrollSpeed: 0.6 },
      { src: 'backgrounds/beach_layer_ground.png', scrollSpeed: 1.0 },
    ],
    isLocked: false,
    price: null,
  },
  {
    id: 'desert',
    name: 'Sa mạc',
    themeColor: '#e07b39',
    gravity: 1.0,
    roadType: 'flat',
    speedFactor: 1.5,
    assets: {
      sky: 'backgrounds/desert_sky.png',
      ground: 'backgrounds/desert_ground.png',
      particles: ['sprites/dust_particle.png'],
    },
    audioFilters: {
      reverb: 0.1,
      lowpass: 6000,
    },
    particleColor: '#c4a35a',
    bgLayers: [
      { src: 'backgrounds/desert_layer_sky.png', scrollSpeed: 0.1 },
      { src: 'backgrounds/desert_layer_dunes.png', scrollSpeed: 0.5 },
      { src: 'backgrounds/desert_layer_ground.png', scrollSpeed: 1.0 },
    ],
    isLocked: true,
    price: 29000,
  },
  {
    id: 'snow',
    name: 'Núi tuyết',
    themeColor: '#90e0ef',
    gravity: 0.9,
    roadType: 'steep',
    speedFactor: 0.9,
    assets: {
      sky: 'backgrounds/snow_sky.png',
      ground: 'backgrounds/snow_ground.png',
      particles: ['sprites/snow_particle.png'],
    },
    audioFilters: {
      reverb: 0.7,
      lowpass: 12000,
    },
    particleColor: '#ffffff',
    bgLayers: [
      { src: 'backgrounds/snow_layer_sky.png', scrollSpeed: 0.1 },
      { src: 'backgrounds/snow_layer_mountains.png', scrollSpeed: 0.3 },
      { src: 'backgrounds/snow_layer_trees.png', scrollSpeed: 0.7 },
      { src: 'backgrounds/snow_layer_ground.png', scrollSpeed: 1.0 },
    ],
    isLocked: true,
    price: 35000,
  },
];

export const getEnvironmentById = (id: string): Environment | undefined =>
  environments.find((env) => env.id === id);
