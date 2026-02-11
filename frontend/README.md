# Niết Bàn OS - Giao diện Chánh Điện (Frontend) 🏯

Giao diện hiện đại, tối giản và mang phong cách thiền định, được xây dựng bằng **React + Vite**.

## ✨ Các Tính năng Hiện có (UI Features)

### 1. Sảnh Chánh Điện (Main Hall)
- Giao diện Dashboard trung tâm hiển thị thông tin người dùng.
- Hiển thị điểm **Karma** thời gian thực (Real-time update).
- Tích hợp nút **Cúng dường (Mock)** và **Tự hủy (Self-Ban)** để kiểm thử hạ tầng.

### 2. Pháp Khí Mõ (The Mõ Component)
- Linh hồn của ứng dụng: Cho phép người dùng gõ mõ online.
- Hiệu ứng âm thanh chân thực (`coc.mp3`).
- Animation mượt mà với `Framer Motion` (+1 Karma khi gõ).
- Tích hợp **Debounce** để bảo vệ hệ thống khỏi spam click.

### 3. Hệ thống Thông báo Real-time
- Lắng nghe sự kiện từ WebSocket (`Socket.io`).
- Hiển thị thông báo khi có người cúng dường hoặc nổ hũ Jackpot.
- Tự động đồng bộ kết nối khi người dùng Đăng nhập/Đăng xuất.

### 4. Đăng nhập & Quy y (Auth Flow)
- Giao diện Đăng nhập và Đăng ký (Cạo đầu quy y) chuyên nghiệp.
- Xử lý xác thực qua JWT với cơ chế tự động refresh token.

## 🚧 Các mảng còn trống (UI Gaps - Backend Ready)

Hệ thống Backend đã hoàn thiện các API sau, nhưng Frontend chưa xây dựng UI:

1.  **Bảng Điều Khiển Trụ Trì (Admin Dashboard)**: Giao diện quản lý con nhang, xem danh sách người dùng và thực hiện ban/unban.
2.  **Lịch sử Cúng dường (Donation History)**: Trang hiển thị toàn bộ lịch sử nạp tiền và lời khấn của thí chủ.
3.  **Hệ thống Khóa Tu (Booking System)**: Giao diện chọn giờ gặp thầy, đặt slot tu tập (bao gồm cả vé ưu tiên Fast-Track).
4.  **Hồ sơ Con nhang (User Profile)**: Trang cập nhật thông tin cá nhân (Số điện thoại, Pháp danh, Địa chỉ ví).
5.  **Bảng Phong Thần (Leaderboard)**: Xếp hạng các con nhang dựa trên điểm Karma và Phẩm bậc tu hành.

## 🛠️ Chạy Frontend Locally

```bash
# Vào thư mục frontend
cd frontend

# Cài đặt
npm install

# Chạy dev server
npm run dev
```
*Lưu ý: Đảm bảo Backend đang chạy ở port 3000 để proxy hoạt động chính xác.*
