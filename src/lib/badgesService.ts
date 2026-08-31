import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import {
  Badge,
  UserBadge,
  StreakInfo,
  UserLevelInfo,
  UserProfileStats,
} from '../types';
import { studySessionsService } from './studySessionsService';
import { booksService } from './booksService';
import { examsService } from './examsService';
import { wrongQuestionsService } from './wrongQuestionsService';
import { cloudStorage } from './cloudStorage';

const BADGES_CATALOG: Badge[] = [
  // 1. Streak (Seri) Rozetleri
  {
    id: 'badge-streak-1',
    code: 'streak_1',
    title: 'İlk Kıvılcım',
    description: 'İlk çalışma oturumunu tamamla ve seriyi başlat.',
    category: 'streak',
    tier: 'bronze',
    icon_name: 'Flame',
    requirement_type: 'streak_days',
    requirement_value: 1,
    xp_points: 50,
  },
  {
    id: 'badge-streak-3',
    code: 'streak_3',
    title: 'Isınma Turu',
    description: 'Üst üste 3 gün boyunca ara vermeden çalış.',
    category: 'streak',
    tier: 'bronze',
    icon_name: 'Flame',
    requirement_type: 'streak_days',
    requirement_value: 3,
    xp_points: 100,
  },
  {
    id: 'badge-streak-7',
    code: 'streak_7',
    title: 'Haftalık İstikrar',
    description: '7 gün boyunca aralıksız her gün çalışarak disiplinini kanıtla.',
    category: 'streak',
    tier: 'silver',
    icon_name: 'Zap',
    requirement_type: 'streak_days',
    requirement_value: 7,
    xp_points: 250,
  },
  {
    id: 'badge-streak-14',
    code: 'streak_14',
    title: 'Demir İrade',
    description: '14 gün aralıksız çalışma serisini koru.',
    category: 'streak',
    tier: 'gold',
    icon_name: 'ShieldCheck',
    requirement_type: 'streak_days',
    requirement_value: 14,
    xp_points: 500,
  },
  {
    id: 'badge-streak-30',
    code: 'streak_30',
    title: 'Aylık Şampiyon',
    description: '30 gün kesintisiz çalışma serisine ulaşarak YKS zirvesine yaklaş.',
    category: 'streak',
    tier: 'diamond',
    icon_name: 'Crown',
    requirement_type: 'streak_days',
    requirement_value: 30,
    xp_points: 1200,
  },
  {
    id: 'badge-streak-60',
    code: 'streak_60',
    title: 'YKS Efsanesi',
    description: 'Tam 60 gün boyunca her gün en az 1 oturum çalışarak rekora koş.',
    category: 'streak',
    tier: 'diamond',
    icon_name: 'Trophy',
    requirement_type: 'streak_days',
    requirement_value: 60,
    xp_points: 2500,
  },

  // 2. Study Time (Çalışma Süresi) Rozetleri
  {
    id: 'badge-time-5h',
    code: 'time_5h',
    title: 'Odak Çırağı',
    description: 'Toplam 5 saatlik odaklanmış çalışma süresine ulaş.',
    category: 'study_time',
    tier: 'bronze',
    icon_name: 'Clock',
    requirement_type: 'study_hours',
    requirement_value: 5,
    xp_points: 75,
  },
  {
    id: 'badge-time-25h',
    code: 'time_25h',
    title: 'Zaman Yönetmeni',
    description: 'Toplam 25 saat verimli çalışma kaydı oluştur.',
    category: 'study_time',
    tier: 'silver',
    icon_name: 'Timer',
    requirement_type: 'study_hours',
    requirement_value: 25,
    xp_points: 200,
  },
  {
    id: 'badge-time-100h',
    code: 'time_100h',
    title: '100 Saat Kulübü',
    description: 'Toplam 100 saatlik devasa çalışma hacmini tamamla.',
    category: 'study_time',
    tier: 'gold',
    icon_name: 'Award',
    requirement_type: 'study_hours',
    requirement_value: 100,
    xp_points: 750,
  },
  {
    id: 'badge-time-250h',
    code: 'time_250h',
    title: 'Master Maratoncu',
    description: 'Toplam 250 saatlik çalışma maratonunu geride bırak.',
    category: 'study_time',
    tier: 'diamond',
    icon_name: 'Medal',
    requirement_type: 'study_hours',
    requirement_value: 250,
    xp_points: 2000,
  },

  // 3. Books & Topics (Kitap & Konu Tamamlama) Rozetleri
  {
    id: 'badge-topic-1',
    code: 'topic_1',
    title: 'İlk Fetih',
    description: 'İlk YKS konusunu soru bankasından tamamlayıp tikle.',
    category: 'books',
    tier: 'bronze',
    icon_name: 'CheckCircle2',
    requirement_type: 'topics_completed',
    requirement_value: 1,
    xp_points: 50,
  },
  {
    id: 'badge-topic-10',
    code: 'topic_10',
    title: 'Konu Avcısı',
    description: 'Soru bankalarından 10 farklı konuyu tamamen bitir.',
    category: 'books',
    tier: 'silver',
    icon_name: 'BookOpen',
    requirement_type: 'topics_completed',
    requirement_value: 10,
    xp_points: 250,
  },
  {
    id: 'badge-topic-30',
    code: 'topic_30',
    title: 'Müfredat Hakimi',
    description: '30 konuyu tüm alt testleriyle tamamlayarak eksiklerini kapat.',
    category: 'books',
    tier: 'gold',
    icon_name: 'GraduationCap',
    requirement_type: 'topics_completed',
    requirement_value: 30,
    xp_points: 600,
  },
  {
    id: 'badge-book-1',
    code: 'book_1',
    title: 'Kitap Bitirici',
    description: 'En az 1 adet soru bankasını baştan sona %100 bitir.',
    category: 'books',
    tier: 'gold',
    icon_name: 'Library',
    requirement_type: 'books_completed',
    requirement_value: 1,
    xp_points: 500,
  },

  // 4. Exams (Deneme Sınavları & Netler) Rozetleri
  {
    id: 'badge-exam-1',
    code: 'exam_1',
    title: 'Er Meydanı',
    description: 'İlk deneme sınavı sonucunu sisteme kaydet.',
    category: 'exams',
    tier: 'bronze',
    icon_name: 'FileText',
    requirement_type: 'exams_taken',
    requirement_value: 1,
    xp_points: 50,
  },
  {
    id: 'badge-exam-5',
    code: 'exam_5',
    title: 'Deneme Savaşçısı',
    description: '5 farklı deneme sınavına girerek net analizini takip et.',
    category: 'exams',
    tier: 'silver',
    icon_name: 'BarChart3',
    requirement_type: 'exams_taken',
    requirement_value: 5,
    xp_points: 200,
  },
  {
    id: 'badge-exam-net-80',
    code: 'net_80',
    title: '80 Net Eşiği',
    description: 'TYT veya AYT denemesinde 80+ net başarısı yakala.',
    category: 'exams',
    tier: 'gold',
    icon_name: 'TrendingUp',
    requirement_type: 'max_net',
    requirement_value: 80,
    xp_points: 400,
  },
  {
    id: 'badge-exam-net-100',
    code: 'net_100',
    title: '100 Net Kulübü',
    description: 'Denemede 100 net sınırını aşarak derece bandına gir.',
    category: 'exams',
    tier: 'diamond',
    icon_name: 'Sparkles',
    requirement_type: 'max_net',
    requirement_value: 100,
    xp_points: 1000,
  },

  // 5. Wrong Questions (Hata Analizi) Rozetleri
  {
    id: 'badge-wq-5',
    code: 'wq_5',
    title: 'Hatasını Seven',
    description: '5 yanlış soruyu teşhis ederek soru havuzuna ekle.',
    category: 'questions',
    tier: 'bronze',
    icon_name: 'HelpCircle',
    requirement_type: 'wrong_questions',
    requirement_value: 5,
    xp_points: 100,
  },
  {
    id: 'badge-wq-20',
    code: 'wq_20',
    title: 'Soru Dedektifi',
    description: '20 yanlış sorunun hata nedenlerini analiz et.',
    category: 'questions',
    tier: 'silver',
    icon_name: 'Search',
    requirement_type: 'wrong_questions',
    requirement_value: 20,
    xp_points: 300,
  },

  // 6. Special & Goals (Hedef & Odak) Rozetleri
  {
    id: 'badge-goal-weekly',
    code: 'goal_weekly',
    title: 'Hedef Avcısı',
    description: 'Haftalık belirlenen çalışma süresi hedefini %100 tamamla.',
    category: 'special',
    tier: 'silver',
    icon_name: 'Target',
    requirement_type: 'weekly_goal_met',
    requirement_value: 1,
    xp_points: 200,
  },
  {
    id: 'badge-focus-master',
    code: 'focus_master',
    title: 'Kesintisiz Odak',
    description: 'Tek oturumda 60 dakika veya üzeri kesintisiz odak seansı yap.',
    category: 'special',
    tier: 'gold',
    icon_name: 'Flame',
    requirement_type: 'single_focus_60m',
    requirement_value: 1,
    xp_points: 300,
  },
];

