# Quizora

Website tạo và làm bài trắc nghiệm theo phong cách game-show, gồm đầy đủ:

- Landing page giới thiệu sản phẩm.
- Dashboard quản trị và thống kê nhanh.
- Tạo, sửa, xóa bộ đề; thêm câu hỏi và chọn đáp án đúng.
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

Không sử dụng `service_role`/secret key trong file `.env` của frontend.

## Build production

```bash
npm run build
npm run preview
```

> Để link chia sẻ truy cập được từ Internet, hãy deploy bản build lên một domain công khai.
