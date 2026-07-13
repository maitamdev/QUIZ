const letterIndex = value => 'ABCDEFGH'.indexOf((value || '').trim().toUpperCase());

export function parseQuizText(rawText) {
  const lines = rawText.replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean);
  const questions = [];
  const warnings = [];
  let current = null;

  const finish = () => {
    if (!current) return;
    const answerText = current.answerText.trim();
    const trueFalseAnswer = /^(đúng|true|sai|false)$/i.test(answerText);
    if (current.options.length < 2 && trueFalseAnswer) {
      current.type = 'true_false';
      current.options = ['Đúng', 'Sai'];
      current.correct = /^(đúng|true)$/i.test(answerText) ? 0 : 1;
    } else {
      current.correct = letterIndex(answerText);
      if (current.correct < 0) {
        const optionIndex = current.options.findIndex(option => option.toLowerCase() === answerText.toLowerCase());
        current.correct = optionIndex;
      }
    }
    if (!current.text || current.options.length < 2 || current.options.length > 8) {
      warnings.push(`Bỏ qua một câu không hợp lệ: “${current.text || 'Không có nội dung'}”`);
    } else {
      const needsReview = current.correct < 0 || current.correct >= current.options.length;
      questions.push({
        id: Math.random().toString(36).slice(2, 9), text: current.text,
        type: current.type || 'choice', options: current.options,
        correct: needsReview ? 0 : current.correct,
        explanation: current.explanation, needsReview
      });
      if (needsReview) warnings.push(`Câu “${current.text}” chưa nhận dạng được đáp án đúng.`);
    }
    current = null;
  };

  for (const line of lines) {
    const questionMatch = line.match(/^(?:câu|question)\s*\d*\s*[:.)-]\s*(.+)$/i) || line.match(/^\d+[.)]\s+(.+)$/);
    const optionMatch = line.match(/^([A-H])\s*[.):\-]\s*(.+)$/i);
    const answerMatch = line.match(/^(?:đáp\s*án(?:\s*đúng)?|answer)\s*[:\-]\s*(.+)$/i);
    const explanationMatch = line.match(/^(?:giải\s*thích|explanation)\s*[:\-]\s*(.+)$/i);
    const typeMatch = line.match(/^(?:loại|type)\s*[:\-]\s*(.+)$/i);

    if (questionMatch) {
      finish();
      current = { text: questionMatch[1].trim(), type: 'choice', options: [], answerText: '', explanation: '' };
    } else if (current && optionMatch) {
      current.options.push(optionMatch[2].trim());
    } else if (current && answerMatch) {
      current.answerText = answerMatch[1].trim();
    } else if (current && explanationMatch) {
      current.explanation = explanationMatch[1].trim();
    } else if (current && typeMatch && /đúng|sai|true|false/i.test(typeMatch[1])) {
      current.type = 'true_false';
    } else if (current && current.options.length === 0 && !current.answerText) {
      current.text += ` ${line}`;
    } else if (current && current.explanation) {
      current.explanation += ` ${line}`;
    }
  }
  finish();
  return { questions, warnings };
}

export async function importQuizDocx(file) {
  if (!file?.name?.toLowerCase().endsWith('.docx')) throw new Error('Quizora hiện hỗ trợ file Word định dạng .docx.');
  const { default: mammoth } = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const { value, messages } = await mammoth.extractRawText({ arrayBuffer });
  const parsed = parseQuizText(value);
  if (!parsed.questions.length) throw new Error('Không tìm thấy câu hỏi hợp lệ. Hãy kiểm tra đúng định dạng mẫu.');
  return { ...parsed, warnings: [...parsed.warnings, ...messages.map(message => message.message)] };
}
