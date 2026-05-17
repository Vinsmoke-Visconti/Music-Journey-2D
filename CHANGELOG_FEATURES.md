# 📔 Nhật Ký Nâng Cấp Tính Năng (Feature Changelog)
`music-journey-2d` • Phiên bản: **Giai đoạn 5 (Mở rộng)**

Tài liệu này ghi nhận một cách khoa học các tính năng, nâng cấp kiến trúc và sửa lỗi đã được phát triển bổ sung so với bản phát hành ban đầu được mô tả trong [README.md](./README.md).

---

## 🎨 1. Hệ thống Vẽ & Tùy Biến Xe Độc Bản (Vehicle Customization)
Bổ sung một công cụ vẽ Pixel Art trực quan ngay trong game, cho phép người dùng sáng tạo xe của riêng mình.

### Công nghệ & Kiến trúc:
*   **Pixel Art Editor (Canvas 2D):**
    *   Lưới vẽ **32 × 16 pixel** (Tỷ lệ vàng 2:1 cho thân xe).
    *   Hỗ trợ 3 công cụ: ✏️ Bút vẽ (Pen), 🧹 Tẩy (Eraser), và 🪣 Đổ màu Flood Fill sử dụng thuật toán Breadth-First Search (BFS).
    *   Hệ thống **Undo/Redo** lưu lịch sử tới 40 bước gần nhất.
    *   Bảng màu 16 màu Retro phối sẵn tạo độ tương phản cao.
    *   Hỗ trợ đa nền tảng với đầy đủ các sự kiện cảm ứng (Touch Events).
*   **CustomVehicleStrategy (PixiJS Rendering):**
    *   Áp dụng mô hình thiết kế Strategy Pattern mới để vẽ xe trực tiếp từ mảng hai chiều `number[][]` (mã màu của grid).
    *   Vẽ động các khối chữ nhật màu (Pixel Art) bằng `PIXI.Graphics` mà không làm giảm hiệu năng khung hình.
    *   Tự động rebuild xe mới lên giao diện ngay khi nhấn nút **Áp dụng**.

---

## 🎵 2. Tải Nhạc Cá Nhân (Custom Local Audio Player)
Nâng cấp trình phát nhạc để người dùng tự do thưởng thức các bài hát yêu thích cá nhân.

### Chi tiết:
*   Tích hợp nút **📂 + Tải Nhạc** thông qua cổng File Reader HTML5.
*   Hỗ trợ nạp file âm thanh cục bộ dạng Object URL (`URL.createObjectURL`), tự động thêm vào playlist động hiện tại và phát ngay.
*   Cơ chế **dọn dẹp bộ nhớ** tự động gọi `URL.revokeObjectURL` đối với các file cũ để tránh hiện tượng rò rỉ bộ nhớ (memory leak) của trình duyệt.
*   Phát hiện và render badge **📲 Local** chuyên biệt trong Playlist Sidebar.

---

## 🌀 3. Cảnh Quan Phản Hồi Nhịp Nhạc Chuyên Sâu (Beat-Reactive Environment)
Đưa nhịp âm nhạc vào cảnh vật môi trường, tạo sự kết nối mạnh mẽ giữa âm thanh và hình ảnh.

### Chi tiết:
*   **Spring Physics (Vật lý Lò xo) trên Parallax:**
    *   Mỗi khi bộ phân tích âm tần phát hiện Bass giật vượt ngưỡng (`bassEnergy > 0.5`), một lực đẩy hướng lên sẽ tác động vào các lớp Parallax.
    *   Tính toán phản lực đàn hồi của lò xo kéo cảnh nền về vị trí ban đầu theo công thức:
        $$\text{bassVelocity} \mathrel{{+}{=}} (-\text{smoothBass}) \times \text{SPRING\_K}$$
    *   Áp dụng độ giảm chấn (Damping) giúp cảnh vật nảy lên sinh động rồi tắt dần mượt mà.
    *   Tính toán chênh lệch tốc độ cuộn (scrollSpeed) của từng lớp để tạo hiệu ứng nảy sâu (lớp gần nảy mạnh, lớp xa nảy nhẹ).

---

## 🛠️ 4. Tái Cấu Trúc Kiến Trúc & Vá Lỗi Hệ Thống (Bug Fixes & Refactoring)

### 1. Sửa lỗi trôi/lệch khung hình (Camera Shake Fix)
*   **Lỗi cũ:** Gọi `Camera.shake()` cộng trực tiếp giá trị ngẫu nhiên vào `container.x/y` gây ra hiện tượng lệch camera tích lũy vô hạn, làm lộ khoảng trống phía sau (out of bounds) khi nhạc phát to.
*   **Giải pháp:** Tách biệt hoàn toàn tọa độ gốc của camera với tọa độ rung lắc tạm thời (`shakeX/Y`). Tọa độ rung lắc này tự động tiêu hao (decay) về 0 mỗi frame theo hệ số `0.75`. Thêm hàm `camera.resetPosition()` tự động trả camera về tọa độ gốc của xe khi nhạc tắt.

### 2. Sửa lỗi sụp đổ Parallax (Spring Physics Fix)
*   **Lỗi cũ:** Code cũ tính toán lực nảy của bass làm `smoothBass` mang giá trị âm, dẫn đến việc các lớp núi/đất bị thụt xuống dưới đáy trình duyệt và không tự hồi phục.
*   **Giải pháp:** Đổi chiều lực lò xo hướng lên trên, kẹp cứng giới hạn dịch chuyển Parallax trong khoảng an toàn `[0, 8px]` và bổ sung tính năng snap về `0` khi biên độ dao động tắt dần nhỏ dưới `0.05px`.

### 3. Tách biệt Module Visualizer & Layer Manager
*   Đóng gói logic vẽ sóng âm Canvas 2D từ file `main.ts` vào lớp `Visualizer.ts` độc lập.
*   Khởi tạo hệ thống **Z-Index Manager** thông qua các Pixi Containers chuyên biệt (`backgroundLayer`, `parallaxLayer`, `roadLayer`, `vehicleLayer`, `effectLayer`) để loại bỏ hoàn toàn các lỗi đè hình ảnh.
*   Vượt qua hoàn toàn kiểm thử kiểu tĩnh của TypeScript (`npx tsc --noEmit` đạt 0 lỗi).
