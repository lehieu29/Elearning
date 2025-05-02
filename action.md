# Báo cáo sửa lỗi gắn phụ đề vào video

## Vấn đề ban đầu

Hệ thống gắn phụ đề vào video (burnSubtitlesToVideo) trong dự án E-Learning gặp lỗi trên nền tảng Windows do cách xử lý đường dẫn file không đúng. Cụ thể:

1. Đường dẫn Windows sử dụng dấu backslash (`\`) cần được escape đúng cách khi sử dụng với FFmpeg
2. Ký tự đặc biệt trong đường dẫn (như dấu `:`) cũng cần được escape
3. Hệ thống không có cơ chế fallback hiệu quả khi việc đọc file phụ đề thất bại
4. Phụ đề tiếng Việt không được hiển thị đúng do vấn đề encoding

## Các thay đổi đã thực hiện

### 1. Cải thiện hàm `burnSubtitlesToVideo` và `burnSubtitlesToVideoSimplified`

- Thêm phát hiện nền tảng (Windows/Linux/Mac) và xử lý đường dẫn phù hợp
- Cải thiện cơ chế escape đường dẫn đặc biệt trên Windows
- Thêm cơ chế fallback khi gặp lỗi với file phụ đề
- Đơn giản hóa lệnh FFmpeg để đảm bảo tính tương thích
- Cập nhật các tham số FFmpeg để khớp với mẫu:
  ```
  ffmpeg -i "video.mp4" -vf "subtitles=subtitles_test.srt:force_style='FontSize=24,BorderStyle=3,Outline=1,Shadow=0,MarginV=25'" -c:v libx264 -crf 18 -preset slow -c:a copy "output.mp4"
  ```

### 2. Cải thiện hàm `createEnhancedSubtitleFile`

- Thêm kiểm tra chất lượng phụ đề chi tiết hơn
- Đảm bảo thư mục đầu ra tồn tại trước khi ghi file
- Thêm UTF-8 BOM để đảm bảo hiển thị tiếng Việt đúng
- Kiểm tra và xác nhận nội dung file sau khi ghi

### 3. Cải thiện prompt cho Gemini API

- Nhấn mạnh yêu cầu phụ đề PHẢI HOÀN TOÀN bằng TIẾNG VIỆT CÓ DẤU
- Không chấp nhận bất kỳ phụ đề nào bằng tiếng Anh
- Thêm hướng dẫn đặc biệt cho video dạy học/hướng dẫn

## Cách hoạt động

Quy trình gắn phụ đề vào video giờ đây hoạt động như sau:

1. Kiểm tra nền tảng và chuẩn bị đường dẫn phù hợp với nền tảng đó
2. Escape các ký tự đặc biệt trong đường dẫn
3. Sử dụng lệnh FFmpeg đơn giản và tương thích:
   ```
   ffmpeg -i "video_input.mp4" \
     -vf "subtitles=subtitles_path.srt:force_style='FontSize=24,BorderStyle=3,Outline=1,Shadow=0,MarginV=25'" \
     -c:v libx264 \
     -crf 18 \
     -preset slow \
     -c:a copy \
     "video_output.mp4"
   ```
4. Nếu gặp lỗi:
   - Tạo bản sao file phụ đề ở thư mục tạm với tên đơn giản
   - Thực hiện lại lệnh FFmpeg với đường dẫn mới
   - Xóa file tạm sau khi hoàn tất
5. Đảm bảo phụ đề tiếng Việt được hiển thị đúng với UTF-8 BOM

## Đáp ứng các yêu cầu

Bản sửa lỗi này đã đáp ứng đầy đủ các yêu cầu:

1. ✅ **Đảm bảo đường dẫn phụ đề tồn tại**: Kiểm tra file phụ đề, tạo file mẫu nếu không tồn tại
2. ✅ **Xây dựng lệnh FFmpeg tương tự lệnh mẫu**: 
   - Tham số `-vf "subtitles=...:force_style='FontSize=24,BorderStyle=3,Outline=1,Shadow=0,MarginV=25'"` 
   - Tham số `-c:v libx264 -crf 18 -preset slow -c:a copy`
3. ✅ **Đảm bảo phụ đề Gemini trả về là tiếng Việt**: Nhấn mạnh trong prompt và encoding UTF-8 BOM

## Kiểm thử

Để kiểm tra sửa lỗi:

1. Thử tải lên video với tên file chứa ký tự tiếng Việt và đường dẫn phức tạp
2. Kiểm tra xem phụ đề tiếng Việt có hiển thị đúng không
3. Quan sát log để đảm bảo lệnh FFmpeg được tạo đúng cách
