# Facebook Insights Hub 🚀

Hệ thống Fullstack tiếp nhận, thu thập và phân tích dữ liệu **Facebook Stories** (Lượt xem, Thả cảm xúc/Tym, Danh sách người xem và Link Profile cá nhân) được xây dựng trên **Next.js App Router** kết hợp cơ sở dữ liệu **SQLite Native (Zero-config)**.

---

## 🌟 Tính Năng Nổi Bật

- **Quản lý Story & Người xem:** Theo dõi các Story đang hoạt động, số lượt xem (views), tỷ lệ tương tác và chi tiết người xem.
- **Trình Quét & Thu Thập Dữ Liệu (Scanner Engine):** Cài đặt người cần quét (Ví dụ: `Trần Văn An`), chọn quyền riêng tư (`Công khai (Public)` / `Bạn bè (Friends)`), nhận diện Token định danh Story và ghi trực tiếp vào SQLite.
- **Trích xuất Profile Người Xem:** Thu thập tên, avatar, hành động (Thả tym ❤️, Thích 👍, Haha 😆, Xem story 👁️) và đường dẫn Facebook cá nhân của từng người xem.
- **SQLite Database Native:** Tích hợp trực tiếp module `node:sqlite` của Node.js, không cần cài đặt thêm MySQL/Docker hay cấu hình phức tạp.
- **Giao diện Hiện đại:** Dark mode cao cấp, Glassmorphism và thanh cuộn nổi **Overlay Scroll** siêu mượt mà.
- **Xuất Dữ Liệu:** Hỗ trợ xuất dữ liệu ra file **CSV/Excel** hoặc định dạng **JSON** qua 1 cú click.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend & Backend Framework:** [Next.js](https://nextjs.org) (App Router, Turbopack, React 19)
- **Database:** SQLite (`node:sqlite`)
- **Icons:** `lucide-react`
- **Styling:** Custom CSS với hệ thống Design Tokens và Overlay Scroll

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Cài đặt các gói phụ thuộc:
```bash
npm install
```

### 2. Khởi chạy Development Server:
```bash
npm run dev
```

Truy cập trình duyệt tại: **[http://localhost:3000](http://localhost:3000)**

### 3. Build sản phẩm (Production):
```bash
npm run build
npm run start
```

---

## 📡 API Endpoints

- `GET /api/stories`: Lấy danh sách toàn bộ Stories và số liệu thống kê.
- `GET /api/stories/[id]`: Lấy chi tiết Story và danh sách người xem, thả tym.
- `POST /api/scan`: Tiếp nhận yêu cầu quét Story theo Target Name và Privacy.
- `GET /api/export?format=csv`: Tải danh sách người xem về máy dưới dạng file CSV/Excel.
- `POST /api/db/seed`: Reset và nạp lại dữ liệu mẫu vào SQLite.

---

## 📄 License
MIT License.
