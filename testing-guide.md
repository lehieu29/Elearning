# Hướng dẫn chạy kiểm thử tính năng upload video và queue

## Chuẩn bị môi trường

### Cài đặt dependencies cần thiết

Trước khi chạy các bài kiểm thử, hãy cài đặt các dependencies cần thiết cho các file test:

```bash
# Di chuyển đến thư mục Backend
cd D:/Project/Elearning/Backend

# Cài đặt dependencies cần thiết cho test
npm install --save-dev socket.io express multer cors
```

### Đảm bảo biến môi trường

Đảm bảo file `.env` trong Frontend và Backend có các biến môi trường cần thiết:

**Backend/.env**
```
...
# Các biến môi trường hiện tại

# Thêm nếu chưa có
SOCKET_ENABLE=true
```

**Frontend/.env.local**
```
...
# Các biến môi trường hiện tại

# Cập nhật URL Socket server
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 1. Kiểm thử Socket.IO

### Bài kiểm thử 1: Kết nối Socket.IO và nhận sự kiện

1. Mở Terminal và chạy server test socket:
```bash
cd D:/Project/Elearning/Backend
node test-socket.js
```

2. Mở file `D:/Project/Elearning/Frontend/test-socket.html` trong trình duyệt
3. Nhập URL: `http://localhost:8001` trong trường Server URL
4. Nhấn nút "Connect"
5. Sau khi kết nối thành công, thử gửi các sự kiện cập nhật tiến độ 10%, 50%, 100%

## 2. Kiểm thử Upload và Xử lý Video

### Bài kiểm thử 2: Quá trình upload và cập nhật tiến độ

1. Mở Terminal và chạy server test upload:
```bash
cd D:/Project/Elearning/Backend
node test-upload.js
```

2. Mở trình duyệt và truy cập: `http://localhost:8002`
3. Chọn một file video bất kỳ và nhấn "Upload"
4. Quan sát tiến độ upload và xử lý
5. Trong một tab khác, mở cùng URL `http://localhost:8002` để kiểm tra việc đồng bộ hóa tiến độ giữa các tab

## 3. Kiểm thử Component Queue

### Bài kiểm thử 3: Tương tác với Queue Component

1. Mở file `D:/Project/Elearning/Frontend/test-queue.html` trong trình duyệt
2. Sử dụng các nút điều khiển bên trái để tương tác với queue:
   - Thêm video demo, content hoặc nhiều video
   - Cập nhật tiến độ ngẫu nhiên
   - Hoàn thành hoặc tạo lỗi cho các video
   - Ẩn/hiện nội dung queue
   - Xóa toàn bộ queue

3. Quan sát hành vi của queue component bên phải

## 4. Kiểm thử tích hợp trong ứng dụng thực tế

### Bài kiểm thử 4: Tích hợp trong CourseInformation và CourseContent

1. Đảm bảo server Backend đang chạy:
```bash
cd D:/Project/Elearning/Backend
npm run dev
```

2. Đảm bảo client Frontend đang chạy:
```bash
cd D:/Project/Elearning/Frontend
npm run dev
```

3. Thực hiện kiểm thử theo các bước sau:

#### Kiểm tra CourseInformation
- Đăng nhập vào ứng dụng với tài khoản admin
- Điều hướng đến trang tạo khóa học mới
- Điền thông tin cơ bản về khóa học
- Upload video demo
- Kiểm tra queue hiển thị và tiến độ cập nhật
- Kiểm tra khả năng chuyển tab mà không cần đợi upload hoàn tất
- Xác nhận sau khi upload hoàn tất, URL được cập nhật tự động

#### Kiểm tra CourseContent
- Tiếp tục từ khóa học vừa tạo, chuyển sang tab CourseContent
- Thêm các sections và upload video cho từng section
- Kiểm tra queue hiển thị và tiến độ cập nhật
- Kiểm tra khả năng thêm nhiều video cùng lúc
- Xác nhận không có video nào bị gán sai section
- Kiểm tra có thể tiếp tục quy trình mà không cần đợi upload hoàn tất

## 5. Gỡ lỗi phổ biến

### Vấn đề kết nối Socket.IO

Nếu Socket.IO không kết nối được:

1. Kiểm tra URL server có đúng không
2. Đảm bảo không có lỗi CORS:
   - Kiểm tra cài đặt CORS trong `socketServer.ts`
   - Đảm bảo đã thêm đúng origin
3. Kiểm tra console trình duyệt để xem lỗi chi tiết

### Vấn đề upload video

Nếu upload video không hoạt động:

1. Kiểm tra kích thước file (không quá lớn)
2. Kiểm tra định dạng file (phải là video)
3. Đảm bảo thư mục tạm để lưu file tồn tại và có quyền ghi
4. Kiểm tra console server để xem lỗi chi tiết

### Vấn đề không gán URL đúng

Nếu URL video không được gán đúng sau khi upload:

1. Kiểm tra logic trong `setVideoUrlFromQueue`
2. So sánh `processId` và `contentIndex` để đảm bảo trùng khớp
3. Kiểm tra console để xem kết quả từ Socket.IO

## 6. Các lưu ý quan trọng

1. **Xử lý đồng thời**:
   - Hạn chế số lượng video upload cùng lúc để tránh quá tải server
   - Đảm bảo không upload cùng một file nhiều lần

2. **Sử dụng đúng port**:
   - Test socket: Port 8001
   - Test upload: Port 8002 
   - Ứng dụng thực tế: Port mặc định của server

3. **Cleanup**:
   - Sau khi kiểm thử, dọn dẹp các file tạm trong thư mục uploads
   - Xóa các khóa học test không cần thiết

4. **Queue trong Production**:
   - Trong môi trường production, nên giới hạn số lượng video trong queue
   - Cân nhắc thêm tính năng tạm dừng/hủy upload cho người dùng
