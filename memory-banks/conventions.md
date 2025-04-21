# Quy Ước và Chuẩn Mực Mã Nguồn

Dự án E-Learning áp dụng một tập hợp các quy ước và chuẩn mực nhất quán trong toàn bộ mã nguồn để đảm bảo tính đồng nhất, dễ đọc và dễ bảo trì. Dưới đây là tổng hợp các quy ước đang được áp dụng trong dự án.

## 1. Quy Ước Đặt Tên

### 1.1. Tổng Quan

| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| File và thư mục | kebab-case | `user-controller.ts`, `error-handler.ts` |
| Component | PascalCase | `CourseCard.tsx`, `UserProfile.tsx` |
| Class | PascalCase | `ErrorHandler`, `UserController` |
| Interface | PascalCase với prefix 'I' | `IUser`, `ICourse`, `IOrder` |
| Type | PascalCase | `UserType`, `CourseData` |
| Function | camelCase | `getUserById()`, `createCourse()` |
| Method | camelCase | `findUser()`, `comparePassword()` |
| Variable | camelCase | `userName`, `courseId`, `isActive` |
| Constant | UPPER_SNAKE_CASE hoặc camelCase | `MAX_USERS`, `apiUrl` |
| Enum | PascalCase | `UserRole`, `CourseLevel` |
| React Hook | camelCase với prefix 'use' | `useAuth()`, `useForm()` |
| Event Handler | camelCase với prefix 'handle' | `handleSubmit()`, `handleClick()` |
| Boolean | camelCase với prefix is/has/should | `isLoading`, `hasAccess`, `shouldUpdate` |

### 1.2. Quy Ước Đặt Tên Theo Ngữ Cảnh

#### Backend

```typescript
// Models
const userSchema = new mongoose.Schema<IUser>({...});
const userModel: Model<IUser> = mongoose.model("User", userSchema);

// Controllers
export const loginUser = catchAsyncErrors(async (req, res, next) => {...});
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {...});

// Routes
const userRouter = express.Router();
userRouter.post("/login", loginUser);

// Middleware
export const isAuthenticated = asyncHandler(async (req, res, next) => {...});
export const authorizeRoles = (...roles: string[]) => {...};
```

#### Frontend

```typescript
// Components
const CourseCard: React.FC<CourseCardProps> = ({ course }) => {...};
const UserProfile: React.FC = () => {...};

// Hooks
const useAuth = () => {...};
const useLocalStorage = <T>(key: string, initialValue: T) => {...};

// Event Handlers
const handleSubmit = (e: React.FormEvent) => {...};
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {...};

// Redux Actions
export const userLoggedIn = (state, action) => {...};
export const setCourses = (state, action) => {...};
```

## 2. Cấu Trúc Tệp

### 2.1. Cấu Trúc Tệp Backend

```
Backend/
├── controllers/        - Logic xử lý business
│   ├── user.controller.ts
│   ├── course.controller.ts
│   └── ...
├── models/             - MongoDB schemas
│   ├── user.model.ts
│   ├── course.model.ts
│   └── ...
├── routes/             - API routes
│   ├── user.route.ts
│   ├── course.route.ts
│   └── ...
├── middlewares/        - Middleware functions
│   ├── auth.ts
│   ├── error.ts
│   └── ...
├── utils/              - Utility functions
│   ├── errorHandler.ts
│   ├── sendMail.ts
│   └── ...
├── services/           - Business logic services
│   ├── email.service.ts
│   ├── payment.service.ts
│   └── ...
├── config/             - Configuration files
│   ├── database.ts
│   ├── cloudinary.ts
│   └── ...
└── app.ts              - Application entry point
```

### 2.2. Cấu Trúc Tệp Frontend

