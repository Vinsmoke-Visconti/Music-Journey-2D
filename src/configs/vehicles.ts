// ============================================================
// vehicles.ts - Cấu hình Data-driven cho từng loại xe
// Music Journey 2D | Giai đoạn 1: Thiết lập cấu trúc
// ============================================================

export interface Vehicle {
  id: string;
  name: string;
  mass: number;          // Ảnh hưởng đến quán tính và độ nhún (Suspension)
  wheelOffset: number;   // Khoảng cách (px) từ tâm thân xe tới tâm bánh xe
  suspensionStrength: number; // Độ đàn hồi khi nhún (0.0 - 1.0)
  maxSpeed: number;      // Tốc độ tối đa (đơn vị game)
  acceleration: number;  // Độ tăng tốc (đơn vị game / frame)
  deceleration: number;  // Độ giảm tốc khi Brake (đơn vị game / frame)
  sprite: {
    body: string;        // Đường dẫn tới sprite sheet thân xe
    wheelFront: string;  // Sprite bánh trước
    wheelRear: string;   // Sprite bánh sau
  };
  isLocked: boolean;     // true = cần mua / đăng ký hội viên
  price: number | null;  // Giá mua lẻ (null = miễn phí)
}

export const vehicles: Vehicle[] = [
  {
    id: 'van',
    name: 'Xe Van Cổ Điển',
    mass: 1.5,
    wheelOffset: 50,
    suspensionStrength: 0.4,
    maxSpeed: 2.8,
    acceleration: 0.03,
    deceleration: 0.02,
    sprite: {
      body: 'sprites/van_body.png',
      wheelFront: 'sprites/van_wheel_front.png',
      wheelRear: 'sprites/van_wheel_rear.png',
    },
    isLocked: false,
    price: null,
  },
  {
    id: 'jeep',
    name: 'Jeep Địa Hình',
    mass: 2.0,
    wheelOffset: 60,
    suspensionStrength: 0.7,
    maxSpeed: 3.6,
    acceleration: 0.02,
    deceleration: 0.015,
    sprite: {
      body: 'sprites/jeep_body.png',
      wheelFront: 'sprites/jeep_wheel_front.png',
      wheelRear: 'sprites/jeep_wheel_rear.png',
    },
    isLocked: true,
    price: 49000, // VND
  },
  {
    id: 'pickup',
    name: 'Xe Bán Tải',
    mass: 1.8,
    wheelOffset: 55,
    suspensionStrength: 0.5,
    maxSpeed: 3.2,
    acceleration: 0.025,
    deceleration: 0.02,
    sprite: {
      body: 'sprites/pickup_body.png',
      wheelFront: 'sprites/pickup_wheel_front.png',
      wheelRear: 'sprites/pickup_wheel_rear.png',
    },
    isLocked: true,
    price: 39000, // VND
  },
];

export const getVehicleById = (id: string): Vehicle | undefined =>
  vehicles.find((v) => v.id === id);
