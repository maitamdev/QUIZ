-- Quizora database schema
-- Run this whole file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  emoji text not null default '✨',
  color text not null default 'purple' check (color in ('purple', 'orange', 'blue', 'green')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  time_limit integer not null default 20 check (time_limit in (10, 20, 30, 60)),
  plays integer not null default 0 check (plays >= 0),
  average numeric(5,2) not null default 0 check (average between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  position integer not null check (position >= 0),
  text text not null check (char_length(text) between 1 and 1000),
  unique (quiz_id, position)
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  position integer not null check (position between 0 and 3),
  text text not null check (char_length(text) between 1 and 500),
  unique (question_id, position)
);

-- Correct answers live in a separate protected table so public players cannot inspect them.
create table if not exists public.quiz_answers (
  question_id uuid primary key references public.quiz_questions(id) on delete cascade,
  correct_option integer not null check (correct_option between 0 and 3)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  participant_name text not null check (char_length(participant_name) between 1 and 80),
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  answers jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now()
);

create index if not exists quizzes_owner_id_idx on public.quizzes(owner_id);
create index if not exists questions_quiz_id_idx on public.quiz_questions(quiz_id);
create index if not exists options_question_id_idx on public.quiz_options(question_id);
create index if not exists attempts_quiz_id_idx on public.quiz_attempts(quiz_id);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_attempts enable row level security;

-- Re-running this file is safe: recreate policies deterministically.
drop policy if exists "Published quizzes are public" on public.quizzes;
drop policy if exists "Owners can view quizzes" on public.quizzes;
drop policy if exists "Owners can create quizzes" on public.quizzes;
drop policy if exists "Owners can update quizzes" on public.quizzes;
drop policy if exists "Owners can delete quizzes" on public.quizzes;

create policy "Published quizzes are public" on public.quizzes
  for select to anon, authenticated using (status = 'published');
create policy "Owners can view quizzes" on public.quizzes
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners can create quizzes" on public.quizzes
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners can update quizzes" on public.quizzes
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners can delete quizzes" on public.quizzes
  for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "Public can view published questions" on public.quiz_questions;
drop policy if exists "Owners manage questions" on public.quiz_questions;
create policy "Public can view published questions" on public.quiz_questions
  for select to anon, authenticated using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and (q.status = 'published' or q.owner_id = (select auth.uid())))
  );
create policy "Owners manage questions" on public.quiz_questions
  for all to authenticated using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = (select auth.uid()))
  );

drop policy if exists "Public can view published options" on public.quiz_options;
drop policy if exists "Owners manage options" on public.quiz_options;
create policy "Public can view published options" on public.quiz_options
  for select to anon, authenticated using (
    exists (
      select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and (q.status = 'published' or q.owner_id = (select auth.uid()))
    )
  );
create policy "Owners manage options" on public.quiz_options
  for all to authenticated using (
    exists (
      select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and q.owner_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and q.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can view answers" on public.quiz_answers;
drop policy if exists "Owners manage answers" on public.quiz_answers;
create policy "Owners can view answers" on public.quiz_answers
  for select to authenticated using (
    exists (
      select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and q.owner_id = (select auth.uid())
    )
  );
create policy "Owners manage answers" on public.quiz_answers
  for all to authenticated using (
    exists (
      select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and q.owner_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
      where qq.id = question_id and q.owner_id = (select auth.uid())
    )
  );

-- Attempts are never directly writable from the browser. Only owners can inspect results.
drop policy if exists "Owners can view attempts" on public.quiz_attempts;
create policy "Owners can view attempts" on public.quiz_attempts
  for select to authenticated using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = (select auth.uid()))
  );

