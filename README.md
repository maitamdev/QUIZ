# Quizora

Website tạo và làm bài trắc nghiệm theo phong cách game-show, gồm đầy đủ:

- Landing page giới thiệu sản phẩm.
- Dashboard quản trị và thống kê nhanh.
- Tạo, sửa, xóa bộ đề; thêm câu hỏi và chọn đáp án đúng.
- Hỗ trợ câu trắc nghiệm 2–8 lựa chọn và câu Đúng/Sai.
- Thêm giải thích đáp án; chỉ trả về cho người chơi sau khi nộp bài.
- Phản hồi đúng/sai tức thời: đáp án đúng màu xanh, lựa chọn sai màu đỏ.
- Tính điểm theo tốc độ và tự đưa câu sai vào vòng ôn lại cuối bài.
- Nhập hàng loạt câu hỏi từ file JSON có kiểm tra cấu trúc.
- Xuất bản và sao chép link riêng cho từng bài quiz.
- Người tham gia nhập tên, làm bài theo thời gian và xem kết quả.
- Dữ liệu thật được lưu trên Supabase PostgreSQL.
- Supabase Auth bảo vệ khu vực admin; RLS giới hạn dữ liệu theo chủ sở hữu.
- Đáp án đúng không được gửi xuống máy người chơi; database chấm điểm qua RPC.
- Mỗi lượt làm bài được lưu vào bảng `quiz_attempts` và cập nhật thống kê thật.
- Dashboard kết quả thật: lượt hoàn thành, điểm trung bình, bảng người tham gia và câu hỏi khó.
- Xuất kết quả dạng CSV và sao lưu từng bộ câu hỏi về JSON.
- Điều hướng quản trị tối ưu cho điện thoại; editor cảnh báo thay đổi chưa lưu.
- Có bộ kiểm thử tự động cho trình nhập JSON và giới hạn file an toàn.

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

## Mẫu nhập JSON

```json
{
  "title": "Bộ câu hỏi mẫu",
  "questions": [
    {
      "text": "Thủ đô Việt Nam là thành phố nào?",
      "type": "choice",
      "options": ["Hà Nội", "Đà Nẵng", "Huế"],
      "correct": "A",
      "explanation": "Hà Nội là thủ đô của Việt Nam."
    },
    {
      "text": "Trái Đất có dạng gần hình cầu.",
      "type": "true_false",
      "correct": true,
      "explanation": "Trái Đất là một khối cầu hơi dẹt ở hai cực."
    }
  ]
}
```

Mỗi câu trắc nghiệm có thể có từ 2 đến 8 đáp án. Trường `correct` nhận chỉ số bắt đầu từ `0`, chữ cái `A`–`H`, nội dung đáp án, hoặc boolean với câu Đúng/Sai. File mẫu có thể tải trực tiếp trong cửa sổ nhập JSON.

Không sử dụng `service_role`/secret key trong file `.env` của frontend.

## Build production

```bash
npm run check
npm run build
npm run preview
```

`npm run check` chạy toàn bộ test rồi mới build production.

> Để link chia sẻ truy cập được từ Internet, hãy deploy bản build lên một domain công khai.
