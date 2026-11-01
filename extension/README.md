# Hướng Dẫn Cài Đặt & Sử Dụng Chrome Extension

Tiện ích **Facebook Story Insights Collector** cho phép bạn trích xuất danh sách người xem, link Facebook cá nhân và lượt thả tym từ Story của chính bạn đang mở trên trình duyệt, sau đó tự động lưu vào database SQLite cục bộ của máy chủ Next.js.

---

### Bước 1: Cài đặt Extension vào trình duyệt Chrome (Chỉ mất 10 giây)

1. Mở trình duyệt Google Chrome (hoặc Edge / Cốc Cốc / Brave).
2. Nhập vào thanh địa chỉ:
   ```text
   chrome://extensions
   ```
3. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải.
4. Nhấn vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục `extension` nằm trong dự án của bạn:
   ```text
   D:\work-spaces\facebook-insights-hub\extension
   ```
6. Tiện ích **Facebook Story Insights Collector** sẽ xuất hiện trên thanh công cụ của trình duyệt. Bạn có thể nhấn vào biểu tượng chiếc ghim 📌 để ghim ra ngoài.

---

### Bước 2: Cách sử dụng để cào Story của chính bạn

1. Đảm bảo server Next.js đang chạy:
   ```bash
   npm run dev
   ```
2. Mở Facebook trên Chrome và truy cập vào **Story của chính bạn** (nơi bạn có quyền xem danh sách người xem).
3. **Quan trọng:** Nhấn vào mục **"Người xem"** (thường nằm ở góc dưới bên trái của khung phát Story) để Facebook bung danh sách người xem lên màn hình.
4. Nhấn vào biểu tượng Extension **Story Insights Collector** trên thanh công cụ.
5. Bấm nút **"🔍 Quét Dữ Liệu Story Đang Mở"**:
   - Extension sẽ tự động duyệt qua cấu trúc DOM, lấy tên người xem, link profile Facebook cá nhân và các cảm xúc thả tym / like / haha.
   - Kết quả sẽ được hiển thị ngay trong popup xem trước.
6. Bấm nút **"💾 Lưu Vào Server SQLite (localhost:3000)"**:
   - Dữ liệu sẽ được gửi trực tiếp tới endpoint `http://localhost:3000/api/stories`.
   - SQLite sẽ tự động lưu lại vào bảng `stories` và `interactions`.
7. Mở Dashboard **[http://localhost:3000](http://localhost:3000)** để xem thống kê, biểu đồ và xuất file CSV!
