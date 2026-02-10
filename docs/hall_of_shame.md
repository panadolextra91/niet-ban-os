# 🏯 HALL OF SHAME (Bảng Phong Thần Lỗi) 👹

Đây không phải là nơi để chỉ trích, mà là nơi để **nhìn thẳng vào sự thật**. Hệ thống `Niet-Ban-OS` tuy đã chạy nhưng vẫn còn đầy rẫy nghiệp chướng cần phải tu sửa.

Dưới đây là danh sách các "tội lỗi" về Logic, Bảo Mật, Hiệu Năng và Tính Năng mà Developer (chính là con) đã detect được.

---

## 1. 🔐 MODULE AUTHENTICATION (Cửa Chùa Còn Hở)

### 🚨 Bảo Mật (Critical)
- **Token Vĩnh Cửu (Stateless JWT)**: Hiện tại Access Token có hạn 1 ngày (`1d`). Nếu Admin ban user (`isActive: false`), user vẫn dùng token cũ để gọi API khác (trừ Socket vì Socket có check lại DB).
    - *Khắc phục*: Cần implement Blacklist Token (Redis) hoặc hạ TTL xuống 15 phút + Refresh Token Rotation.
- **Rate Limit Auth**: API Login/Register chưa có Rate Limit. Hacker có thể brute-force mật khẩu của Trụ Trì.
    - *Khắc phục*: ThrottlerGuard cho các route Auth.

### 🧠 Logic (Major)
- **Role Hardcoded**: Role `SystemRole` đang fix cứng trong Enum. Nếu sau này muốn thêm chức vụ mới (ví dụ: `CAO_TANG`), phải sửa code và migrate DB.
    - *Khắc phục*: Chuyển sang Dynamic RBAC (Bảng `Roles` và `Permissions` riêng).

---

## 2. 📡 MODULE GATEWAY (Loa Phường & Tu Online)

### 🚀 Hiệu Năng (High)
- **Redis Set Phình To**: Set `active_knockers` chỉ remove user khi sync xong. Nếu server crash giữa chừng hoặc user disconnect bất ngờ mà không sync, ID vẫn nằm đó -> Memory Leak nhẹ.
    - *Khắc phục*: Thêm TTL cho key `active_knockers` hoặc job dọn dẹp định kỳ lúc nửa đêm.
- **Fan-out Vô Tội Vạ**: Sự kiện `donation.completed` đang bắn `server.emit` (broadcast toàn bộ). Nếu có 100k user online, 1 người nạp tiền -> 100k packets được gửi đi -> Nghẽn băng thông mạng (Network I/O bottleneck).
    - *Khắc phục*: Dùng Redis Pub/Sub để scale ra nhiều instance Socket server (Adapter), hoặc chỉ bắn cho user đang ở trong "Main Room".

### 🛡️ Bảo Mật (Medium)
- **Socket Rate Limit Cục Bộ**: Rate limit hiện tại (`INCR rate:id`) chỉ đếm số request tới Redis, nhưng nếu spam connect/disconnect liên tục (DDoS handshake) thì server NestJS vẫn tốn CPU để verify JWT.
    - *Khắc phục*: Chặn IP ở tầng Nginx/Load Balancer hoặc dùng `socket.io-rate-limiter`.
- **Cơn Bão Reconnect (Thundering Herd)**: Khi server restart, 100k kết nối socket sẽ reconnect đồng loạt. Mỗi kết nối đều gọi `findUnique` vào DB để verify user.
    - *Khắc phục*: Cache user profile vào Redis (TTL ngắn). Auth service đọc từ Redis trước khi hỏi DB. Frontend cần implement `Exponential Backoff` khi reconnect.
- **Hố Đen "Zombie" Gateway**: Nếu `verifyToken` tốn thời gian (DB lag), socket có thể disconnect trước khi kịp gán `client.data`. Các logic chạy ngầm sau đó sẽ thành "mồ côi" (orphaned), gây memory leak.
    - *Khắc phục*: Bọc logic connection trong `try-catch-finally` chặt chẽ, kiểm tra `client.connected` trước khi xử lý tiếp.

