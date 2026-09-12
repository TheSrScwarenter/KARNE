/**
 * KARNE - YKS Çalışma Takip ve Yönetim Platformu (v2.0)
 * Type Definitions
 */

export type UserRole = 'student' | 'coach' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'rejected' | 'suspended';

export interface UserProfile {
  id: string;
  role: UserRole;
  status?: AccountStatus;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  field?: 'SAY' | 'EA' | 'SÖZ' | 'DİL' | null;
  target_university?: string | null;
  target_department?: string | null;
  target_rank?: string | null;
  coaching_specialty?: string | null;
  coach_code?: string | null;
  assigned_coach_id?: string | null;
  assigned_coach_name?: string | null;
  approval_date?: string | null;
  notes_by_admin?: string | null;
  weekly_target_minutes?: number | null;
  created_at: string;
}

export type LinkStatus = 'pending' | 'approved' | 'revoked';

export interface CoachStudentLink {
  id: string;
  coach_id: string;
  student_id: string;
  status: LinkStatus;
  invite_code?: string | null;
  created_at: string;
  student_profile?: UserProfile;
  coach_profile?: UserProfile;
}

export type ErrorType =
  | 'bilgi_eksikligi'
  | 'dikkatsizlik'
  | 'zaman_yetersizligi'
  | 'kavram_yanilgisi'
  | 'soru_tipi_yanlis_anlama';

export type QuestionDifficulty = 'kolay' | 'orta' | 'zor';

export interface WrongQuestion {
  id: string;
  student_id: string;
  image_url?: string | null;
  raw_text?: string | null;
  exam_type?: 'TYT' | 'AYT' | 'Genel';
  subject: string;
  topic: string;
  subtopic?: string | null;
  error_type: ErrorType;
  difficulty: QuestionDifficulty;
  ai_explanation?: string | null;
  study_tip?: string | null;
  student_note?: string | null;
  created_at: string;
}

export interface WrongQuestionsAnalysisReport {
  generated_at: string;
  total_questions_analyzed: number;
  weak_topics: {
    subject: string;
    topic: string;
    exam_type?: string;
    count: number;
    primary_error_type: ErrorType;
    severity: 'kritik' | 'orta' | 'hafif';
    study_action: string;
  }[];
  error_type_distribution: {
    error_type: ErrorType;
    label: string;
    count: number;
    percentage: number;
  }[];
  strategic_insights: string[];
  recommended_focus_area: string;
}

export type TimeLogType = 'study' | 'break';

export interface TimeLogEntry {
  id: string;
  student_id: string;
  type: TimeLogType;
  subject?: string;
  topic?: string;
  start_time: string; // ISO string with hour/minute
  end_time: string;   // ISO string with hour/minute
  duration_minutes: number;
  note?: string;
  created_at: string;
}

export type SessionSource = 'timer' | 'manual';

export interface StudySession {
  id: string;
  student_id: string;
  subject: string;
  topic?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_minutes: number;
  source: SessionSource;
  created_at: string;
}

export type ExamType = 'TYT' | 'AYT' | 'branş';

export interface Exam {
  id: string;
  student_id: string;
  exam_name: string;
  exam_type: ExamType;
  exam_date: string;
  created_at: string;
  subject_results?: ExamSubjectResult[];
  topic_results?: ExamTopicResult[];
}

export interface ExamSubjectResult {
  id: string;
  exam_id: string;
  subject: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
}

export interface ExamTopicResult {
  id: string;
  exam_id: string;
  subject: string;
  topic: string;
  wrong_count: number;
}

export type ProgramStatus = 'active' | 'archived';
export type ProgramGeneratedBy = 'ai' | 'coach' | 'student';

export interface StudyProgram {
  id: string;
  student_id: string;
  title?: string;
  week_start_date: string;
  status: ProgramStatus;
  generated_by: ProgramGeneratedBy;
  notes?: string;
  created_at: string;
  items?: ProgramItem[];
}

export interface ProgramItem {
  id: string;
  program_id: string;
  day_of_week: number; // 0: Pazartesi ... 6: Pazar (veya 1-7)
  start_time?: string;
  end_time?: string;
  subject: string;
  topic: string;
  ai_reasoning?: string | null;
  coach_notes?: string | null;
  target_questions?: number | null;
  completed?: boolean;
  generated_by?: ProgramGeneratedBy;
}

export interface CoachNote {
  id: string;
  coach_id: string;
  student_id: string;
  content: string;
  created_at: string;
  coach_name?: string;
}

export type BookStatus = 'not_started' | 'in_progress' | 'completed';
export type BookTopicStatus = 'not_started' | 'in_progress' | 'completed';
export type BookDifficulty = 'kolay' | 'orta' | 'zor' | 'derece';