-- Atomic create/update for a complete quiz, including questions and answer keys.
create or replace function public.save_quiz(p_quiz_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_quiz_id uuid;
  v_question jsonb;
  v_option jsonb;
  v_question_id uuid;
  v_question_position integer;
  v_option_position integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if jsonb_array_length(coalesce(p_payload->'questions', '[]'::jsonb)) = 0 then
    raise exception 'A quiz needs at least one question';
  end if;

  if p_quiz_id is null then
    insert into public.quizzes (owner_id, title, description, emoji, color, status, time_limit)
    values (
      v_user, trim(p_payload->>'title'), coalesce(p_payload->>'description', ''),
      coalesce(p_payload->>'emoji', '✨'), coalesce(p_payload->>'color', 'purple'),
      coalesce(p_payload->>'status', 'draft'), coalesce((p_payload->>'time_limit')::integer, 20)
    ) returning id into v_quiz_id;
  else
    if not exists (select 1 from public.quizzes where id = p_quiz_id and owner_id = v_user) then
      raise exception 'Quiz not found or access denied';
    end if;
    v_quiz_id := p_quiz_id;
    update public.quizzes set
      title = trim(p_payload->>'title'), description = coalesce(p_payload->>'description', ''),
      emoji = coalesce(p_payload->>'emoji', '✨'), color = coalesce(p_payload->>'color', 'purple'),
      status = coalesce(p_payload->>'status', status),
      time_limit = coalesce((p_payload->>'time_limit')::integer, time_limit), updated_at = now()
    where id = v_quiz_id;
    delete from public.quiz_questions where quiz_id = v_quiz_id;
  end if;

  for v_question, v_question_position in
    select value, (ordinality - 1)::integer from jsonb_array_elements(p_payload->'questions') with ordinality
  loop
    insert into public.quiz_questions (quiz_id, position, text)
    values (v_quiz_id, v_question_position, trim(v_question->>'text')) returning id into v_question_id;

    if jsonb_array_length(coalesce(v_question->'options', '[]'::jsonb)) <> 4 then
      raise exception 'Every question must have exactly four options';
    end if;
    for v_option, v_option_position in
      select value, (ordinality - 1)::integer from jsonb_array_elements(v_question->'options') with ordinality
    loop
      insert into public.quiz_options (question_id, position, text)
      values (v_question_id, v_option_position, trim(v_option #>> '{}'));
    end loop;
    insert into public.quiz_answers (question_id, correct_option)
    values (v_question_id, (v_question->>'correct')::integer);
  end loop;
  return v_quiz_id;
end;
$$;

-- Server-side grading prevents answer keys from being exposed to public players.
create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_participant_name text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_score integer;
  v_percent numeric(5,2);
begin
  if not exists (select 1 from public.quizzes where id = p_quiz_id and status = 'published') then
    raise exception 'Published quiz not found';
  end if;
  if char_length(trim(p_participant_name)) not between 1 and 80 then
    raise exception 'Participant name is invalid';
  end if;

  select count(*)::integer into v_total from public.quiz_questions where quiz_id = p_quiz_id;
  if jsonb_array_length(coalesce(p_answers, '[]'::jsonb)) <> v_total then
    raise exception 'Answer count does not match question count';
  end if;

  select count(*)::integer into v_score
  from public.quiz_questions qq
  join public.quiz_answers qa on qa.question_id = qq.id
  where qq.quiz_id = p_quiz_id
    and (p_answers->>qq.position)::integer = qa.correct_option;

  insert into public.quiz_attempts (quiz_id, participant_name, score, total, answers)
  values (p_quiz_id, trim(p_participant_name), v_score, v_total, p_answers);

  v_percent := round((v_score::numeric / greatest(v_total, 1)) * 100, 2);
  update public.quizzes
  set average = round(((average * plays) + v_percent) / (plays + 1), 2), plays = plays + 1
  where id = p_quiz_id;

  return jsonb_build_object('score', v_score, 'total', v_total, 'percent', v_percent);
end;
$$;

revoke all on function public.save_quiz(uuid, jsonb) from public;
grant execute on function public.save_quiz(uuid, jsonb) to authenticated;
revoke all on function public.submit_quiz_attempt(uuid, text, jsonb) from public;
grant execute on function public.submit_quiz_attempt(uuid, text, jsonb) to anon, authenticated;

grant select on public.quizzes, public.quiz_questions, public.quiz_options to anon, authenticated;
grant insert, update, delete on public.quizzes, public.quiz_questions, public.quiz_options, public.quiz_answers to authenticated;
grant select on public.quiz_answers, public.quiz_attempts to authenticated;

