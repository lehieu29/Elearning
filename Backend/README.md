# Elearning Website Backend

## Tóm tắt về dự án
Elearning Website Backend là một hệ thống backend được xây dựng bằng TypeScript và Express.js. Dự án cung cấp các chức năng chính như quản lý người dùng, khóa học, đơn hàng, thông báo, và phân tích dữ liệu. Ngoài ra, hệ thống hỗ trợ giao tiếp thời gian thực qua WebSocket và tích hợp với các dịch vụ bên ngoài như Cloudinary, Redis, và Stripe.

## Hướng dẫn cài đặt
1. **Clone dự án**:
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Cài đặt các thư viện/phụ thuộc**:
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**:
   - Tạo file `.env` dựa trên file mẫu `.env.sample`.
   - Điền các giá trị cần thiết như `SMTP_MAIL`, `SMTP_PASSWORD`, `VDOCIPHER_API_SECRET`, `STRIPE_SECRET_KEY`, và `STRIPE_PUBLISHABLE_KEY`.

4. **Build dự án**:
   ```bash
   npm run build
   ```

## Cách sử dụng
1. **Chạy server ở chế độ phát triển**:
   ```bash
   npm run dev
   ```

2. **Chạy server ở chế độ production**:
   ```bash
   npm start
   ```

3. **Các endpoint chính**:
   - **User Management**: `/api/users`
   - **Course Management**: `/api/courses`
   - **Order Processing**: `/api/orders`
   - **Notifications**: `/api/notifications`
   - **Analytics**: `/api/analytics`

## Giải thích luồng hoạt động
1. Người dùng gửi yêu cầu HTTP đến server qua các endpoint.
2. Server xử lý yêu cầu thông qua các controller tương ứng.
3. Các controller gọi đến các service để thực hiện logic nghiệp vụ.
4. Dữ liệu được lưu trữ hoặc truy xuất từ MongoDB thông qua Mongoose.
5. Kết quả được trả về cho người dùng dưới dạng JSON.
6. Các thông báo thời gian thực được gửi qua WebSocket nếu cần.

## Cấu trúc thư mục
- **`server.ts`**: Điểm khởi đầu của ứng dụng.
- **`app.ts`**: Cấu hình ứng dụng Express.js.
- **`controller/`**: Chứa các controller xử lý logic cho từng module.
- **`routes/`**: Định nghĩa các route của ứng dụng.
- **`services/`**: Chứa logic nghiệp vụ.
- **`middleware/`**: Các middleware tùy chỉnh.
- **`models/`**: Định nghĩa các schema Mongoose.
- **`utils/`**: Các hàm tiện ích và cấu hình.
- **`mails/`**: Các template email sử dụng EJS.

## Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x
- **MongoDB**: Để lưu trữ dữ liệu.
- **Redis**: Để caching hoặc các tác vụ khác.
- **Cloudinary**: Để lưu trữ media.
- **Stripe**: Để xử lý thanh toán.

## Thông tin bổ sung
- **Tài liệu liên quan**:
  - [Cloudinary Documentation](https://cloudinary.com/documentation)
  - [Stripe API Documentation](https://stripe.com/docs/api)
- **Người đóng góp**: Đội ngũ phát triển Elearning.
- **Lưu ý khi deploy**:
  - Đảm bảo các biến môi trường được cấu hình chính xác.
  - Sử dụng HTTPS để bảo mật giao tiếp.
