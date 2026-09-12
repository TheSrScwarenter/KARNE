-- ==============================================================================
-- KARNE - YKS ÇALIŞMA TAKİP PLATFORMU (v2.2)
-- MIGRATION 0005: Yanlış Soru Bankası Supabase Doğrudan Veritabanı ve Medya Eşitlemesi
-- ==============================================================================

-- 1. wrong_questions tablosunun esnek ID ve yeni kolonlarla güçlendirilmesi
DO $$
BEGIN
  -- Eğer tablo yoksa doğrudan text tabanlı modern şemayla oluştur
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wrong_questions') THEN
    CREATE TABLE public.wrong_questions (
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
  ELSE
    -- Tablo varsa eksik kolonları ekle
    ALTER TABLE public.wrong_questions ADD COLUMN IF NOT EXISTS exam_type text DEFAULT 'TYT';
    ALTER TABLE public.wrong_questions ADD COLUMN IF NOT EXISTS study_tip text;
    -- Foreign key varsa ve uuid kısıtı varsa serbest bırak
    ALTER TABLE public.wrong_questions DROP CONSTRAINT IF EXISTS wrong_questions_student_id_fkey;
    ALTER TABLE public.wrong_questions ALTER COLUMN student_id TYPE text;
    ALTER TABLE public.wrong_questions ALTER COLUMN id TYPE text;
  END IF;
END $$;

-- 2. İndeksler
CREATE INDEX IF NOT EXISTS idx_wrong_questions_student ON public.wrong_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_created ON public.wrong_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject_topic ON public.wrong_questions(subject, topic);

-- 3. Row Level Security & İzinler
ALTER TABLE public.wrong_questions ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları güvenli şekilde güncelle
DROP POLICY IF EXISTS "Public full access to wrong_questions" ON public.wrong_questions;
CREATE POLICY "Public full access to wrong_questions"
  ON public.wrong_questions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Supabase Storage: question-images kovası oluşturma
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage kova erişim politikaları
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