export interface BookTopicProgress {
  id: string;
  topic_name: string;
  status: BookTopicStatus;
  completed_tests_count?: number;
  total_tests_count?: number;
  note?: string;
  completed_at?: string | null;
}

export interface StudentBook {
  id: string;
  student_id: string;
  title: string;
  publisher: string;
  exam_type: 'TYT' | 'AYT' | 'TYT-AYT';
  subject: string;
  difficulty?: BookDifficulty;
  total_questions?: number;
  status: BookStatus;
  target_completion_date?: string | null;
  student_notes?: string | null;
  created_at: string;
  updated_at: string;
  topics: BookTopicProgress[];
  // Calculated helpers
  completion_percentage?: number;
  completed_topics_count?: number;
  total_topics_count?: number;
}

// =============================================================================
// Başarı Rozetleri (Achievement Badges) ve Günlük Seri (Streak) Tipleri
// =============================================================================

export type BadgeCategory = 'all' | 'streak' | 'study_time' | 'books' | 'exams' | 'questions' | 'special';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'streak' | 'study_time' | 'books' | 'exams' | 'questions' | 'special';
  tier: BadgeTier;
  icon_name: string;
  requirement_type: string;
  requirement_value: number;
  xp_points: number;
  created_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge: Badge;
  is_unlocked: boolean;
  progress_current: number;
  progress_target: number;
  earned_at?: string | null;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  total_active_days: number;
  is_studied_today: boolean;
  streak_freezes_left: number;
  recent_activity_days: { date: string; studied: boolean; minutes: number; dayName: string }[];
}

export interface UserLevelInfo {
  level: number;
  level_title: string;
  current_xp: number;
  next_level_xp: number;
  progress_percentage: number;
  badges_unlocked_count: number;
  total_badges_count: number;
}

export interface UserProfileStats {
  streak: StreakInfo;
  level: UserLevelInfo;
  total_study_minutes: number;
  total_study_hours: number;
  completed_topics_count: number;
  total_exams_count: number;
  highest_exam_net: number;
  wrong_questions_count: number;
  weekly_target_minutes: number;
  this_week_study_minutes: number;
  this_week_target_percentage: number;
}

// =============================================================================
// Koçluk İletişimi (Mesajlaşma, Randevu & Ödevler) Tipleri
// =============================================================================

export interface CoachingMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_role: 'student' | 'coach' | 'admin';
  receiver_id: string;
  student_id: string;
  message_text: string;
  image_url?: string | null;
  audio_url?: string | null;
  question_reference_id?: string | null;
  subject?: string | null;
  is_read: boolean;
  created_at: string;
}

export type AppointmentStatus = 'available' | 'booked' | 'completed' | 'cancelled';

