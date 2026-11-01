# Hướng Dẫn Cài Đặt & Sử Dụng Chrome Extension

Tiện ích **Facebook Story Insights Collector** cho phép bạn trích xuất danh sách người xem, link Facebook cá nhân và lượt thả tym từ Story của chính bạn đang mở trên trình duyệt (cả Story đang chạy < 24h lẫn Story cũ trong Kho Lưu Trữ > 24h), sau đó tự động lưu vào database SQLite cục bộ của máy chủ Next.js.

---

### Bước 1: Cài đặt hoặc Cập nhật Extension vào trình duyệt Chrome (Chỉ mất 10 giây)

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
7. *(Nếu bạn vừa cập nhật code, chỉ cần nhấn vào biểu tượng vòng xoay 🔄 Cập nhật/Reload trên thẻ Extension là xong).*

---

### Bước 2: Quét Story đang chạy (< 24 giờ)

1. Đảm bảo máy chủ Next.js đang chạy:
   ```bash
   npm run dev
   ```
2. Mở Facebook trên Chrome và mở **Story của chính bạn**.
3. **Quan trọng:** Nhấn vào mục **"Người xem"** (ở góc dưới bên trái khung Story) để Facebook bung danh sách người xem lên màn hình (y hệt hình ảnh chụp giao diện Story).
4. Nhấn vào biểu tượng Extension **Story Insights Collector** trên thanh công cụ:
   - **⚡ Quét Nhanh**: Quét ngay những người xem đang hiển thị trên màn hình.
   - **📜 Cuộn & Quét Hết**: Tự động cuộn danh sách người xem xuống đáy để kích hoạt tải toàn bộ danh sách khi có nhiều người xem (có thanh cuộn).
5. Bấm nút **"💾 Lưu Vào Server SQLite (localhost:3000)"**:
   - Dữ liệu được đẩy về SQLite và lưu vĩnh viễn trên máy của bạn.
   - Bảng điều khiển tại **http://localhost:3000** sẽ tự động cập nhật sau 4 giây.

---

### Bước 3: Trường hợp quét Story bên ngoài 24 giờ (Kho Lưu Trữ Tin / Story Archive)

> [!NOTE]
> **Story sau 24 giờ biến mất đi đâu?**
> Facebook không hề xóa Story hay danh sách người xem của bạn! Facebook tự động chuyển toàn bộ tin sau 24h vào mục **Kho Lưu Trữ Tin (Story Archive)**.

1. **Cách truy cập Kho Lưu Trữ Tin:**
   - Cách 1: Bấm trực tiếp nút **📂 Mở Kho Lưu Trữ Tin Cũ (>24h)** ngay trong giao diện Extension (hoặc truy cập `https://www.facebook.com/archive/stories/`).
   - Cách 2: Vào **Trang cá nhân Facebook** &rarr; Bấm nút **`...` (Khác)** cạnh "Chỉnh sửa trang cá nhân" &rarr; Chọn **Kho lưu trữ** &rarr; Chọn **Kho lưu trữ tin**.
2. **Cách quét:**
   - Nhấp vào bất kỳ Story cũ nào trong quá khứ (kể cả tuần trước, tháng trước).
   - Nhấn vào mục **"Người xem"** ở góc dưới. Facebook sẽ bung danh sách người xem y hệt Story hiện tại!
   - Bấm mở Extension &rarr; Bấm **Quét** &rarr; Bấm **Lưu Vào SQLite**.
   - Dữ liệu Story cũ sẽ được dán nhãn `📂 Kho lưu trữ (>24h)` trong bảng điều khiển và bảo tồn mãi mãi.
