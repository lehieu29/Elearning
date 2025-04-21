# Chiến lược Testing

Tài liệu này mô tả chiến lược testing của dự án E-Learning, bao gồm các loại test, công cụ sử dụng và workflow.

## 1. Loại Test

### 1.1. Unit Testing

Kiểm tra các thành phần riêng lẻ của ứng dụng để đảm bảo chúng hoạt động đúng như mong đợi.

#### Backend:
- **Công cụ**: Jest, Supertest
- **Phạm vi**:
  - Controllers
  - Services
  - Middleware
  - Utility functions

#### Frontend:
- **Công cụ**: Jest, React Testing Library
- **Phạm vi**:
  - Components
  - Hooks
  - Redux reducers/actions/selectors
  - Utility functions

### 1.2. Integration Testing

Kiểm tra tương tác giữa các thành phần để đảm bảo chúng làm việc cùng nhau đúng cách.

#### Backend:
- **Công cụ**: Jest, Supertest
- **Phạm vi**:
  - API endpoints
  - Database interactions
  - Authentication flow

#### Frontend:
- **Công cụ**: Jest, React Testing Library
- **Phạm vi**:
  - Component interactions
  - Redux store integration
  - API interactions

### 1.3. End-to-End Testing

Kiểm tra toàn bộ luồng của ứng dụng từ giao diện người dùng đến cơ sở dữ liệu.

- **Công cụ**: Cypress
- **Phạm vi**:
  - User flows (đăng ký, đăng nhập, mua khóa học, v.v.)
  - Admin workflows
  - Payment processing
  - Video playback

## 2. Cấu trúc Test

### 2.1. Backend Testing

```
Backend/
├── __tests__/
│   ├── unit/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── integration/
│   │   ├── api/
│   │   └── auth/
│   └── setup.js
```

### 2.2. Frontend Testing

```
Frontend/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── redux/
│   │   └── utils/
│   ├── integration/
│   │   ├── pages/
│   │   └── features/
│   └── setup.js
├── cypress/
│   ├── e2e/
│   ├── fixtures/
│   └── support/
```

## 3. Công cụ và Thư viện

### 3.1. Testing Framework

- **Jest**: Framework testing chính cho cả frontend và backend
- **React Testing Library**: Library test cho React components
- **Supertest**: Library test HTTP assertions
- **Cypress**: Framework cho end-to-end testing

### 3.2. Mocking

- **Jest Mock Functions**: Mock functions và modules
- **MSW (Mock Service Worker)**: Mock API requests
- **MongoDB Memory Server**: In-memory MongoDB cho testing

## 4. Quy trình CI/CD cho Testing

### 4.1. Pre-commit Hooks

Sử dụng Husky để chạy các kiểm tra trước khi commit:
- Lint
- Format check (Prettier)
- Unit tests

### 4.2. CI Pipeline

Được cấu hình để chạy trên mỗi push và pull request:
1. **Build**: Kiểm tra build thành công
2. **Unit Tests**: Chạy tất cả unit tests
3. **Integration Tests**: Chạy tất cả integration tests
4. **E2E Tests**: Chạy các E2E tests quan trọng
5. **Coverage Report**: Tạo báo cáo coverage

### 4.3 Test Coverage

Mục tiêu coverage:
- **Backend**: > 80% cho controllers, services và utilities
- **Frontend**: > 70% cho components và hooks

## 5. Best Practices

### 5.1. Testing Backend

- Sử dụng database in-memory cho unit và integration tests
- Mock external services (payment, email, cloud storage)
- Tập trung vào business logic và error handling
- Sử dụng fixtures cho test data

### 5.2. Testing Frontend

- Test behavior, không phải implementation
- Sử dụng user-event cho user interactions
- Mock API calls sử dụng MSW
- Test accessibility

## 6. Test Example

### 6.1. Backend Unit Test (Controller)

```javascript
// __tests__/unit/controllers/course.controller.test.js
describe('Course Controller', () => {
  describe('getAllCourses', () => {
    it('should return all courses', async () => {
      // Setup
      const mockCourses = [/* mock data */];
      jest.spyOn(CourseModel, 'find').mockResolvedValue(mockCourses);
      
      // Execute
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      
      await getAllCourses(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        courses: mockCourses,
      });
    });
    
    it('should handle errors', async () => {
      // Setup
      const errorMessage = 'Database error';
      jest.spyOn(CourseModel, 'find').mockRejectedValue(new Error(errorMessage));
      
      // Execute
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      
      await getAllCourses(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toBe(errorMessage);
    });
  });
});
```

### 6.2. Frontend Component Test

```javascript
// __tests__/unit/components/CourseCard.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseCard from '../../../app/components/Course/CourseCard';

describe('CourseCard', () => {
  const mockCourse = {
    _id: '1',
    name: 'React Course',
    price: 99.99,
    thumbnail: { url: 'image-url' },
    ratings: 4.5,
  };
  
  it('renders course information correctly', () => {
    render(<CourseCard course={mockCourse} />);
    
    expect(screen.getByText('React Course')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByAltText('React Course')).toHaveAttribute('src', 'image-url');
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });
  
  it('navigates to course details on click', async () => {
    const user = userEvent.setup();
    const mockRouter = { push: jest.fn() };
    
    render(<CourseCard course={mockCourse} router={mockRouter} />);
    
    await user.click(screen.getByRole('link'));
    
    expect(mockRouter.push).toHaveBeenCalledWith(`/course/1`);
  });
});
```

### 6.3. E2E Test

```javascript
// cypress/e2e/purchase_course.cy.js
describe('Course Purchase Flow', () => {
  beforeEach(() => {
    // Setup user and login
    cy.login('user@example.com', 'password123');
  });
  
  it('allows user to purchase a course', () => {
    // Visit course page
    cy.visit('/course/some-course-id');
    
    // Check course details
    cy.contains('h1', 'React Masterclass');
    cy.contains('$99.99');
    
    // Click buy button
    cy.contains('button', 'Buy Now').click();
    
    // Fill payment details (using Stripe test mode)
    cy.get('input[name="cardNumber"]').type('4242424242424242');
    cy.get('input[name="cardExpiry"]').type('1234');
    cy.get('input[name="cardCvc"]').type('123');
    
    // Complete payment
    cy.contains('button', 'Pay Now').click();
    
    // Verify success
    cy.contains('Payment Successful');
    cy.contains('button', 'Go to Course').click();
    
    // Verify access to course content
    cy.url().should('include', '/course-access');
    cy.contains('Course Content');
  });
});
```

## 7. Continuous Improvement

Quá trình cải tiến liên tục:

1. **Test Review**: Xem xét test coverage và hiệu quả hàng tuần
2. **Test Refactoring**: Cải tiến tests để giảm flakiness và tăng tốc độ
3. **Automated Reporting**: Báo cáo tự động về test failures và coverage
4. **Performance Testing**: Thêm performance tests khi dự án phát triển
