-- ==============================================================================
-- KARNE - YKS ÇALIŞMA TAKİP PLATFORMU
-- MIGRATION 0001: Initial Schema & Row Level Security (RLS)
-- FAZ 1/6: Proje Kurulumu, Auth, Veritabanı, İskelet
-- ==============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS PROFILE
CREATE TABLE IF NOT EXISTS public.users_profile (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text CHECK (role IN ('student', 'coach')) NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now()
);

-- 2. COACH STUDENT LINKS (Öğrenci - Koç Bağlantıları)
CREATE TABLE IF NOT EXISTS public.coach_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'approved', 'revoked')) DEFAULT 'pending',
  invite_code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 3. WRONG QUESTIONS (Yanlış Soru Bankası)
CREATE TABLE IF NOT EXISTS public.wrong_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  image_url text,
  raw_text text,
  subject text,
  topic text,
  subtopic text,
  error_type text CHECK (error_type IN (
    'bilgi_eksikligi',
    'dikkatsizlik',
    'zaman_yetersizligi',
    'kavram_yanilgisi',
    'soru_tipi_yanlis_anlama'
  )),
  difficulty text CHECK (difficulty IN ('kolay', 'orta', 'zor')),
  ai_explanation text,
  student_note text,
  created_at timestamptz DEFAULT now()
);

-- 4. STUDY SESSIONS (Çalışma Logları)
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  subject text,
  topic text,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes int,
  source text CHECK (source IN ('timer', 'manual')),
  created_at timestamptz DEFAULT now()
);

-- 5. EXAMS (Deneme Sınavları)
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  exam_name text,
  exam_type text CHECK (exam_type IN ('TYT', 'AYT', 'branş')),
  exam_date date,
  created_at timestamptz DEFAULT now()
);

-- 6. EXAM SUBJECT RESULTS (Deneme Ders Sonuçları)
CREATE TABLE IF NOT EXISTS public.exam_subject_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  subject text,
  correct numeric DEFAULT 0,
  wrong numeric DEFAULT 0,
  blank numeric DEFAULT 0,
  net numeric DEFAULT 0
);

-- 7. EXAM TOPIC RESULTS (Deneme Konu Sonuçları)
CREATE TABLE IF NOT EXISTS public.exam_topic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  subject text,
  topic text,
  wrong_count int DEFAULT 0
);

-- 8. STUDY PROGRAMS (Çalışma Programları)
CREATE TABLE IF NOT EXISTS public.study_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  week_start_date date,
  status text CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  generated_by text CHECK (generated_by IN ('ai', 'coach', 'student')),
  created_at timestamptz DEFAULT now()
);

-- 9. PROGRAM ITEMS (Program Gün & Saat Öğeleri)
CREATE TABLE IF NOT EXISTS public.program_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.study_programs(id) ON DELETE CASCADE NOT NULL,
  day_of_week int CHECK (day_of_week BETWEEN 1 AND 7),
  start_time time,
  end_time time,
  subject text,
  topic text,
  ai_reasoning text
);

-- 10. COACH NOTES (Koç Notları ve Değerlendirmeleri)
CREATE TABLE IF NOT EXISTS public.coach_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wrong_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_topic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to check if authenticated user is approved coach for a student
CREATE OR REPLACE FUNCTION public.is_approved_coach_for(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.coach_student_links
    WHERE coach_id = auth.uid()
      AND student_id = p_student_id
      AND status = 'approved'
  );
$$;

-- Helper function to check if authenticated user is approved student for a coach
CREATE OR REPLACE FUNCTION public.is_approved_student_for(p_coach_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.coach_student_links
    WHERE student_id = auth.uid()
      AND coach_id = p_coach_id
      AND status = 'approved'
  );
$$;

-- ------------------------------------------------------------------------------
-- USERS PROFILE POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON public.users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Coaches can view approved students profiles"
  ON public.users_profile FOR SELECT
  USING (public.is_approved_coach_for(id));

CREATE POLICY "Students can view approved coach profile"
  ON public.users_profile FOR SELECT
  USING (public.is_approved_student_for(id));

CREATE POLICY "Allow authenticated user to insert their own profile"
  ON public.users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- COACH STUDENT LINKS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students and coaches can view their links"
  ON public.coach_student_links FOR SELECT
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "Coaches can create invite links"
  ON public.coach_student_links FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches and students can update links (approve/revoke)"
  ON public.coach_student_links FOR UPDATE
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

-- ------------------------------------------------------------------------------
-- WRONG QUESTIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students have full control over their wrong questions"
  ON public.wrong_questions FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Approved coaches can view students wrong questions"
  ON public.wrong_questions FOR SELECT
  USING (public.is_approved_coach_for(student_id));

-- ------------------------------------------------------------------------------
-- STUDY SESSIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students have full control over their study sessions"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Approved coaches can view students study sessions"
  ON public.study_sessions FOR SELECT
  USING (public.is_approved_coach_for(student_id));

-- ------------------------------------------------------------------------------
-- EXAMS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students have full control over their exams"
  ON public.exams FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Approved coaches can view students exams"
  ON public.exams FOR SELECT
  USING (public.is_approved_coach_for(student_id));

-- ------------------------------------------------------------------------------
-- EXAM SUBJECT RESULTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students have full control over exam subject results"
  ON public.exam_subject_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_subject_results.exam_id 
      AND exams.student_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_subject_results.exam_id 
      AND exams.student_id = auth.uid()
  ));

CREATE POLICY "Approved coaches can view exam subject results"
  ON public.exam_subject_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_subject_results.exam_id 
      AND public.is_approved_coach_for(exams.student_id)
  ));

-- ------------------------------------------------------------------------------
-- EXAM TOPIC RESULTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students have full control over exam topic results"
  ON public.exam_topic_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_topic_results.exam_id 
      AND exams.student_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_topic_results.exam_id 
      AND exams.student_id = auth.uid()
  ));

CREATE POLICY "Approved coaches can view exam topic results"
  ON public.exam_topic_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_topic_results.exam_id 
      AND public.is_approved_coach_for(exams.student_id)
  ));

-- ------------------------------------------------------------------------------
-- STUDY PROGRAMS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students have full control over study programs"
  ON public.study_programs FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Approved coaches can view students study programs"
  ON public.study_programs FOR SELECT
  USING (public.is_approved_coach_for(student_id));

CREATE POLICY "Approved coaches can insert study programs for their students"
  ON public.study_programs FOR INSERT
  WITH CHECK (public.is_approved_coach_for(student_id));

CREATE POLICY "Approved coaches can update study programs for their students"
  ON public.study_programs FOR UPDATE
  USING (public.is_approved_coach_for(student_id));

-- ------------------------------------------------------------------------------
-- PROGRAM ITEMS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students have full control over their program items"
  ON public.program_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.study_programs 
    WHERE study_programs.id = program_items.program_id 
      AND study_programs.student_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.study_programs 
    WHERE study_programs.id = program_items.program_id 
      AND study_programs.student_id = auth.uid()
  ));

CREATE POLICY "Approved coaches can view and manage students program items"
  ON public.program_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.study_programs 
    WHERE study_programs.id = program_items.program_id 
      AND public.is_approved_coach_for(study_programs.student_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.study_programs 
    WHERE study_programs.id = program_items.program_id 
      AND public.is_approved_coach_for(study_programs.student_id)
  ));

-- ------------------------------------------------------------------------------
-- COACH NOTES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Coaches have full control over their notes"
  ON public.coach_notes FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Students can view notes written for them"
  ON public.coach_notes FOR SELECT
  USING (auth.uid() = student_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER (AUTH HOOK)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, role, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
