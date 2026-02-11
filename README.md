# Niết Bàn OS (Niet-Ban-OS) 🙏

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

![Trạng thái](https://img.shields.io/badge/Trạng%20thái-Đang%20hành%20pháp-blueviolet?style=flat-square)
![Karma](https://img.shields.io/badge/Karma-Vô%20lượng%20công%20đức-FFD700?style=flat-square)
![Security](https://img.shields.io/badge/Bảo%20mật-Kim%20Cương%20Bất%20Hoại-red?style=flat-square)
![Concurrency](https://img.shields.io/badge/Redlock-Chống%20vã%20nghiệp-blue?style=flat-square)

**Hệ thống Quản lý Chùa chiền & Tu tập Online (SaaS) - Chuyên nghiệp và Tâm linh.**

Niết Bàn OS là một nền tảng hiện đại dành cho các cơ sở tôn giáo, kết hợp giữa quản trị truyền thống và trải nghiệm "Gamify" (Game hóa) việc tu tập. Hệ thống được xây dựng với kiến trúc Microservices (Modular Monolith), đảm bảo tính bền vững "Kim Cương bất hoại".

## 📜 Các Tính năng Cốt lõi

### 1. Hệ thống Công đức (Karma Economy)
- **Tích lũy Karma**: Người dùng có thể "Gõ Mõ" để tích lũy điểm Karma.
- **Đồng bộ Real-time**: Sử dụng **Redis** làm buffer và **Redlock** để đảm bảo không xảy ra Race Condition khi đồng bộ dữ liệu từ cache vào Database.
- **Phân bậc (Ranking)**: Tự động thăng hạng (VIP/VVIP) dựa trên mức độ cúng dường và tu tập.

### 2. Bảo mật & Xác thực (Security)
- **Refresh Token Rotation**: Cơ chế xoay vòng token giúp bảo mật tuyệt đối. Nếu phát hiện token cũ được sử dụng lại, hệ thống sẽ tự động vô hiệu hóa toàn bộ "Family Token" của người dùng đó (**Nuclear Option**).
- **Hashing**: Sử dụng thuật toán **Argon2id** hiện đại nhất để băm mật khẩu.
- **RBAC**: Phân quyền chi tiết (Mở rộng từ Member, Chủ Tứ, Sư Trưởng đến Trụ Trì).

### 3. Cúng dường & Thông báo (Donations & Real-time)
- **REST + WebSocket Hybrid**: Dữ liệu cúng dường được lưu trữ qua REST API để đảm bảo tính toàn vẹn, sau đó được phát thông báo qua **Socket.io** đến toàn bộ sảnh Chánh Điện.
- **Marquee Notifications**: Hiển thị lời cầu nguyện và tên thí chủ ngay lập tức trên màn hình.

### 4. Hệ thống Phòng thủ (Hộ Pháp)
- **Rate Limiting**: Giới hạn tần suất gọi API và gõ mõ để chống spam (Throttler).
- **CI/CD**: Tự động kiểm tra code (Lint, Build, Unit Test, E2E Test) trên Github Actions trước khi triển khai.

## 🛠️ Công nghệ Sử dụng
- **Backend**: NestJS, PostgreSQL (Prisma ORM), Redis (BullMQ), Socket.io.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion.
- **Infrastructure**: Docker & Docker Compose.

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Yêu cầu hệ thống
- Node.js (v20+)
- Docker & Docker Compose
- NPM / PNPM

### 2. Cài đặt Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Khởi chạy Hạ tầng (Postgres & Redis)
```bash
docker-compose up -d
```

### 4. Thiết lập Database & Seed Dữ liệu
```bash
# Tạo schema và generate client
npx prisma db push

# Tạo dữ liệu mẫu (Tài khoản Trụ Trì Admin)
npx prisma db seed
```
*Tài khoản Admin mặc định sau khi seed:*
- **Email**: `tru-tri@nietban.com`
- **Password**: `admin123`

### 5. Chạy Ứng dụng
```bash
# Chạy Backend (Cổng 3000)
npm run start:dev

# Chạy Frontend (Cổng 5173 - Auto proxy qua 3000)
cd frontend && npm run dev
```

## 📖 Tài liệu API (Kinh Thư API)
Hệ thống tích hợp sẵn **Swagger UI**. Sau khi khởi chạy Backend, hãy truy cập:
👉 [http://localhost:3000/docs](http://localhost:3000/docs)

---
*Nam Mô A Di Đà Phật! Chúc các thí chủ code vui vẻ.*