const USER_BADGES_OVERRIDE_KEY = 'karne_user_badges_overrides_v1';

class BadgesService {
  public getAllBadges(): Badge[] {
    return BADGES_CATALOG;
  }

  // Calculate user's consecutive day streak from study sessions
  public async calculateStreak(studentId: string): Promise<StreakInfo> {
    const sessions = await studySessionsService.getSessions(studentId);

    // Group study session dates (YYYY-MM-DD)
    const datesSet = new Set<string>();
    const minutesByDate: Record<string, number> = {};

    sessions.forEach((s) => {
      if (s.start_time) {
        const dateStr = s.start_time.split('T')[0];
        datesSet.add(dateStr);
        minutesByDate[dateStr] = (minutesByDate[dateStr] || 0) + (s.duration_minutes || 0);
      }
    });

    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split('T')[0];
    const isStudiedToday = datesSet.has(todayStr);

    // Sort unique dates descending
    const sortedDates = Array.from(datesSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Calculate current streak
    let currentStreak = 0;
    const checkDate = new Date(todayObj);

    // If not studied today yet, start checking from yesterday
    if (!isStudiedToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const curStr = checkDate.toISOString().split('T')[0];
      if (datesSet.has(curStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak across history
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDateTime: number | null = null;

    // Ascending order for longest streak check
    const ascDates = Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    ascDates.forEach((dStr) => {
      const dTime = new Date(dStr).getTime();
      if (prevDateTime === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((dTime - prevDateTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      prevDateTime = dTime;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    });

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Build last 7 days activity preview
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const recentActivityDays: StreakInfo['recent_activity_days'] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayObj);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      recentActivityDays.push({
        date: dStr,
        studied: datesSet.has(dStr),
        minutes: minutesByDate[dStr] || 0,
        dayName: dayNames[d.getDay()],
      });
    }

    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_study_date: sortedDates[0] || null,
      total_active_days: datesSet.size,
      is_studied_today: isStudiedToday,
      streak_freezes_left: 2,
      recent_activity_days: recentActivityDays,
    };
  }

  // Calculate Level and XP based on earned badges & study stats
  public calculateLevelInfo(totalXp: number, unlockedBadgesCount: number): UserLevelInfo {
    // Level formula: Level = floor(sqrt(XP / 100)) + 1
    const level = Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1);

    // XP thresholds
    const currentLevelBaseXp = (level - 1) * (level - 1) * 100;
    const nextLevelTargetXp = level * level * 100;
    const xpInCurrentLevel = totalXp - currentLevelBaseXp;
    const xpNeededForNext = nextLevelTargetXp - currentLevelBaseXp;
    const progressPercentage = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / (xpNeededForNext || 1)) * 100)));