export interface CoachingAppointment {
  id: string;
  coach_id: string;
  coach_name?: string;
  student_id?: string | null;
  student_name?: string | null;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // '18:00'
  end_time: string; // '18:30'
  duration_minutes: number;
  meeting_title: string;
  meeting_link?: string | null;
  status: AppointmentStatus;
  student_note?: string | null;
  coach_feedback?: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'verified';

export interface CoachingTask {
  id: string;
  coach_id: string;
  coach_name?: string;
  student_id: string;
  student_name?: string;
  title: string;
  description?: string | null;
  subject: string;
  target_question_count?: number | null;
  target_book_title?: string | null;
  target_book?: string | null;
  due_date: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  completion_notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Yapay Zeka & Akıllı Analiz Destekleri (AI Radar & Rank Simulator)
// =============================================================================

export interface PredictedRankBand {
  exam_type: 'TYT' | 'AYT' | 'YKS_SAY' | 'YKS_EA' | 'YKS_SOZ';
  average_tyt_net: number;
  average_ayt_net: number;
  estimated_raw_score: number;
  estimated_placement_score: number;
  best_rank: number;
  likely_rank: number;
  worst_rank: number;
  confidence_level: 'low' | 'medium' | 'high';
  exam_count_analyzed: number;
  trend_direction: 'improving' | 'stable' | 'declining';
  historical_comparison_year: string;
}

export interface WeakTopicDiagnosis {
  subject: string;
  topic_name: string;
  exam_type: 'TYT' | 'AYT';
  urgency: 'critical' | 'high' | 'moderate';
  error_frequency: number;
  wrong_questions_count: number;
  book_topic_status?: 'not_started' | 'in_progress' | 'completed';
  primary_error_reason: string; // 'Kavram/Bilgi Eksikliği', 'Soru Kökü Dikkatsizliği', etc.
  recommended_action: string;
  estimated_net_gain: number;
}

// =============================================================================
// TYT & AYT Konu/Kazanım Bazlı Isı Haritası (Topic Mastery Matrix)
// =============================================================================

export type MasteryLevel = 'critical' | 'learning' | 'competent' | 'mastered';

export interface TopicMasteryItem {
  id: string;
  subject: string;
  exam_type: 'TYT' | 'AYT';
  topic_name: string;
  importance_tier: 'high' | 'medium' | 'standard'; // ÖSYM soru çıkma sıklığı
  mastery_percentage: number; // 0 - 100
  mastery_level: MasteryLevel;
  total_questions_solved: number;
  wrong_questions_count: number;
  book_status: 'not_started' | 'in_progress' | 'completed';
  last_practiced_at?: string | null;
  ai_tip?: string;
}

export interface SubjectMasterySummary {
  subject: string;
  exam_type: 'TYT' | 'AYT';
  topics_count: number;
  completed_topics_count: number;
  average_mastery_percentage: number;
  total_wrong_count: number;
  critical_topics_count: number;
}

// =============================================================================
// Akıllı Deneme Hedefleyici & Sıralama Simülatörü
// =============================================================================

export interface SimulatedNetValues {
  field: 'SAY' | 'EA' | 'SOZ' | 'DIL';
  obp_score: number; // 50 - 100
  // TYT (120 Soru)
  tyt_turkish: number; // Max 40
  tyt_social: number; // Max 20
  tyt_math: number; // Max 40
  tyt_science: number; // Max 20
  // AYT SAY (80 Soru)
  ayt_math: number; // Max 40
  ayt_physics: number; // Max 14
  ayt_chemistry: number; // Max 13
  ayt_biology: number; // Max 13
  // AYT EA / SÖZ
  ayt_literature: number; // Max 24
  ayt_history1: number; // Max 10
  ayt_geography1: number; // Max 6
  ayt_history2?: number; // Max 11
  ayt_geography2?: number; // Max 11
  ayt_philosophy?: number; // Max 12
  ayt_religion?: number; // Max 6
  // AYT DİL
  ydt_language?: number; // Max 80
}

export interface TargetUniversityBenchmark {
  id: string;
  university_name: string;
  department_name: string;
  city: string;
  field: 'SAY' | 'EA' | 'SOZ' | 'DIL';
  target_rank_2025: number;
  target_placement_score: number;
  base_nets: {
    tyt_total: number;
    ayt_total: number;
    tyt_breakdown: { turkish: number; social: number; math: number; science: number };
    ayt_breakdown: Record<string, number>;
  };
  faculty_badge: string;
}

export interface SimulatedRankResult {
  tyt_total_net: number;
  ayt_total_net: number;
  raw_score: number;
  placement_score: number;
  best_rank: number;
  likely_rank: number;
  worst_rank: number;
  field: 'SAY' | 'EA' | 'SOZ' | 'DIL';
  net_prescriptions: {
    subject: string;
    current_net: number;
    target_net: number;
    net_gap: number;
    estimated_points_gain: number;
    priority: 'high' | 'medium' | 'bonus';
  }[];
}

// =============================================================================
// Haftalık Lig & Motivasyon Rozetleri (Gamification)
// =============================================================================

export type LeagueTier = 'champions' | 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';

export interface LeagueLeaderboardUser {
  id: string;
  rank_position: number;
  name: string;
  avatar_initials: string;
  avatar_color: string;
  field: 'SAY' | 'EA' | 'SOZ' | 'DIL';
  target_department?: string;
  weekly_study_minutes: number;
  weekly_study_hours: number;
  weekly_xp: number;
  streak_days: number;
  is_current_user: boolean;
  is_bot?: boolean;
  movement: 'up' | 'down' | 'same';
  movement_count?: number;
  status_zone: 'promotion' | 'safe' | 'relegation';
}

export interface LeagueBotConfig {
  id: string;
  name: string;
  field: 'SAY' | 'EA' | 'SOZ' | 'DIL';
  target_department: string;
  league_tier: LeagueTier;
  behavior_mode: 'daily_xp' | 'target_rank';
  daily_xp_rate: number; // e.g. 180 XP/day
  target_rank_position?: number; // e.g. 2nd place
  streak_days: number;
  is_active: boolean;
  avatar_color: string;
  created_at: string;
}

export interface WeeklyLeagueInfo {
  league_tier: LeagueTier;
  league_name: string;
  league_icon: string;
  week_number: number;
  days_left_in_week: number;
  total_participants: number;
  user_current_rank: number;
  user_weekly_xp: number;
  promotion_rank_cutoff: number;
  relegation_rank_cutoff: number;
  users: LeagueLeaderboardUser[];
}

