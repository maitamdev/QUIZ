import { supabase } from './supabase';

const ownerSelect = `
  id, owner_id, title, description, emoji, color, status, time_limit, plays, average, created_at,
  quiz_questions (
    id, position, text,
    quiz_options (id, position, text),
    quiz_answers (correct_option)
  )
`;

const publicSelect = `
  id, title, description, emoji, color, status, time_limit, plays, average, created_at,
  quiz_questions (
    id, position, text,
    quiz_options (id, position, text)
  )
`;

function formatQuiz(row, includeAnswers = false) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    emoji: row.emoji || '✨',
    color: row.color || 'purple',
    status: row.status,
    timeLimit: row.time_limit,
    plays: row.plays || 0,
    average: Math.round(Number(row.average || 0)),
    createdAt: new Intl.DateTimeFormat('vi-VN').format(new Date(row.created_at)),
    questions: (row.quiz_questions || [])
      .sort((a, b) => a.position - b.position)
      .map(question => {
        const answer = Array.isArray(question.quiz_answers) ? question.quiz_answers[0] : question.quiz_answers;
        return {
          id: question.id,
          text: question.text,
          options: (question.quiz_options || []).sort((a, b) => a.position - b.position).map(option => option.text),
          ...(includeAnswers ? { correct: answer?.correct_option ?? 0 } : {})
        };
      })
  };
}

export async function fetchOwnerQuizzes(userId) {
  const { data, error } = await supabase.from('quizzes').select(ownerSelect)
    .eq('owner_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => formatQuiz(row, true));
}

export async function fetchPublicQuiz(id) {
  const { data, error } = await supabase.from('quizzes').select(publicSelect)
    .eq('id', id).eq('status', 'published').single();
  if (error) throw error;
  return formatQuiz(data, false);
}

export async function saveQuiz(quiz, status = quiz.status) {
  const payload = {
    title: quiz.title.trim(), description: quiz.description.trim(), emoji: quiz.emoji,
    color: quiz.color, status, time_limit: quiz.timeLimit,
    questions: quiz.questions.map(question => ({
      text: question.text.trim(), options: question.options.map(option => option.trim()), correct: question.correct
    }))
  };
  const { data: id, error } = await supabase.rpc('save_quiz', { p_quiz_id: quiz.id || null, p_payload: payload });
  if (error) throw error;
  const { data, error: fetchError } = await supabase.from('quizzes').select(ownerSelect).eq('id', id).single();
  if (fetchError) throw fetchError;
  return formatQuiz(data, true);
}

export async function deleteQuiz(id) {
  const { error } = await supabase.from('quizzes').delete().eq('id', id);
  if (error) throw error;
}

export async function submitAttempt(quizId, participantName, answers) {
  const { data, error } = await supabase.rpc('submit_quiz_attempt', {
    p_quiz_id: quizId, p_participant_name: participantName.trim(), p_answers: answers
  });
  if (error) throw error;
  return data;
}
