const uid = () => Math.random().toString(36).slice(2, 9);
const letters = 'ABCDEFGH';

function normalizeType(value, correctValue, options) {
  const type = String(value || '').toLowerCase().replaceAll('-', '_');
  if (['true_false', 'boolean', 'truefalse', 'dung_sai', 'đúng_sai'].includes(type)) return 'true_false';
  if ((!options || options.length === 0) && (typeof correctValue === 'boolean' || /^(đúng|sai|true|false)$/i.test(String(correctValue)))) return 'true_false';
  return 'choice';
}

function normalizeCorrect(value, options, type) {
  if (type === 'true_false') {
    if (value === true || /^(đúng|true)$/i.test(String(value))) return 0;
    if (value === false || /^(sai|false)$/i.test(String(value))) return 1;
  }
  if (Number.isInteger(value) && value >= 0 && value < options.length) return value;
  const text = String(value ?? '').trim();
  const letterIndex = letters.indexOf(text.toUpperCase());
  if (letterIndex >= 0 && letterIndex < options.length) return letterIndex;
  const textIndex = options.findIndex(option => option.toLowerCase() === text.toLowerCase());
  return textIndex;
}

export function parseQuizJson(input) {
  const payload = Array.isArray(input) ? { questions: input } : input;
  if (!payload || typeof payload !== 'object') throw new Error('JSON phải là một object hoặc một mảng câu hỏi.');
  const source = payload.questions || payload.quiz?.questions;
  if (!Array.isArray(source)) throw new Error('Không tìm thấy mảng "questions" trong file JSON.');
  const questions = [];
  const warnings = [];

  source.forEach((item, index) => {
    const text = String(item?.text ?? item?.question ?? item?.content ?? item?.noi_dung ?? '').trim();
    const correctValue = item?.correct ?? item?.correctAnswer ?? item?.answer ?? item?.dap_an;
    let rawOptions = item?.options ?? item?.choices ?? item?.answers ?? item?.lua_chon ?? [];
    if (rawOptions && !Array.isArray(rawOptions) && typeof rawOptions === 'object') rawOptions = Object.values(rawOptions);
    let options = Array.isArray(rawOptions) ? rawOptions.map(value => String(value).trim()).filter(Boolean) : [];
    const type = normalizeType(item?.type ?? item?.question_type, correctValue, options);
    if (type === 'true_false') options = ['Đúng', 'Sai'];
    const correct = normalizeCorrect(correctValue, options, type);
    const explanation = String(item?.explanation ?? item?.explain ?? item?.giai_thich ?? '').trim();
    if (!text || options.length < 2 || options.length > 8) {
      warnings.push(`Bỏ qua câu ${index + 1}: thiếu nội dung hoặc số lựa chọn không nằm trong khoảng 2–8.`);
      return;
    }
    const needsReview = correct < 0 || correct >= options.length;
    questions.push({ id: uid(), text, type, options, correct: needsReview ? 0 : correct, explanation, needsReview });
    if (needsReview) warnings.push(`Câu ${index + 1} chưa nhận dạng được đáp án đúng.`);
  });
  if (!questions.length) throw new Error('File JSON không có câu hỏi hợp lệ.');
  return {
    questions, warnings,
    meta: {
      title: String(payload.title ?? payload.quiz?.title ?? '').trim(),
      description: String(payload.description ?? payload.quiz?.description ?? '').trim(),
      emoji: String(payload.emoji ?? payload.quiz?.emoji ?? '').trim()
    }
  };
}

export async function importQuizJson(file) {
  if (!file?.name?.toLowerCase().endsWith('.json')) throw new Error('Hãy chọn file có định dạng .json.');
  try { return parseQuizJson(JSON.parse(await file.text())); }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error('File JSON bị sai cú pháp. Hãy kiểm tra dấu phẩy, ngoặc và dấu nháy.');
    throw error;
  }
}
