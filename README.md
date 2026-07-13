# Quizora

Website tạo và làm bài trắc nghiệm theo phong cách game-show, gồm đầy đủ:

- Landing page giới thiệu sản phẩm.
- Dashboard quản trị và thống kê nhanh.
- Tạo, sửa, xóa bộ đề; thêm câu hỏi và chọn đáp án đúng.
- Hỗ trợ câu trắc nghiệm 2–8 lựa chọn và câu Đúng/Sai.
- Thêm giải thích đáp án; chỉ trả về cho người chơi sau khi nộp bài.
- Phản hồi đúng/sai tức thời: đáp án đúng màu xanh, lựa chọn sai màu đỏ.
- Tính điểm theo tốc độ và tự đưa câu sai vào vòng ôn lại cuối bài.
- Nhập hàng loạt câu hỏi từ file Word `.docx`.
- Xuất bản và sao chép link riêng cho từng bài quiz.
- Người tham gia nhập tên, làm bài theo thời gian và xem kết quả.
- Dữ liệu thật được lưu trên Supabase PostgreSQL.
- Supabase Auth bảo vệ khu vực admin; RLS giới hạn dữ liệu theo chủ sở hữu.
- Đáp án đúng không được gửi xuống máy người chơi; database chấm điểm qua RPC.
- Mỗi lượt làm bài được lưu vào bảng `quiz_attempts` và cập nhật thống kê thật.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Kết nối Supabase

1. Tạo một Supabase project.
2. Mở SQL Editor và chạy toàn bộ [supabase/schema.sql](supabase/schema.sql).
3. Sao chép `.env.example` thành `.env`.
4. Điền Project URL và Publishable key (hoặc anon key cũ):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

5. Khởi động lại `npm run dev`, mở `/admin` và đăng ký tài khoản.

Khi cập nhật từ phiên bản cũ, hãy chạy lại toàn bộ `supabase/schema.sql` để thêm loại câu hỏi, giải thích và hỗ trợ tối đa 8 lựa chọn. File schema được thiết kế để có thể chạy lại.

## Mẫu nhập Word

```text
Câu 1: Thủ đô Việt Nam là gì?
A. Hà Nội
B. Đà Nẵng
C. TP. Hồ Chí Minh
Đáp án: A
Giải thích: Hà Nội là thủ đô của Việt Nam.

Câu 2: Trái Đất hình cầu.
Đáp án: Đúng
Giải thích: Trái Đất có dạng gần hình cầu.
```

Mỗi câu trắc nghiệm có thể có từ 2 đến 8 đáp án, ký hiệu từ A đến H. Câu Đúng/Sai chỉ cần ghi `Đáp án: Đúng` hoặc `Đáp án: Sai`.

Không sử dụng `service_role`/secret key trong file `.env` của frontend.

## Build production

```bash
npm run build
npm run preview
```

> Để link chia sẻ truy cập được từ Internet, hãy deploy bản build lên một domain công khai.
