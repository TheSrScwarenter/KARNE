-- ==============================================================================
-- KARNE - YKS ÇALIŞMA TAKİP PLATFORMU
-- SUPABASE HIZLI KURULUM SQL KODU (ALL-IN-ONE SCHEMA)
-- ==============================================================================
-- Bu kodları Supabase Dashboard -> SQL Editor alanına yapıştırıp "RUN" butonuna basınız.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. KULLANICILAR VE CİHAZLAR ARASI GİRİŞ TABLOSU (SYSTEM USERS)
-- Telefondan veya bilgisayardan kayıt olan tüm hesapların ortak bulut tablosu
CREATE TABLE IF NOT EXISTS public.system_users (
  id text PRIMARY KEY,
  role text NOT NULL DEFAULT 'student',
  status text NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL DEFAULT '190707',
  phone text,
  field text,
  target_university text,
  target_department text,
  target_rank text,
  coaching_specialty text,
  coach_code text,
  assigned_coach_id text,
  assigned_coach_name text,
  approval_date timestamptz,
  notes_by_admin text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_users_email ON public.system_users(email);
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to system_users" ON public.system_users;
CREATE POLICY "Public full access to system_users"
  ON public.system_users FOR ALL
  USING (true)
  WITH CHECK (true);

-- 1. YANLIŞ SORU BANKASI (HATA KASASI)
CREATE TABLE IF NOT EXISTS public.wrong_questions (
  id text PRIMARY KEY DEFAULT ('wq-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6)),
  student_id text NOT NULL,
  image_url text,
  raw_text text,
  exam_type text DEFAULT 'TYT',
  subject text NOT NULL,
  topic text NOT NULL,
  subtopic text,
  error_type text NOT NULL DEFAULT 'bilgi_eksikligi',
  difficulty text DEFAULT 'orta',
  ai_explanation text,
  study_tip text,
  student_note text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wrong_questions_student ON public.wrong_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_created ON public.wrong_questions(created_at DESC);

ALTER TABLE public.wrong_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to wrong_questions" ON public.wrong_questions;
CREATE POLICY "Public full access to wrong_questions"
  ON public.wrong_questions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. SUPABASE STORAGE (SORU FOTOĞRAFLARI İÇİN BUCKET)
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read question-images" ON storage.objects;
CREATE POLICY "Public read question-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'question-images');

DROP POLICY IF EXISTS "Public insert question-images" ON storage.objects;
CREATE POLICY "Public insert question-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'question-images');

DROP POLICY IF EXISTS "Public update question-images" ON storage.objects;
CREATE POLICY "Public update question-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'question-images');

DROP POLICY IF EXISTS "Public delete question-images" ON storage.objects;
CREATE POLICY "Public delete question-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'question-images');

-- 3. ÇALIŞMA LOGLARI (STUDY SESSIONS)
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id text PRIMARY KEY DEFAULT ('ss-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6)),
  student_id text NOT NULL,
  subject text NOT NULL,
  topic text,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes int DEFAULT 0,
  source text DEFAULT 'timer',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_student ON public.study_sessions(student_id);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to study_sessions" ON public.study_sessions;
CREATE POLICY "Public full access to study_sessions"
  ON public.study_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. KRONOMETRE ZAMAN LOGLARI (TIME LOGS)
CREATE TABLE IF NOT EXISTS public.time_logs (
  id text PRIMARY KEY DEFAULT ('tlog-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6)),
  student_id text NOT NULL,
  type text NOT NULL DEFAULT 'study',
  subject text,
  topic text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_logs_student ON public.time_logs(student_id);
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to time_logs" ON public.time_logs;
CREATE POLICY "Public full access to time_logs"
  ON public.time_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. KİTAP TAKİP (STUDENT BOOKS)
CREATE TABLE IF NOT EXISTS public.student_books (
  id text PRIMARY KEY,
  student_id text NOT NULL,
  title text NOT NULL,
  publisher text,
  exam_type text DEFAULT 'TYT',
  subject text NOT NULL,
  total_questions int DEFAULT 0,
  solved_questions int DEFAULT 0,
  correct_count int DEFAULT 0,
  wrong_count int DEFAULT 0,
  empty_count int DEFAULT 0,
  status text DEFAULT 'in_progress',
  topics_progress jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_books_student ON public.student_books(student_id);
ALTER TABLE public.student_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to student_books" ON public.student_books;
CREATE POLICY "Public full access to student_books"
  ON public.student_books FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. DENEME SINAVLARI (EXAMS)
CREATE TABLE IF NOT EXISTS public.exams (
  id text PRIMARY KEY,
  student_id text NOT NULL,
  exam_name text NOT NULL,
  exam_type text NOT NULL,
  exam_date date NOT NULL,
  total_net numeric DEFAULT 0,
  target_net numeric,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exam_subject_results (
  id text PRIMARY KEY,
  exam_id text NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject text NOT NULL,
  correct numeric DEFAULT 0,
  wrong numeric DEFAULT 0,
  blank numeric DEFAULT 0,
  net numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.exam_topic_results (
  id text PRIMARY KEY,
  exam_id text NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  wrong_count int DEFAULT 0
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_topic_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to exams" ON public.exams;
CREATE POLICY "Public full access to exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to exam_subject_results" ON public.exam_subject_results;
CREATE POLICY "Public full access to exam_subject_results" ON public.exam_subject_results FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to exam_topic_results" ON public.exam_topic_results;
CREATE POLICY "Public full access to exam_topic_results" ON public.exam_topic_results FOR ALL USING (true) WITH CHECK (true);

-- 7. HAFTALIK ÇALIŞMA PROGRAMI (STUDY PROGRAMS & ITEMS)
CREATE TABLE IF NOT EXISTS public.study_programs (
  id text PRIMARY KEY,
  student_id text NOT NULL,
  title text NOT NULL,
  week_start_date date,
  week_end_date date,
  coach_id text,
  coach_notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.program_items (
  id text PRIMARY KEY,
  program_id text NOT NULL REFERENCES public.study_programs(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  target_questions int DEFAULT 0,
  target_duration_minutes int DEFAULT 0,
  completed_questions int DEFAULT 0,
  completed_duration_minutes int DEFAULT 0,
  is_completed boolean DEFAULT false,
  order_index int DEFAULT 0,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_study_programs_student ON public.study_programs(student_id);
CREATE INDEX IF NOT EXISTS idx_program_items_program ON public.program_items(program_id);

ALTER TABLE public.study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to study_programs" ON public.study_programs;
CREATE POLICY "Public full access to study_programs" ON public.study_programs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to program_items" ON public.program_items;
CREATE POLICY "Public full access to program_items" ON public.program_items FOR ALL USING (true) WITH CHECK (true);

-- 8. BAŞARI ROZETLERİ VE GÜNLÜK SERİLER (BADGES & STREAKS)
CREATE TABLE IF NOT EXISTS public.badges (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  tier text NOT NULL,
  icon_name text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  xp_points integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  badge_id text NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  is_unlocked boolean NOT NULL DEFAULT false,
  progress_current integer NOT NULL DEFAULT 0,
  progress_target integer NOT NULL DEFAULT 1,
  earned_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id text PRIMARY KEY,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_study_date date,
  total_active_days integer NOT NULL DEFAULT 0,
  streak_freeze_count integer NOT NULL DEFAULT 2,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to badges" ON public.badges;
CREATE POLICY "Public full access to badges" ON public.badges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to user_badges" ON public.user_badges;
CREATE POLICY "Public full access to user_badges" ON public.user_badges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to user_streaks" ON public.user_streaks;
CREATE POLICY "Public full access to user_streaks" ON public.user_streaks FOR ALL USING (true) WITH CHECK (true);

-- 9. KOÇLUK GÖRÜŞME NOTLARI (COACHING NOTES)
CREATE TABLE IF NOT EXISTS public.coaching_notes (
  id text PRIMARY KEY DEFAULT ('cn-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6)),
  student_id text NOT NULL,
  coach_id text NOT NULL,
  meeting_date date DEFAULT CURRENT_DATE,
  title text NOT NULL,
  content text NOT NULL,
  action_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.coaching_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to coaching_notes" ON public.coaching_notes;
CREATE POLICY "Public full access to coaching_notes" ON public.coaching_notes FOR ALL USING (true) WITH CHECK (true);

