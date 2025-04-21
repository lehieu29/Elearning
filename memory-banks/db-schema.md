# Database Schema - MongoDB

Dự án E-Learning sử dụng MongoDB làm cơ sở dữ liệu chính với mongoose làm ODM (Object Document Mapper). Dưới đây là chi tiết về các collection chính và cấu trúc dữ liệu của chúng.

## 1. User Model

Schema quản lý thông tin người dùng, phân quyền và xác thực.

```typescript
interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}
```

### Các trường chính:
- **name**: Tên người dùng (required)
- **email**: Email (required, unique, validated)
- **password**: Mật khẩu được hash (select: false)
- **avatar**: Ảnh đại diện lưu trên Cloudinary
  - **public_id**: ID của ảnh trên Cloudinary
  - **url**: URL của ảnh
- **role**: Vai trò người dùng (mặc định: "user")
- **isVerified**: Trạng thái xác thực (mặc định: false)
- **courses**: Danh sách ID của các khóa học đã mua
- **timestamps**: Tự động thêm createdAt và updatedAt

### Các phương thức:
- **comparePassword**: So sánh mật khẩu đầu vào với mật khẩu đã hash
- **SignAccessToken**: Tạo JWT access token (hết hạn sau 5 phút)
- **SignRefreshToken**: Tạo JWT refresh token (hết hạn sau 3 ngày)

### Hooks:
- **pre save**: Hash mật khẩu trước khi lưu vào database

## 2. Course Model

Schema quản lý thông tin khóa học, nội dung và đánh giá.

```typescript
interface ICourse extends Document {
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: object;
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased: number;
}
```

### Các trường chính:
- **name**: Tên khóa học (required)
- **description**: Mô tả khóa học (required)
- **categories**: Danh mục khóa học (required)
- **price**: Giá khóa học (required)
- **estimatedPrice**: Giá ước tính (optional)
- **thumbnail**: Ảnh thumbnail khóa học
  - **public_id**: ID của ảnh trên Cloudinary
  - **url**: URL của ảnh
- **tags**: Tags của khóa học (required)
- **level**: Cấp độ khóa học (required)
- **demoUrl**: URL video demo (required)
- **benefits**: Lợi ích của khóa học (array of objects)
- **prerequisites**: Điều kiện tiên quyết (array of objects)
- **reviews**: Đánh giá của người dùng (array of IReview objects)
- **courseData**: Dữ liệu bài học (array of ICourseData objects)
- **ratings**: Điểm đánh giá trung bình (mặc định: 0)
- **purchased**: Số lượng đã mua (mặc định: 0)
- **timestamps**: Tự động thêm createdAt và updatedAt

### Sub-schemas:

#### IReview (Đánh giá)
```typescript
interface IReview extends Document {
  user: IUser;
  rating?: number;
  comment: string;
  commentReplies?: IComment[];
}
```

#### IComment (Bình luận)
```typescript
interface IComment extends Document {
  user: IUser;
  question: string;
  questionReplies: IComment[];
}
```

#### ILink (Link tài liệu)
```typescript
interface ILink extends Document {
  title: string;
  url: string;
}
```

#### ICourseData (Dữ liệu bài học)
```typescript
interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IComment[];
}
```

## 3. Order Model

Schema quản lý thông tin đơn hàng và thanh toán.

```typescript
interface IOrder extends Document {
  courseId: string;
  userId: string;
  payment_info: object;
}
```

### Các trường chính:
- **courseId**: ID của khóa học (required)
- **userId**: ID của người dùng mua khóa học (required)
- **payment_info**: Thông tin thanh toán từ Stripe (object)
- **timestamps**: Tự động thêm createdAt và updatedAt

## 4. Notification Model

Schema quản lý thông báo hệ thống và người dùng.

```typescript
interface INotification extends Document {
  title: string;
  message: string;
  status: string;
  userId: string;
}
```

### Các trường chính:
- **title**: Tiêu đề thông báo (required)
- **message**: Nội dung thông báo (required)
- **status**: Trạng thái thông báo (required)
- **userId**: ID của người dùng nhận thông báo
- **timestamps**: Tự động thêm createdAt và updatedAt

## 5. Layout Model

Schema quản lý cấu hình giao diện hệ thống.

```typescript
interface ILayout extends Document {
  type: string;
  faq?: any[];
  categories?: any[];
  banner?: {
    image: {
      public_id: string;
      url: string;
    };
    title: string;
    subTitle: string;
  };
}
```

### Các trường chính:
- **type**: Loại layout (required)
- **faq**: Danh sách câu hỏi thường gặp
- **categories**: Danh sách danh mục
- **banner**: Thông tin banner
  - **image**: Ảnh banner (public_id, url)
  - **title**: Tiêu đề banner
  - **subTitle**: Tiêu đề phụ banner
- **timestamps**: Tự động thêm createdAt và updatedAt

## 6. Subtitle Model

Schema quản lý phụ đề cho video khóa học.

```typescript
interface ISubtitle extends Document {
  courseId: string;
  fileName: string;
  transcript: string;
}
```

### Các trường chính:
- **courseId**: ID của khóa học (required)
- **fileName**: Tên file video (required)
- **transcript**: Nội dung phụ đề/transcript (required)
- **timestamps**: Tự động thêm createdAt và updatedAt

## 7. AI Model

Schema quản lý cấu hình và dữ liệu liên quan đến AI.

```typescript
interface IAI extends Document {
  // Cấu trúc có thể thay đổi tùy theo implementation
}
```

## Quan hệ giữa các Model

1. **User - Course**:
   - Mối quan hệ nhiều-nhiều (Many-to-Many)
   - User có trường `courses` chứa mảng courseId
   - Course lưu thông tin người dùng đã đánh giá trong `reviews`

2. **User - Order**:
   - Mối quan hệ một-nhiều (One-to-Many)
   - Một User có thể có nhiều Order
   - Order tham chiếu đến User qua trường `userId`

3. **Course - Order**:
   - Mối quan hệ một-nhiều (One-to-Many)
   - Một Course có thể có nhiều Order
   - Order tham chiếu đến Course qua trường `courseId`

4. **User - Notification**:
   - Mối quan hệ một-nhiều (One-to-Many)
   - Một User có thể có nhiều Notification
   - Notification tham chiếu đến User qua trường `userId`

5. **Course - Subtitle**:
   - Mối quan hệ một-nhiều (One-to-Many)
   - Một Course có thể có nhiều Subtitle
   - Subtitle tham chiếu đến Course qua trường `courseId`