# Frontend Documentation

## 1. Tóm tắt về dự án
Dự án này là một nền tảng học trực tuyến được xây dựng bằng Next.js. Mục đích chính là cung cấp một giao diện người dùng thân thiện để quản lý khóa học, người dùng, và các tính năng liên quan đến học tập trực tuyến.

## 2. Hướng dẫn cài đặt
### Clone dự án
```bash
git clone [repository-url]
cd Frontend
```

### Cài đặt thư viện/phụ thuộc
```bash
npm install
# hoặc
yarn install
```

### Cấu hình môi trường
Tạo file `.env.local` dựa trên file mẫu `.env.sample` và điền các thông tin cần thiết.

## 3. Cách sử dụng
### Chạy dự án
Khởi động server phát triển:
```bash
npm run dev
# hoặc
yarn dev
```

Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000).

### Các endpoint chính
- Trang chủ: `/`
- Trang khóa học: `/courses`
- Trang quản trị: `/admin`

## 4. Giải thích luồng hoạt động
1. Người dùng truy cập trang web và đăng nhập.
2. Hệ thống xác thực thông tin người dùng qua API.
3. Sau khi đăng nhập thành công, người dùng có thể truy cập các tính năng như xem khóa học, quản lý tài khoản, hoặc sử dụng các công cụ học tập.
4. Dữ liệu được lấy từ backend và hiển thị trên giao diện frontend.

## 5. Cấu trúc thư mục
- `app/`: Chứa các trang và layout chính.
- `components/`: Các thành phần giao diện tái sử dụng.
- `redux/`: Quản lý trạng thái ứng dụng.
- `public/`: Chứa các tài nguyên tĩnh như hình ảnh.
- `utils/`: Các tiện ích và hàm hỗ trợ.

## 6. Yêu cầu hệ thống
- Node.js >= 14.x
- npm hoặc yarn
- Trình duyệt hiện đại (Chrome, Firefox, Edge)

## 7. Thông tin bổ sung
- [Tài liệu Next.js](https://nextjs.org/docs)
- Người đóng góp: Nhóm phát triển dự án Elearning
- Lưu ý khi deploy: Sử dụng [Vercel](https://vercel.com/) để triển khai nhanh chóng và dễ dàng.
