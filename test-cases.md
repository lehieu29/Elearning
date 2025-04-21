# Kiểm Thử Tính Năng Upload Video và Hiển Thị Queue

## 1. Kiểm thử Socket.IO

### 1.1. Kiểm tra kết nối Socket.IO

**Công cụ sử dụng:** `test-socket.html` và `test-socket.js`

**Các bước thực hiện:**
1. Chạy server test với lệnh: `node test-socket.js`
2. Mở file `test-socket.html` trong trình duyệt
3. Nhập URL server: `http://localhost:8001`
4. Nhấn nút "Connect"

**Kết quả mong đợi:**
- Trạng thái hiển thị "Connected"
- Thông báo "Socket connected with ID: ..." trong log
- Server terminal hiển thị "Client connected: ..."

### 1.2. Kiểm tra sự kiện videoProgress

**Các bước thực hiện:**
1. Kết nối socket như bước 1.1
2. Nhập Process ID test vào trường nhập liệu
3. Nhấn lần lượt các nút "Gửi 10%", "Gửi 50%", "Gửi 100%" 

**Kết quả mong đợi:**
- Server nhận được và log ra sự kiện videoProgress
- Client nhận lại sự kiện từ server (kiểm tra trong console trình duyệt)

## 2. Kiểm thử Upload Video

### 2.1. Kiểm tra quá trình upload và xử lý tiến độ

**Công cụ sử dụng:** `test-upload.js` 

**Các bước thực hiện:**
1. Chạy server test upload với lệnh: `node test-upload.js` 
2. Truy cập vào `http://localhost:8002` từ trình duyệt
3. Chọn file video bất kỳ và nhấn nút "Upload"

**Kết quả mong đợi:**
- Server nhận file và trả về processId ngay lập tức
- Thanh tiến độ được cập nhật theo thời gian
- Sau khoảng 10-15 giây, upload hiển thị hoàn thành với thông tin video

### 2.2. Kiểm tra phát sóng tiến độ

**Các bước thực hiện:**
1. Mở 2 tab trình duyệt đến `http://localhost:8002`
2. Tab 1: Upload một video
3. Tab 2: Quan sát kết quả

**Kết quả mong đợi:**
- Tab 2 cũng hiển thị tiến độ upload của video từ Tab 1
- Cả hai tab đều được cập nhật tiến độ đồng thời

## 3. Kiểm thử Component Video Queue

### 3.1. Kiểm tra hiển thị Queue Component

**Công cụ sử dụng:** `test-queue.html`

**Các bước thực hiện:**
1. Mở file `test-queue.html` trong trình duyệt
2. Quan sát giao diện queue component

**Kết quả mong đợi:**
- Queue component hiển thị như thiết kế ban đầu
- Video demo mặc định được thêm vào queue

### 3.2. Kiểm tra các chức năng quản lý Queue

**Các bước thực hiện:**
1. Nhấn "Add Demo Video" để thêm video demo
2. Nhấn "Add Content Video" để thêm video content
3. Nhấn "Add Multiple Videos" để thêm nhiều video cùng lúc
4. Nhấn "Update Random Progress" để cập nhật tiến độ ngẫu nhiên
5. Nhấn "Complete Random Item" để hoàn thành một item
6. Nhấn "Fail Random Item" để tạo lỗi cho một item
7. Nhấn "Toggle Collapse" để ẩn/hiện nội dung queue
8. Nhấn "Clear Queue" để xóa queue

**Kết quả mong đợi:**
- Các video được thêm vào queue
- Tiến độ được cập nhật chính xác
- Giao diện thể hiện đúng trạng thái (đang xử lý, thành công, lỗi)
- Queue có thể ẩn/hiện và xóa toàn bộ

## 4. Kiểm thử tích hợp với application thực tế

### 4.1. Kiểm tra tính năng Upload trong CourseInformation

**Các bước thực hiện:**
1. Đảm bảo backend server đang chạy
2. Đảm bảo môi trường đã cấu hình đúng URL socket
3. Đăng nhập vào ứng dụng với tài khoản admin
4. Tạo một khóa học mới
5. Upload video demo
6. Kiểm tra queue hiển thị và tiến độ được cập nhật
7. Đợi video upload hoàn tất
8. Tiếp tục điền các thông tin khác và chuyển sang tab tiếp theo

**Kết quả mong đợi:**
- Queue hiển thị đúng với video đang upload
- Tiến độ được cập nhật theo thời gian thực
- Có thể chuyển sang tab tiếp theo mà không bị chặn bởi validate
- Sau khi upload hoàn tất, demoUrl được cập nhật tự động

### 4.2. Kiểm tra tính năng Upload trong CourseContent

**Các bước thực hiện:**
1. Tiếp tục từ khóa học đã tạo ở phần 4.1
2. Trong tab CourseContent, thêm một section mới
3. Upload video cho section này
4. Upload thêm video cho các section khác
5. Kiểm tra queue hiển thị và tiến độ được cập nhật
6. Đợi video upload hoàn tất
7. Tiếp tục chuyển sang tab tiếp theo

**Kết quả mong đợi:**
- Queue hiển thị đúng với tất cả video đang upload
- Tiến độ được cập nhật theo thời gian thực
- Không bị trùng lặp giữa các video
- Mỗi video được gán vào đúng section tương ứng

### 4.3. Kiểm tra xử lý lỗi

**Các bước thực hiện:**
1. Cố tình upload file không phải video
2. Cố tình upload file quá lớn
3. Tắt server backend trong quá trình upload
4. Tắt một tab trình duyệt đang upload

**Kết quả mong đợi:**
- Thông báo lỗi đúng định dạng file
- Thông báo lỗi kích thước file
- Queue hiển thị lỗi khi mất kết nối
- Tab còn lại vẫn hiển thị queue đúng trạng thái

## 5. Kiểm thử hiệu năng

### 5.1. Kiểm tra upload nhiều video cùng lúc

**Các bước thực hiện:**
1. Upload cùng lúc 5 video trong các section khác nhau
2. Quan sát queue và tiến độ

**Kết quả mong đợi:**
- Queue hiển thị tất cả 5 video
- Tiến độ của từng video được cập nhật độc lập
- Không có video nào bị trùng lặp thông tin
- Sau khi hoàn tất, mỗi video được gán vào đúng section tương ứng

### 5.2. Kiểm tra tốc độ phản hồi UI

**Các bước thực hiện:**
1. Trong khi có video đang upload, thao tác điền thông tin khác
2. Thử chuyển qua lại giữa các tab
3. Thử collapse/expand queue

**Kết quả mong đợi:**
- UI vẫn phản hồi mượt mà, không bị lag
- Việc chuyển tab không bị chậm
- Queue collapse/expand mượt mà

## 6. Kiểm thử bảo mật

### 6.1. Kiểm tra xác thực

**Các bước thực hiện:**
1. Đăng xuất khỏi tài khoản
2. Thử truy cập trực tiếp vào URL upload API

**Kết quả mong đợi:**
- API từ chối request khi không có xác thực
- Trả về lỗi 401 unauthorized

### 6.2. Kiểm tra phân quyền

**Các bước thực hiện:**
1. Đăng nhập với tài khoản không phải admin
2. Thử truy cập vào trang quản lý khóa học

**Kết quả mong đợi:**
- Không thể truy cập trang quản lý khóa học
- Chuyển hướng đến trang không có quyền truy cập
