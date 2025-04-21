# Tiêu Chuẩn Chất Lượng Mã Nguồn

Tài liệu này mô tả các tiêu chuẩn, quy ước và thực hành tốt nhất cho việc duy trì chất lượng mã nguồn trong dự án E-Learning.

## 1. Tiêu Chuẩn Mã Nguồn

### 1.1. TypeScript

- Luôn sử dụng kiểu dữ liệu rõ ràng cho biến, tham số hàm và giá trị trả về
- Tránh sử dụng `any` nếu có thể
- Sử dụng interfaces cho các đối tượng phức tạp
- Áp dụng nguyên tắc readonly khi thích hợp

```typescript
// Good
interface IUser {
  readonly id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Bad
const user: any = { name: 'John', email: 'john@example.com' };
```

### 1.2. React Components

- Sử dụng functional components và hooks
- Props được định nghĩa qua TypeScript interfaces
- Tránh re-renders không cần thiết bằng cách sử dụng các hooks như `useMemo` và `useCallback`
- Sử dụng React.memo() cho components có nhiều re-renders

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`} 
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default React.memo(Button);
```

### 1.3. Express Controllers

- Sử dụng async/await với middleware catchAsyncErrors
- Trả về cấu trúc response nhất quán
- Xử lý lỗi đúng cách với ErrorHandler

```typescript
// Good
export const getAllCourses = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );
      
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

## 2. Linting và Formatting

### 2.1. ESLint

Sử dụng ESLint với các quy tắc sau:

- `@typescript-eslint/recommended`
- `react/recommended`
- `react-hooks/rules-of-hooks`
- `react-hooks/exhaustive-deps`

Một số quy tắc quan trọng:
- no-unused-vars
- no-console (chỉ trong production)
- prefer-const
- eqeqeq (=== thay vì ==)

### 2.2. Prettier

Cấu hình cơ bản:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true
}
```

### 2.3. Git Hooks

- **pre-commit**: Chạy linting và formatting
- **pre-push**: Chạy tests

## 3. Best Practices

### 3.1. Tổ Chức Mã Nguồn

#### Frontend

- Phân chia components theo chức năng và tái sử dụng
- Tách biệt logic nghiệp vụ và UI
- Sử dụng custom hooks để tách logic
- Áp dụng atomic design khi có thể

```
components/
  ├── atoms/         # Các components nhỏ nhất (buttons, inputs, etc.)
  ├── molecules/     # Tổ hợp từ atoms (form fields, cards, etc.)
  ├── organisms/     # Tổ hợp lớn hơn (headers, forms, etc.)
  ├── templates/     # Layouts
  └── pages/         # Các trang hoàn chỉnh
```

#### Backend

- Controller chỉ xử lý request/response
- Business logic phức tạp nên đặt trong services
- Tái sử dụng code thông qua utility functions
- Sử dụng middleware để giảm code lặp lại

### 3.2. State Management

- Sử dụng Redux cho global state
- Sử dụng local state (useState) cho UI state đơn giản
- Sử dụng redux-persist cho state cần lưu trữ
- Tránh lạm dụng global state cho dữ liệu cục bộ

### 3.3. Performance

- Lazy loading cho components và routes
- Memoization cho các tính toán tốn kém
- Tối ưu hóa re-renders với React.memo, useMemo và useCallback
- Sử dụng React Profiler để phát hiện bottlenecks

### 3.4. Security

- Validate input trên cả frontend và backend
- Sanitize dữ liệu trước khi render để ngăn XSS
- Sử dụng Content Security Policy (CSP)
- Không lưu thông tin nhạy cảm trong localStorage/sessionStorage

## 4. Code Reviews

### 4.1. Quy Trình

1. Tạo branch từ `develop` cho mỗi feature/bug
2. Tạo Pull Request khi hoàn thành
3. CI/CD chạy linting, tests và build check
4. Ít nhất một developer review code
5. Merge sau khi được phê duyệt và CI/CD pass

### 4.2. Checklist Review

- Code có tuân thủ style guide?
- Có tests phù hợp?
- Logic nghiệp vụ có đúng?
- Có lỗi tiềm ẩn hoặc edge cases?
- Performance có được tối ưu?
- UX/Accessibility có được cân nhắc?

### 4.3. Commit Messages

Theo cấu trúc Conventional Commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Ví dụ:
- `feat(auth): add social login with Google`
- `fix(payment): handle Stripe webhook errors`
- `chore(deps): update dependencies`

## 5. Documentation

### 5.1. Inline Comments

- Giải thích "tại sao" hơn là "cái gì"
- Ghi chú các edge cases hoặc quyết định thiết kế
- Sử dụng JSDoc cho functions và interfaces quan trọng

```typescript
/**
 * Xử lý thanh toán khóa học qua Stripe
 * @param {string} courseId - ID của khóa học
 * @param {string} userId - ID của người dùng
 * @param {object} paymentIntent - Stripe payment intent object
 * @returns {Promise<IOrder>} Order object
 * @throws {ErrorHandler} Khi thanh toán thất bại
 */
async function processPayment(courseId, userId, paymentIntent) {
  // Implementation
}
```

### 5.2. README

Mỗi thư mục quan trọng nên có README mô tả:
- Mục đích
- Cấu trúc
- Cách sử dụng
- Các quyết định thiết kế quan trọng

## 6. Refactoring

### 6.1. Khi nào refactor

- Khi có code trùng lặp (DRY)
- Khi function/component quá lớn
- Khi có "code smells" (quá nhiều parameters, global state, etc.)
- Khi cần cải thiện performance

### 6.2. Quy trình refactoring

1. Đảm bảo có tests cover code cần refactor
2. Refactor từng phần nhỏ
3. Chạy tests sau mỗi thay đổi
4. Review lại với team

## 7. Error Handling

### 7.1. Frontend

- Sử dụng try/catch cho các operations bất đồng bộ
- Hiển thị thông báo lỗi thân thiện với người dùng
- Log lỗi chi tiết (không bao gồm thông tin nhạy cảm) cho debugging

```typescript
try {
  await api.post('/login', credentials);
  // Handle success
} catch (error) {
  // User-friendly message
  toast.error('Unable to login. Please check your credentials.');
  
  // Detailed logging
  console.error('Login error:', error);
}
```

### 7.2. Backend

- Sử dụng custom ErrorHandler
- Phân loại lỗi (400, 401, 404, 500, etc.)
- Trả về cấu trúc lỗi nhất quán

```typescript
{
  success: false,
  message: "Thông báo lỗi cho người dùng",
  error: "Chi tiết lỗi cho developer" // Chỉ trong development
}
```

## 8. Metrics và Monitoring

### 8.1. Code Quality Metrics

- Sử dụng SonarQube hoặc công cụ tương tự
- Theo dõi metrics:
  - Complexity
  - Duplication
  - Coverage
  - Issues
  - Technical debt

### 8.2. Performance Monitoring

- Lighthouse score
- Core Web Vitals
- Bundle size
- API response time
- Database query time

## 9. Continuous Improvement

- Code reviews thường xuyên
- Refactoring định kỳ
- Knowledge sharing sessions
- Cập nhật style guide khi cần
- Cập nhật dependencies một cách an toàn
