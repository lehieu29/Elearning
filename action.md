# Action Log - Cập nhật chức năng tạo khóa học với upload video

## 1. Phân tích hiện trạng
- **Frontend:**
  - Đã xác định các file liên quan đến giao diện tạo khóa học, bao gồm `CourseInformation.tsx`.
  - Hiện trạng: Người dùng nhập thủ công URL (DemoURL, VideoURL).

## 2. Tiến độ thực hiện

### A. Frontend
1. **Thiết kế giao diện upload video:**
   - Đã thay thế input text của trường `DemoURL` bằng input upload video trong file `CourseInformation.tsx`.
   - Người dùng có thể chọn file video từ máy tính, và thông tin file sẽ được lưu vào state `courseInfo`.

2. **Tích hợp API gọi đến backend:**
   - Đang chuẩn bị tích hợp API để gửi file video đến backend.

### B. Backend
1. **Tạo endpoint upload video:**
   - Đã thêm endpoint `/upload-video` trong file `Backend/routes/course.route.ts`.
   - Endpoint này được bảo vệ bằng middleware `isAuthenticated` và `authorizeRoles`.

2. **Xử lý file upload:**
   - Đã thêm hàm `uploadVideoHandler` trong file `Backend/controller/course.controller.ts` để xử lý upload video lên Cloudinary.
   - Hàm này trả về thông tin video bao gồm `videoUrl`, `publicId`, `duration`, và `format`.
   
### C. Kiểm thử và xác nhận
- **Frontend:**  
  Đã kiểm tra giao diện upload video hoạt động đúng cách.
- **Backend:**  
  Đã kiểm tra endpoint `/upload-video` hoạt động và trả về thông tin video từ Cloudinary.
- **DB:**  
  Chưa kiểm tra.

## 3. Ghi chú
- Tiếp tục triển khai backend để lưu thông tin video vào database.
- Cập nhật tiến độ sau mỗi bước hoàn thành.
