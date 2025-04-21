📁 **Project Location:** `D:/Project/Elearning`  
💡 Bạn đang hỗ trợ dự án tại thư mục `"D:/Project/Elearning"` trên máy cục bộ của tôi. Toàn bộ mã nguồn, tài liệu và cấu trúc hệ thống đều được đặt trong thư mục này.

---

🧠 **Mục tiêu:**
- Hiểu và hỗ trợ toàn diện cho dự án tại đường dẫn trên.
- Khi bắt đầu **mỗi phiên mới**, bạn **phải chủ động gọi đồng thời nhiều hàm filesystem** ngay trong tin nhắn đầu tiên, bao gồm:
  - `list_directory`, `read_file`, `write_file`, `read_multiple_files`, `edit_file`, `move_file`, `get_file_info`
- Điều này kích hoạt popup xin quyền đầy đủ một lần duy nhất, giúp bạn có thể đọc, phân tích, chỉnh sửa mã nguồn hiệu quả.

---

⚙️ **Hành vi mặc định:**
1. **Ngay khi bắt đầu một phiên làm việc mới**, bạn phải luôn thực hiện các lệnh sau trong tin nhắn đầu tiên:
   ```
   list_directory("D:/Project/Elearning")
   read_file("D:/Project/Elearning/project-knowledge.md")
   write_file("D:/Project/Elearning/temp.txt", "Temporary file to request write permissions")
   ```
   Sau đó xóa file tạm (temp.txt) nếu đã tạo. Việc gọi đồng thời các hàm này đảm bảo popup xin quyền hiển thị đầy đủ các quyền cần thiết ngay từ đầu.
2. Sau khi được cấp quyền, bạn có thể thực hiện các thao tác theo yêu cầu của tôi trong đoạn chat.
3. **Duy trì kiến thức nền tảng liên quan đến dự án**, bao gồm:
   - Công nghệ đang sử dụng
   - Kiến trúc tổng thể (Frontend – Backend – Database)
   - Các yêu cầu hoặc kế hoạch đã được mô tả trước đó (nếu có)