    const LEVEL_TITLES = [
      'Acemi Aday',
      'YKS Yolcusu',
      'İstikrarlı Çalışkan',
      'Odak Ustası',
      'Konu Fatihi',
      'Deneme Stratejisti',
      'Derece Adayı',
      'YKS Şampiyonu',
      'Master Bilge',
      'Efsanevi Derececi',
    ];

    const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

    return {
      level,
      level_title: levelTitle,
      current_xp: totalXp,
      next_level_xp: nextLevelTargetXp,
      progress_percentage: progressPercentage,
      badges_unlocked_count: unlockedBadgesCount,
      total_badges_count: BADGES_CATALOG.length,
    };
  }

  // Fetch all user badges with computed live progress and unlocks
  public async getUserBadges(studentId: string): Promise<UserBadge[]> {
    // Fetch live dependencies
    const [sessions, books, exams, wrongQuestions, weeklyTargetMinutes] = await Promise.all([
      studySessionsService.getSessions(studentId),
      booksService.getBooks(studentId),
      examsService.getExams(studentId),
      wrongQuestionsService.getQuestions(studentId),
      studySessionsService.getWeeklyTargetMinutes(studentId),
    ]);

    const streakInfo = await this.calculateStreak(studentId);

    // Calculate aggregated metrics
    const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const totalStudyHours = Math.floor(totalStudyMinutes / 60);

    // Completed topics count across books
    let completedTopicsCount = 0;
    let completedBooksCount = 0;
    books.forEach((b) => {
      if (b.status === 'completed') completedBooksCount++;
      b.topics?.forEach((t) => {
        if (t.status === 'completed') completedTopicsCount++;
      });
    });

    // Highest exam net
    let maxExamNet = 0;
    exams.forEach((ex) => {
      const net = examsService.calculateTotalNet(ex);
      if (net > maxExamNet) maxExamNet = net;
    });

    // Max single session duration
    const maxSingleSessionMinutes = sessions.reduce((max, s) => Math.max(max, s.duration_minutes || 0), 0);

    // This week's study minutes
    const weekStats = studySessionsService.getCurrentWeekStats(sessions);
    const isWeeklyGoalMet = weekStats.totalMinutes >= weeklyTargetMinutes && weeklyTargetMinutes > 0;

    // Load manual overrides / unlocked records
    const overrides = cloudStorage.getItem<Record<string, { earned_at: string }>>(
      `${USER_BADGES_OVERRIDE_KEY}_${studentId}`,
      {}
    );

    // Evaluate each badge
    const userBadges: UserBadge[] = BADGES_CATALOG.map((badge) => {
      let progressCurrent = 0;
      let progressTarget = badge.requirement_value;
      let isUnlocked = false;

      switch (badge.requirement_type) {
        case 'streak_days':
          progressCurrent = streakInfo.longest_streak;
          progressTarget = badge.requirement_value;
          isUnlocked = progressCurrent >= progressTarget;
          break;

        case 'study_hours':
          progressCurrent = totalStudyHours;
          progressTarget = badge.requirement_value;
          isUnlocked = progressCurrent >= progressTarget;
          break;

        case 'topics_completed':
          progressCurrent = completedTopicsCount;
          progressTarget = badge.requirement_value;
          isUnlocked = progressCurrent >= progressTarget;
          break;

        case 'books_completed':
          progressCurrent = completedBooksCount;
          progressTarget = badge.requirement_value;
          isUnlocked = progressCurrent >= progressTarget;
          break;

        case 'exams_taken':
          progressCurrent = exams.length;
          progressTarget = badge.requirement_value;
          isUnlocked = progressCurrent >= progressTarget;
          break;

        case 'max_net':
          progressCurrent = Math.round(maxExamNet);
          progressTarget = badge.requirement_value;
          isUnlocked = progressCurrent >= progressTarget;
          break;

        case 'wrong_questions':
          progressCurrent = wrongQuestions.length;
          progressTarget = badge.requirement_value;
          isUnlocked = progressCurrent >= progressTarget;
          break;

        case 'weekly_goal_met':
          progressCurrent = isWeeklyGoalMet ? 1 : 0;
          progressTarget = 1;
          isUnlocked = isWeeklyGoalMet;
          break;

        case 'single_focus_60m':
          progressCurrent = maxSingleSessionMinutes >= 60 ? 1 : 0;
          progressTarget = 1;
          isUnlocked = maxSingleSessionMinutes >= 60;
          break;

        default:
          isUnlocked = false;
      }

      // Check override
      if (overrides[badge.code]) {
        isUnlocked = true;
      }

      const earnedAt = isUnlocked
        ? overrides[badge.code]?.earned_at || '2026-08-15T10:00:00.000Z'
        : null;

      return {
        id: `ub-${studentId}-${badge.code}`,
        user_id: studentId,
        badge_id: badge.id,
        badge,
        is_unlocked: isUnlocked,
        progress_current: Math.min(progressCurrent, progressTarget),
        progress_target: progressTarget,
        earned_at: earnedAt,
      };
    });

    return userBadges;
  }

  // Get complete profile stats for student dashboard and profile page
  public async getUserProfileStats(studentId: string): Promise<UserProfileStats> {
    const [userBadges, streak, sessions, books, exams, wrongQuestions, weeklyTargetMinutes] = await Promise.all([
      this.getUserBadges(studentId),
      this.calculateStreak(studentId),
      studySessionsService.getSessions(studentId),
      booksService.getBooks(studentId),
      examsService.getExams(studentId),
      wrongQuestionsService.getQuestions(studentId),
      studySessionsService.getWeeklyTargetMinutes(studentId),
    ]);

    const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const totalStudyHours = Math.floor(totalStudyMinutes / 60);

    let completedTopicsCount = 0;
    books.forEach((b) => {
      b.topics?.forEach((t) => {
        if (t.status === 'completed') completedTopicsCount++;
      });
    });

    let highestExamNet = 0;
    exams.forEach((ex) => {
      const net = examsService.calculateTotalNet(ex);
      if (net > highestExamNet) highestExamNet = net;
    });

    const weekStats = studySessionsService.getCurrentWeekStats(sessions);
    const thisWeekTargetPercentage =
      weeklyTargetMinutes > 0
        ? Math.min(100, Math.round((weekStats.totalMinutes / weeklyTargetMinutes) * 100))
        : 0;

    // Total XP from unlocked badges + base XP from study hours & streak
    const badgeXp = userBadges
      .filter((ub) => ub.is_unlocked)
      .reduce((acc, ub) => acc + (ub.badge.xp_points || 50), 0);

    const studyHoursXp = totalStudyHours * 10;
    const streakXp = streak.longest_streak * 20;
    const totalXp = badgeXp + studyHoursXp + streakXp;

    const unlockedCount = userBadges.filter((ub) => ub.is_unlocked).length;
    const levelInfo = this.calculateLevelInfo(totalXp, unlockedCount);

    return {
      streak,
      level: levelInfo,
      total_study_minutes: totalStudyMinutes,
      total_study_hours: totalStudyHours,
      completed_topics_count: completedTopicsCount,
      total_exams_count: exams.length,
      highest_exam_net: Number(highestExamNet.toFixed(1)),
      wrong_questions_count: wrongQuestions.length,
      weekly_target_minutes: weeklyTargetMinutes,
      this_week_study_minutes: weekStats.totalMinutes,
      this_week_target_percentage: thisWeekTargetPercentage,
    };
  }

  // Force unlock/claim a badge (e.g. from UI testing or special event)
  public async unlockBadge(studentId: string, badgeCode: string): Promise<void> {
    const key = `${USER_BADGES_OVERRIDE_KEY}_${studentId}`;
    const overrides = cloudStorage.getItem<Record<string, { earned_at: string }>>(key, {});
    overrides[badgeCode] = { earned_at: new Date().toISOString() };
    cloudStorage.setItem(key, overrides);
  }
}

export const badgesService = new BadgesService();