```
Frontend/
├── app/                - Next.js App Router
│   ├── components/     - React components
│   │   ├── Auth/       - Authentication components
│   │   ├── Course/     - Course components
│   │   └── ...
│   ├── hooks/          - Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useForm.ts
│   │   └── ...
│   ├── utils/          - Utility functions
│   │   ├── formatDate.ts
│   │   ├── validation.ts
│   │   └── ...
│   ├── styles/         - CSS and styling
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── ...
│   └── [routes]/       - App routes/pages
├── redux/              - Redux state management
│   ├── features/       - Redux slices by feature
│   │   ├── auth/
│   │   ├── courses/
│   │   └── ...
│   └── store.ts        - Redux store
├── public/             - Static assets
│   ├── images/
│   ├── icons/
│   └── ...
└── [config files]      - Configuration files
```

## 3. Phong Cách Mã Nguồn

### 3.1. Tổng Quan

- **Indentation**: 2 khoảng trắng
- **Quotes**: Dấu nháy đơn (`'`) cho string thông thường, dấu nháy kép (`"`) cho JSX
- **Semicolons**: Bắt buộc sử dụng
- **Max Line Length**: 80-100 ký tự
- **Comments**: JSDoc cho functions, mỗi file có header comment

### 3.2. TypeScript

- **Strict Mode**: Enabled
- **Type Annotations**: Bắt buộc cho parameters và return types
- **Interface vs Type**: Ưu tiên Interface cho object shapes, Type cho unions/aliases
- **Generics**: Sử dụng cho các hàm/components tái sử dụng
- **Enums**: Sử dụng cho các giá trị cố định, có ý nghĩa

```typescript
// ✅ Good
interface UserProps {
  name: string;
  email: string;
  role: UserRole;
}

function getUserById(id: string): Promise<User | null> {
  // implementation
}

// ❌ Bad
function processData(data) {
  // implementation
}
```

### 3.3. React & JSX

- **Functional Components**: Ưu tiên sử dụng functional components với hooks
- **Component Props**: Định nghĩa interface riêng cho props
- **Destructuring**: Sử dụng destructuring cho props và state
- **Fragment**: Sử dụng `<>...</>` thay vì `<div>` không cần thiết
- **Conditional Rendering**: Ưu tiên sử dụng toán tử `&&` hoặc ternary 
- **Keys**: Bắt buộc sử dụng key cho list items (tốt nhất là ID)

```tsx
// ✅ Good
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  const { name, email, role } = user;
  
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>{email}</p>
      {role === 'admin' && <span className="badge">Admin</span>}
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
};

// ❌ Bad
const UserCard = (props) => {
  return (
    <div className="card">
      <h3>{props.user.name}</h3>
      <p>{props.user.email}</p>
      <div>
        {props.user.role === 'admin' ? <span className="badge">Admin</span> : null}
      </div>
      <button onClick={() => props.onEdit(props.user.id)}>Edit</button>
    </div>
  );
};
```

### 3.4. Redux

- **Slices**: Chia nhỏ state theo tính năng
- **Immutability**: Luôn đảm bảo immutability (Redux Toolkit hỗ trợ)
- **Action Types**: Ưu tiên sử dụng createSlice
- **Selectors**: Sử dụng selectors để truy xuất state
- **State Access**: Sử dụng hooks như useSelector, useDispatch

```typescript
// ✅ Good
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    userLoggedIn: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    userLoggedOut: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

// Component usage
const { user, token } = useSelector((state) => state.auth);
const dispatch = useDispatch();

dispatch(userLoggedIn({ user, token }));
```

## 4. Các Pattern Phổ Biến

### 4.1. Backend Patterns

#### Controller Pattern

```typescript
// user.controller.ts
export const loginUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return next(new ErrorHandler("Please enter email and password", 400));
    }
    
    // Logic processing
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    
    // Response
    res.status(200).json({
      success: true,
      user,
      token,
    });
  }
);
```

#### Middleware Pattern

```typescript
// auth.ts
export const isAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token;
    
    if (!token) {
      return next(new ErrorHandler("Please login to access this resource", 401));
    }
    
    // Verify token and proceed
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    next();
  }
);
```

#### Error Handling Pattern