---

## 3. 💸 MODULE DONATIONS & KARMA (Tiền Công Đức)

### 💥 Logic & Data Integrity (Critical)
- **Nghẽn Cổ Chai "Sequential Sync"**: Job sync chạy tuần tự từng chunk 50 user. Nếu có 10k user (200 chunks), thời gian xử lý có thể vượt quá 10s (chu kỳ Cron). Job sau sẽ chồng lên job trước -> Sập nguồn.
    - *Khắc phục*: Dùng `Promise.all` kết hợp `p-limit` để chạy song song 5-10 chunk cùng lúc. Tăng tốc độ sync gấp nhiều lần mà không làm sập DB.
- **Race Condition (Tiềm ẩn)**: Cronjob sync Karma chạy mỗi 10s. Nếu Server A và Server B cùng chạy job này (khi scale horizontally), chúng sẽ tranh nhau xử lý `active_knockers` -> Cộng đôi công đức (Double Spending).
    - *Khắc phục*: Dùng Redis Lock (Redlock) để đảm bảo chỉ 1 Job chạy tại 1 thời điểm.
- **Mất Mát Dữ Liệu (Data Loss)**: Trong `KarmaSyncService`, nếu Node.js process bị `SIGKILL` (OOM hoặc Force Kill) ngay lúc vừa `GETSET` xong nhưng chưa kịp `update` DB -> Mất toàn bộ điểm buffers của đợt đó.
    - *Khắc phục*: Dùng `RPOPLPUSH` (Reliable Queue) hoặc Stream thay vì Set đơn giản để đảm bảo "At-least-once delivery".

### 📉 Performance (Medium)
- **Decimal Precision**: `totalDonated` dùng `Decimal` nhưng khi cộng dồn trong code JS đôi khi bị cast qua number (mất độ chính xác).
    - *Khắc phục*: Dùng thư viện `decimal.js` hoặc xử lý phép cộng hoàn toàn dưới Database.

---

## 4. 🗄️ DATABASE & INFRA (Nền Móng)

### 🐢 Database
- **Connection Pool**: Chưa config `connection_limit`. Nếu traffic đột biến, Prisma sẽ mở quá nhiều connection làm sập Postgres.
    - *Khắc phục*: Config PgBouncer làm Proxy để quản lý pool.
- **No Indexing Audit**: Bảng `KarmaLog` sẽ phình to rất nhanh (mỗi lần sync là tạo log?). Hiện tại chưa có Partitioning cho bảng này.
    - *Khắc phục*: Partitioning bảng theo tháng (`karma_logs_2026_02`).

### 🌲 Logging & Monitoring
- **Console.log**: Code vẫn còn dùng `console.log` hoặc `Logger` mặc định. Không thể search log tập trung.
    - *Khắc phục*: Tích hợp Winston/Pino đẩy log về ELK Stack hoặc Loki.
- **Không có Alert**: Server sập hay Redis đầy bộ nhớ cũng không ai biết trừ khi Trụ Trì vào check.
    - *Khắc phục*: Setup Prometheus + Grafana alert qua Telegram/Slack.

---

## 📝 KẾT LUẬN

Hệ thống hiện tại đang ở mức **MVP (Minimum Viable Product)** - Chạy được, vui, nhưng chưa sẵn sàng cho "Đại Lễ Phật Đản" với hàng triệu tín đồ.

**Mức độ ưu tiên fix:**
1. **Redis Lock cho Job Sync** (Để scale server).
2. **Refresh Token** (Để bảo mật & UX).
3. **Partitioning Karma Logs** (Để DB không hấp hối sau 1 tháng).

*Nam Mô A Di Đà Phật! Code là bể khổ, quay đầu là bờ (nhưng fix bug xong mới được quay).* 🙏
