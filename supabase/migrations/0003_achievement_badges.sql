-- ==============================================================================
-- KARNE - YKS ÇALIŞMA TAKİP PLATFORMU (v2.0)
-- MIGRATION 0003: Başarı Rozetleri (Achievement Badges) ve Günlük Seri (Streak) Sistemi
-- ==============================================================================

-- 1. Rozet Tanımları Tablosu (Badges Catalog)
CREATE TABLE IF NOT EXISTS public.badges (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('streak', 'study_time', 'books', 'exams', 'questions', 'special')),
  tier text NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
  icon_name text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  xp_points integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Kullanıcı Rozet Kazanımları Tablosu (User Badges)
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

-- 3. Kullanıcı Günlük Seri & İstatistik Tablosu (User Streaks & Stats)
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

-- 4. İndeksler
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON public.user_badges(user_id, is_unlocked);
CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);

-- 5. Başlangıç Rozet Verileri (Seed Badges)
INSERT INTO public.badges (id, code, title, description, category, tier, icon_name, requirement_type, requirement_value, xp_points)
VALUES
  -- Streak (Seri) Rozetleri
  ('badge-streak-1', 'streak_1', 'İlk Kıvılcım', 'İlk çalışma oturumunu tamamla ve seriyi başlat.', 'streak', 'bronze', 'Flame', 'streak_days', 1, 50),
  ('badge-streak-3', 'streak_3', 'Isınma Turu', 'Üst üste 3 gün boyunca ara vermeden çalış.', 'streak', 'bronze', 'Flame', 'streak_days', 3, 100),
  ('badge-streak-7', 'streak_7', 'Haftalık İstikrar', '7 gün boyunca aralıksız her gün çalışarak disiplinini kanıtla.', 'streak', 'silver', 'Zap', 'streak_days', 7, 250),
  ('badge-streak-14', 'streak_14', 'Demir İrade', '14 gün aralıksız çalışma serisini koru.', 'streak', 'gold', 'ShieldCheck', 'streak_days', 14, 500),
  ('badge-streak-30', 'streak_30', 'Aylık Şampiyon', '30 gün kesintisiz çalışma serisine ulaşarak YKS zirvesine yaklaş.', 'streak', 'diamond', 'Crown', 'streak_days', 30, 1200),
  ('badge-streak-60', 'streak_60', 'YKS Efsanesi', 'Tam 60 gün boyunca her gün en az 1 oturum çalışarak rekora koş.', 'streak', 'diamond', 'Trophy', 'streak_days', 60, 2500),

  -- Study Time (Çalışma Süresi) Rozetleri
  ('badge-time-5h', 'time_5h', 'Odak Çırağı', 'Toplam 5 saatlik odaklanmış çalışma süresine ulaş.', 'study_time', 'bronze', 'Clock', 'study_hours', 5, 75),
  ('badge-time-25h', 'time_25h', 'Zaman Yönetmeni', 'Toplam 25 saat verimli çalışma kaydı oluştur.', 'study_time', 'silver', 'Timer', 'study_hours', 25, 200),
  ('badge-time-100h', 'time_100h', '100 Saat Kulübü', 'Toplam 100 saatlik devasa çalışma hacmini tamamla.', 'study_time', 'gold', 'Award', 'study_hours', 100, 750),
  ('badge-time-250h', 'time_250h', 'Master Maratoncu', 'Toplam 250 saatlik çalışma maratonunu geride bırak.', 'study_time', 'diamond', 'Medal', 'study_hours', 250, 2000),

  -- Books & Topics (Kitap & Konu Tamamlama) Rozetleri
  ('badge-topic-1', 'topic_1', 'İlk Fetih', 'İlk YKS konusunu tam başarıyla bitir ve tikle.', 'books', 'bronze', 'CheckCircle2', 'topics_completed', 1, 50),
  ('badge-topic-10', 'topic_10', 'Konu Avcısı', 'Soru bankalarından 10 farklı konuyu tamamen bitir.', 'books', 'silver', 'BookOpen', 'topics_completed', 10, 250),
  ('badge-topic-30', 'topic_30', 'Müfredat Hakimi', '30 konuyu tüm alt testleriyle tamamlayarak eksiklerini kapat.', 'books', 'gold', 'GraduationCap', 'topics_completed', 30, 600),
  ('badge-book-1', 'book_1', 'Kitap Bitirici', 'En az 1 adet soru bankasını baştan sona %100 bitir.', 'books', 'gold', 'Library', 'books_completed', 1, 500),

  -- Exams (Deneme Sınavları & Netler) Rozetleri
  ('badge-exam-1', 'exam_1', 'Er Meydanı', 'İlk deneme sınavı sonucunu sisteme kaydet.', 'exams', 'bronze', 'FileText', 'exams_taken', 1, 50),
  ('badge-exam-5', 'exam_5', 'Deneme Savaşçısı', '5 farklı deneme sınavına girerek net analizini takip et.', 'exams', 'silver', 'BarChart3', 'exams_taken', 5, 200),
  ('badge-exam-net-80', 'net_80', '80 Net Eşiği', 'TYT veya AYT denemesinde 80+ net başarısı yakala.', 'exams', 'gold', 'TrendingUp', 'max_net', 80, 400),
  ('badge-exam-net-100', 'net_100', '100 Net Kulübü', 'Denemede 100 net sınırını aşarak derece bandına gir.', 'exams', 'diamond', 'Sparkles', 'max_net', 100, 1000),

  -- Wrong Questions (Hata Analizi) Rozetleri
  ('badge-wq-5', 'wq_5', 'Hatasını Seven', '5 yanlış soruyu teşhis ederek yanlış soru havuzuna ekle.', 'questions', 'bronze', 'HelpCircle', 'wrong_questions', 5, 100),
  ('badge-wq-20', 'wq_20', 'Soru Dedektifi', '20 yanlış sorunun hata nedenlerini (bilgi, dikkatsizlik) analiz et.', 'questions', 'silver', 'Search', 'wrong_questions', 20, 300),

  -- Special & Goals (Hedef & Koçluk) Rozetleri
  ('badge-goal-weekly', 'goal_weekly', 'Hedef Avcısı', 'Haftalık belirlenen çalışma süresi hedefini %100 tamamla.', 'special', 'silver', 'Target', 'weekly_goal_met', 1, 200),
  ('badge-focus-master', 'focus_master', 'Kesintisiz Odak', 'Tek seferde 60 dakika veya üzeri kesintisiz odak seansı yap.', 'special', 'gold', 'Flame', 'single_focus_60m', 1, 300)
ON CONFLICT (code) DO NOTHING;