```typescript
// errorHandler.ts
class ErrorHandler extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// catchAsyncErrors.ts
const catchAsyncErrors = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### 4.2. Frontend Patterns

#### Component Composition

```tsx
// Layout composition
const DashboardLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
};

// Usage
const Dashboard = () => {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
};
```

#### Custom Hooks

```typescript
// useAuth.ts
export const useAuth = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';
  
  const logout = useCallback(() => {
    dispatch(userLoggedOut());
  }, [dispatch]);
  
  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    logout,
  };
};

// Usage in component
const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  );
};
```

#### Container/Presentational Pattern

```tsx
// Container component
const CourseListContainer: React.FC = () => {
  const { data, isLoading, error } = useGetAllCoursesQuery();
  
  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message="Failed to load courses" />;
  
  return <CourseList courses={data.courses} />;
};

// Presentational component
interface CourseListProps {
  courses: Course[];
}

const CourseList: React.FC<CourseListProps> = ({ courses }) => {
  return (
    <div className="course-grid">
      {courses.map(course => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
};
```

## 5. Comment và Documentation

### 5.1. Quy Ước Comment

- **File Header**: Mỗi file có comment mô tả mục đích
- **Function/Component**: JSDoc cho functions/components chính
- **Complex Logic**: Comment cho logic phức tạp
- **TODO/FIXME**: Đánh dấu code cần cải thiện/fix sau

```typescript
/**
 * User Controller
 * Handles all user-related API endpoints
 */

/**
 * Login user and return JWT token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
export const loginUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    // Implementation
  }
);

// FIXME: Improve error handling for expired tokens
// TODO: Add rate limiting to prevent brute force attacks
```

### 5.2. Documentation

- **README.md**: Tổng quan về dự án, cài đặt, và sử dụng
- **API Documentation**: Swagger/OpenAPI hoặc README chuyên biệt
- **Component Documentation**: Storybook hoặc comment JSDoc

## 6. CSS/Styling

### 6.1. Tailwind CSS

- **Utility-First**: Ưu tiên sử dụng utility classes
- **Component Classes**: Tạo component classes cho các pattern lặp lại
- **Responsive Design**: Sử dụng breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- **Dark Mode**: Sử dụng `dark:` variant

```tsx
// ✅ Good
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors">
  Submit
</button>

// ❌ Bad
<button className="submit-button">
  Submit
</button>
// + custom CSS elsewhere
```

### 6.2. CSS Modules / Styled Components

- **Scoped Styles**: Ưu tiên CSS Modules hoặc Styled Components
- **Naming**: BEM-like naming cho class names
- **Variables**: Sử dụng CSS variables cho theme

```tsx
// CSS Modules
import styles from './Button.module.css';

<button className={styles.button}>Submit</button>

// Styled Components
const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: 0.25rem;
`;

<Button>Submit</Button>
```

## 7. Testing

### 7.1. Unit Testing

- **Test File Location**: Cùng thư mục với file được test (`*.test.ts`)
- **Naming Convention**: `describe('ComponentName', () => { it('should do something', () => {...}) })`
- **Coverage**: Mục tiêu >80% coverage cho business logic

```typescript
// user.test.ts
describe('User Controller', () => {
  describe('loginUser', () => {
    it('should return 400 if email or password is missing', async () => {
      // Test implementation
    });
    
    it('should return 401 if email or password is invalid', async () => {
      // Test implementation
    });
    
    it('should return user and token if credentials are valid', async () => {
      // Test implementation
    });
  });
});
```

### 7.2. Integration Testing

- **API Testing**: Test full API workflows
- **Auth Testing**: Test authentication và authorization
- **Database Testing**: Test database interactions

### 7.3. E2E Testing

- **Cypress/Playwright**: Test user flows từ đầu đến cuối
- **Critical Paths**: Focus vào các luồng quan trọng (login, checkout, etc.)

## 8. Git & Version Control

### 8.1. Commit Message

- **Format**: `<type>(<scope>): <subject>`
- **Types**: feat, fix, docs, style, refactor, test, chore
- **Scope**: module/feature affected (optional)
- **Subject**: Mô tả ngắn gọn về thay đổi

```
feat(auth): add social login with Google
fix(courses): resolve issue with video playback
docs: update README with installation instructions
refactor(api): improve error handling in controllers
```

### 8.2. Branching Strategy

- **main/master**: Code sản phẩm, luôn stable
- **develop**: Branch phát triển chính
- **feature/x**: Feature branches từ develop
- **bugfix/x**: Bug fix branches từ develop
- **release/x.y.z**: Release branches từ develop
- **hotfix/x**: Hotfix branches từ main

### 8.3. Pull Requests

- **Title**: Mô tả rõ ràng mục đích PR
- **Description**: Chi tiết về các thay đổi và cách test
- **Reviewers**: Chỉ định ít nhất 1 người review
- **Labels**: Thêm labels phù hợp (bug, feature, etc.)

## 9. Performance Best Practices

### 9.1. Backend

- **Pagination**: Áp dụng cho API trả về nhiều items
- **Caching**: Redis/memory cache cho dữ liệu truy cập thường xuyên
- **Database Indexes**: Tạo indexes cho các queries phổ biến
- **Compression**: Gzip/Brotli cho responses
- **Batch Operations**: Sử dụng bulk operations khi có thể

### 9.2. Frontend

- **Code Splitting**: Dynamic import cho routes và components lớn
- **Lazy Loading**: Lazy load cho images và components không cần thiết ngay
- **Memoization**: useMemo và useCallback cho tính toán phức tạp
- **Tree Shaking**: Import cụ thể thay vì import nguyên package
- **Image Optimization**: Sử dụng Next.js Image component

```tsx
// ✅ Good
import { Button } from '@mui/material/Button';

// ❌ Bad
import { Button } from '@mui/material';
```

## 10. Accessibility

### 10.1. Semantic HTML

- **Semantic Elements**: Sử dụng đúng element (`<button>`, `<a>`, etc.)
- **Headings**: Sử dụng đúng cấp bậc heading (h1, h2, etc.)
- **Lists**: Sử dụng `<ul>`, `<ol>` khi thích hợp

### 10.2. ARIA

- **aria-label**: Cung cấp labels cho elements không có visible text
- **aria-describedby**: Liên kết elements với descriptions
- **role**: Chỉ định role khi cần thiết

### 10.3. Focus Management

- **tabIndex**: Đảm bảo tabbing order hợp lý 
- **Focus Trap**: Trap focus trong modals và dialogs
- **Focus Indicator**: Visible focus indicator cho keyboard navigation

## 11. Quy Ước Specific cho E-Learning Project

### 11.1. Course Content Structure

```typescript
// Standard format for course data
interface ICourseData {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: {
    public_id: string;
    url: string;
  };
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: Array<{ title: string, url: string }>;
  suggestion: string;
  questions: IComment[];
}
```

### 11.2. API Response Format

```typescript
// Success response
{
  success: true,
  data: {
    // Actual data
  },
  message?: string
}

// Error response
{
  success: false,
  message: "Error message"
}
```

### 11.3. Form Validation

```typescript
// Validation schema using Yup
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// Formik usage
const formik = useFormik({
  initialValues: {
    email: "",
    password: "",
  },
  validationSchema: loginSchema,
  onSubmit: (values) => {
    // Submit logic
  },
});
```

## 12. Checklist Trước Khi Commit/PR

- [ ] Code tuân theo coding style và conventions
- [ ] TypeScript không có any types không cần thiết
- [ ] Không có console.log dư thừa
- [ ] Component props có type definitions đầy đủ
- [ ] ESLint/Prettier không báo lỗi
- [ ] Tests đã pass
- [ ] Code đã được document đầy đủ
- [ ] Các sensitive information (API keys, etc.) không được hardcode
- [ ] Responsive trên các kích thước màn hình
- [ ] Accessibility được đảm bảo
- [ ] Performance được tối ưu
- [ ] Git commit message tuân theo quy ước