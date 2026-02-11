# 🧪 NIET-BAN-OS TESTING STRATEGY

> "Code không có Test như đi tu mà không tụng kinh - Tâm (Logic) bất biến nhưng Dòng đời (Bug) vạn biến."

Hiện tại hệ thống đã hoàn thành **Phase 6: Quality Assurance**. Các tính năng cốt lõi (Core Features) và các bản vá lỗi (Optimizations) đã được bảo vệ bởi **Unit Test**, **Integration Test** và **E2E Test**.

---

## 1. 🎯 Unit Tests (Kiểm thử đơn vị)
**Mục tiêu**: Đảm bảo từng hàm/method hoạt động đúng logic nghiệp vụ biệt lập. Mock toàn bộ dependencies (Prisma, Redis).

### ✅ Đã hoàn thành (Implemented)

#### A. `KarmaSyncService` (Critical 🔥)
- **Source**: `src/modules/gateway/karma-sync.service.spec.ts`
- **Logic Verified**:
    - **Redlock**: Cronjob không chạy chồng chéo nếu lock đã tồn tại.
    - **Parallel Processing**: Logic chia chunk và xử lý song song (mocked).
    - **Refund Logic**: Khi DB Update lỗi, điểm công đức được hoàn trả (Refund) về Redis -> **Zero Data Loss**.

### 🔜 Các Module tiếp theo
- `AuthService` (Logic cache profile).
- `WsJwtGuard` (Logic đóng kết nối zombie).

---

## 2. 🔌 Integration Tests (Kiểm thử tích hợp)
**Mục tiêu**: Đảm bảo các module hoạt động trơn tru với nhau (API -> Service -> DB/Redis).

### ✅ Đã hoàn thành (Implemented)

#### A. Admin Flow (Ban/Unban)
- **Source**: `test/admin-ban.e2e-spec.ts`
- **Scenario Verified**:
    1. User (Active) login -> Lấy Token.
    2. Admin gọi API Ban -> User bị set `isActive: false` trong DB.
    3. Hệ thống **tự động xóa Cache** Redis của user đó.
    4. User dùng Token cũ gọi API `/users/profile` -> Bị chặn **401 Unauthorized** ngay lập tức.

---

## 3. 🌐 E2E Tests (Kiểm thử đầu cuối)
**Mục tiêu**: Kiểm thử hành vi hệ thống từ góc độ người dùng thật (Socket Client).

### ✅ Đã hoàn thành (Implemented)

#### A. Gateway Flow (Rate Limiting)
- **Source**: `test/gateway-rate-limit.e2e-spec.ts`
- **Scenario Verified**:
    1. Client connect vào Socket `/temple`.
    2. Client spam sự kiện `knock_mo` liên tục (15 lần).
    3. Server response sự kiện `chill_thoi_thi_chu` sau khi vượt quá giới hạn (10 lần/s).
    4. Redis tính đếm request chính xác.

---

## 4. 🛠️ Công Cụ (Tooling)
- **Jest**: Test Runner chính.
- **Supertest**: Test HTTP API (Admin Flow).
- **Socket.io Client**: Test Gateway (Rate Limit).
- **Redis Mock**: Giả lập Redis cho Unit/E2E test nhanh gọn.

---

## 5. 📅 Kế hoạch tiếp theo (Next Steps)
1. **Load Testing**: Dùng K6/Artillery để test kịch bản 10.000 user gõ mõ cùng lúc.
2. **CI/CD**: Tích hợp lệnh `npm test` vào GitHub Actions.
3. **Partitioning**: Test kịch bản phân mảnh bảng `KarmaLog`.

*"Thà đổ mồ hôi trên sân tập (Testing), còn hơn đổ máu trên chiến trường (Production)."*
