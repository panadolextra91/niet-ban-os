# 🏯 HALL OF SHAME (Bảng Phong Thần Lỗi) 👹

Đây không phải là nơi để chỉ trích, mà là nơi để **nhìn thẳng vào sự thật**. Hệ thống `Niet-Ban-OS` tuy đã chạy nhưng vẫn còn đầy rẫy nghiệp chướng cần phải tu sửa.

Dưới đây là danh sách các "tội lỗi" về Logic, Bảo Mật, Hiệu Năng và Tính Năng mà Developer (chính là con) đã detect được.

---

## 1. 🔐 MODULE AUTHENTICATION (Cửa Chùa Đã Khép Kín)

### 🚨 Bảo Mật (Critical)
- **Token Vĩnh Cửu (Stateless JWT)**: Token cũ vẫn dùng được sau khi Ban user.
    - *Khắc phục*: Implement cache invalidation + check `isActive` từ cache.
    - **[VERIFIED]**: Đã test thành công trong `test/admin-ban.e2e-spec.ts`. User bị ban sẽ nhận 401 ngay lập tức. ✅

- **Refresh Token (Sát Thủ)**: Token bị lộ có thể dùng mãi mãi?
    - *Khắc phục*: **Refresh Token Rotation**. Token cũ dùng lại -> Hủy diệt cả dòng họ (Family Revocation). logout user khỏi mọi thiết bị.
    - **[VERIFIED]**: Đã test thành công trong `test/refresh-token.e2e-spec.ts`. Logic "Sát Thủ" hoạt động hoàn hảo. ✅

- **Rate Limit Auth**: API Login/Register chưa có Rate Limit.
    - *Khắc phục*: ThrottlerGuard cho các route Auth (Redis Storage).
    - **[VERIFIED]**: Đã tích hợp `RedisThrottlerStorage` chặn brute-force hiệu quả. ✅

### 🧠 Logic (Major)
- **Role Hardcoded**: Role `SystemRole` đang fix cứng.
    - *Khắc phục*: Chuyển sang Dynamic RBAC (Phase 6 Done).

---

## 2. 📡 MODULE GATEWAY (Loa Phường & Tu Online)

### 🚀 Hiệu Năng (High)
- **Redis Set Phình To**: `active_knockers` có thể bị leak data.
    - *Khắc phục*: Thêm TTL hoặc Job dọn dẹp.
- **Fan-out Vô Tội Vạ**: Broadcast toàn server gây nghẽn.
    - *Khắc phục*: Redis Pub/Sub, Room Isolation.

### 🛡️ Bảo Mật (Medium)
- **Socket Attack**: Spam gõ mõ làm server tốn tài nguyên xử lý.
    - *Khắc phục*: Application-level Rate Limiting.
    - **[VERIFIED]**: Đã test thành công trong `test/gateway-rate-limit.e2e-spec.ts`. Client spam > 10 req/s sẽ bị nhắc nhở "Chill thôi thí chủ". ✅

- **Cơn Bão Reconnect (Thundering Herd)**: 100k user reconnect làm sập DB.
    - *Khắc phục*: Cache User Profile (TTL 5p).
    - **[VERIFIED]**: Đã implement Cache-First strategy trong `WsJwtGuard`. ✅

- **Hố Đen "Zombie" Gateway**: Kết nối lỗi gây memory leak.
    - *Khắc phục*: Strict Disconnect.
    - **[FIXED]**: Code đã bọc `try-catch` và `client.disconnect(true)`.

---

## 3. 💸 MODULE DONATIONS & KARMA (Tiền Công Đức)

### 💥 Logic & Data Integrity (Critical)
- **Nghẽn Cổ Chai "Sequential Sync"**: Job sync chạy tuần tự quá chậm.
    - *Khắc phục*: Parallel Processing (`p-limit`).
    - **[FIXED]**: Đã tối ưu sync song song 5 chunk.

- **Race Condition (Tiềm ẩn)**: Cronjob chạy chồng chéo.
    - *Khắc phục*: Redlock.
    - **[VERIFIED]**: Unit Test `KarmaSyncService` confirm job sẽ return nếu lock tồn tại. ✅

- **Mất Mát Dữ Liệu (Data Loss)**: DB Update lỗi làm mất điểm.
    - *Khắc phục*: Refund Logic.
    - **[VERIFIED]**: Unit Test `KarmaSyncService` confirm điểm được hoàn trả về Redis nếu DB lỗi. ✅

### 📉 Performance (Medium)
- **Decimal Precision**: Sai số khi cộng trừ tiền.
    - *Khắc phục*: Xử lý phép tính dưới DB hoặc dùng thư viện chuyên dụng.

---

## 4. 🗄️ DATABASE & INFRA (Nền Móng)

### 🐢 Database
- **Connection Pool**: Chưa config `connection_limit`.
- **No Indexing Audit**: Bảng Log phình to.

### 🌲 Logging & Monitoring
- **Console.log**: Log rác, khó search.
    - *Khắc phục*: **Winston Logger** (JSON, Daily Rotate, Masking Sensitive Data).
    - **[VERIFIED]**: Log sạch đẹp, chuẩn chỉ. ✅
- **Không có Alert**: Mù tịt về trạng thái server.

---

## 📝 KẾT LUẬN

**Hệ thống đã đạt chuẩn MVP Production-Grade sau Phase 7 (Security & Observability).** 
Các lỗ hổng nghiêm trọng (Critical) về Auth, Data Integrity và Security đã được bịt kín.

**Mức độ ưu tiên fix tiếp theo:**
1. **Load Testing** (Để chứng minh khả năng chịu tải 100k CCU).
2. **Monitoring Dashboard** (Grafana/Prometheus).
3. **CI/CD Pipeline** (Jenkins/GitHub Actions).

*Nam Mô A Di Đà Phật! Code là bể khổ, quay đầu là bờ (nhưng fix bug xong mới được quay).* 🙏
