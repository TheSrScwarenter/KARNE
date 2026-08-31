-- ==============================================================================
-- KARNE - YKS ÇALIŞMA TAKİP PLATFORMU (v2.1)
-- MIGRATION 0004: Koçluk İletişimi (Mesajlar, Randevular, Ödevler) ve AI Analiz Şeması
-- ==============================================================================

-- 1. Birebir Canlı Mesajlaşma Tablosu (Chat & Question Messages)
CREATE TABLE IF NOT EXISTS public.coaching_messages (
  id text PRIMARY KEY,
  sender_id text NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('student', 'coach', 'admin')),
  receiver_id text NOT NULL,
  student_id text NOT NULL,
  message_text text NOT NULL,
  image_url text,
  audio_url text,
  question_reference_id text,
  subject text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Koçluk Randevu & Görüşme Takvimi Tablosu (Appointments)
CREATE TABLE IF NOT EXISTS public.coaching_appointments (
  id text PRIMARY KEY,
  coach_id text NOT NULL,
  student_id text,
  appointment_date date NOT NULL,
  start_time text NOT NULL, -- e.g. '18:00'
  end_time text NOT NULL,   -- e.g. '18:30'
  duration_minutes integer NOT NULL DEFAULT 30,
  meeting_title text NOT NULL DEFAULT 'Haftalık Koçluk Değerlendirmesi',
  meeting_link text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
  student_note text,
  coach_feedback text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ödev & Görev Atama Sistemi Tablosu (Assigned Tasks)
CREATE TABLE IF NOT EXISTS public.coaching_tasks (
  id text PRIMARY KEY,
  coach_id text NOT NULL,
  student_id text NOT NULL,
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  target_question_count integer,
  target_book_title text,
  due_date date NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'verified')),
  completion_notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. İndeksler
CREATE INDEX IF NOT EXISTS idx_coaching_msg_student ON public.coaching_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_msg_created ON public.coaching_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_coaching_app_coach ON public.coaching_appointments(coach_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_coaching_app_student ON public.coaching_appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_tasks_student ON public.coaching_tasks(student_id, status);
