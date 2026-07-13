import { describe, expect, it } from 'vitest';
import { parseQuizJson } from './jsonImport';

describe('parseQuizJson', () => {
  it('chuẩn hóa câu trắc nghiệm và đáp án dạng chữ cái', () => {
    const result = parseQuizJson({
      title: 'Kiểm tra HTML',
      questions: [{ text: 'Thẻ liên kết?', options: ['div', 'a', 'p'], correct: 'B', explanation: 'Thẻ a tạo liên kết.' }]
    });
    expect(result.meta.title).toBe('Kiểm tra HTML');
    expect(result.questions[0]).toMatchObject({ type: 'choice', correct: 1, needsReview: false });
  });

  it('hỗ trợ Đúng/Sai và tên trường tiếng Việt', () => {
    const result = parseQuizJson({ questions: [{ noi_dung: 'HTML là ngôn ngữ đánh dấu.', type: 'dung_sai', dap_an: true, giai_thich: 'Đúng.' }] });
    expect(result.questions[0]).toMatchObject({ options: ['Đúng', 'Sai'], correct: 0, type: 'true_false' });
  });

  it('đánh dấu câu cần xem lại khi đáp án không nhận dạng được', () => {
    const result = parseQuizJson([{ text: 'Câu hỏi', options: ['Một', 'Hai'], correct: 'Z' }]);
    expect(result.questions[0].needsReview).toBe(true);
    expect(result.warnings[0]).toContain('chưa nhận dạng');
  });

  it('cảnh báo lựa chọn trùng nhau', () => {
    const result = parseQuizJson([{ text: 'Câu hỏi', options: ['Đáp án', 'đáp án'], correct: 'A' }]);
    expect(result.warnings.some(item=>item.includes('trùng'))).toBe(true);
  });

  it('từ chối payload không có câu hỏi hợp lệ', () => {
    expect(() => parseQuizJson({ questions: [] })).toThrow('không có câu hỏi hợp lệ');
    expect(() => parseQuizJson({ title: 'Thiếu questions' })).toThrow('Không tìm thấy');
  });
});
