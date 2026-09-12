import { studySessionsService } from './studySessionsService';
import { badgesService } from './badgesService';
import { usersService } from './usersService';
import { leagueBotService } from './leagueBotService';
import {
  WeeklyLeagueInfo,
  LeagueLeaderboardUser,
  LeagueTier,
} from '../types';

export const LEAGUE_TIER_META: Record<
  LeagueTier,
  { name: string; icon: string; minXp: number; description: string; color: string }
> = {
  champions: { name: 'Şampiyonlar Ligi', icon: '👑', minXp: 3500, description: 'En üst düzey odak ve derece adayı öğrenciler', color: 'from-amber-500 to-yellow-600' },
  diamond: { name: 'Elmas Lig', icon: '💎', minXp: 2200, description: 'Haftalık 30+ saat çalışan seçkin grup', color: 'from-cyan-500 to-blue-600' },
  platinum: { name: 'Platin Lig', icon: '🛡️', minXp: 1200, description: 'İstikrarlı ve yüksek tempolu öğrenciler', color: 'from-indigo-500 to-purple-600' },
  gold: { name: 'Altın Lig', icon: '🥇', minXp: 500, description: 'Her gün düzenli soru çözen azimli kadro', color: 'from-amber-400 to-amber-600' },
  silver: { name: 'Gümüş Lig', icon: '🥈', minXp: 100, description: 'Temposunu artıran aktif lig basamağı', color: 'from-slate-400 to-slate-600' },
  bronze: { name: 'Bronz Lig', icon: '🥉', minXp: 0, description: 'Haftaya yeni başlayan hazırlık ligi', color: 'from-amber-700 to-amber-900' },
};

class LeagueService {
  public async getWeeklyLeagueData(
    studentId: string,
    userName: string = 'Siz',
    studentField: 'SAY' | 'EA' | 'SOZ' | 'DIL' = 'SAY'
  ): Promise<WeeklyLeagueInfo> {
    // 1. Fetch all real students registered in the system
    const allUsers = await usersService.getAllUsers();
    const realStudents = allUsers.filter(
      (u) => u.role === 'student' && u.status === 'active'
    );

    // If current student is not in the list (e.g. newly signed up or demo session), ensure they exist
    const hasCurrent = realStudents.some((u) => u.id === studentId);
    if (!hasCurrent && studentId) {
      realStudents.push({
        id: studentId,
        role: 'student',
        status: 'active',
        full_name: userName || 'Öğrenci',
        email: '',
        field: (studentField === 'SOZ' ? 'SÖZ' : studentField === 'DIL' ? 'DİL' : studentField) as 'SAY' | 'EA' | 'SÖZ' | 'DİL',
        created_at: new Date().toISOString(),
      });
    }

    const AVATAR_COLORS = [
      'bg-[#0071E3]',
      'bg-emerald-600',
      'bg-indigo-600',
      'bg-amber-600',
      'bg-purple-600',
      'bg-rose-600',
      'bg-teal-600',
      'bg-blue-600',
    ];

    // 2. Compute actual weekly study time and XP for every real user
    const leaderboardItems: Omit<
      LeagueLeaderboardUser,
      'rank_position' | 'status_zone'
    >[] = await Promise.all(
      realStudents.map(async (st, idx) => {
        const [sessions, streakInfo] = await Promise.all([
          studySessionsService.getSessions(st.id),
          badgesService.calculateStreak(st.id),
        ]);

        const weekStats = studySessionsService.getCurrentWeekStats(sessions);
        const weeklyMinutes = weekStats.totalMinutes || 0;
        const weeklyHours = Number((weeklyMinutes / 60).toFixed(1));
        const streakDays = streakInfo.current_streak || 0;

        // 2 XP per study minute + streak bonus
        const weeklyXp = Math.round(
          weeklyMinutes * 2 + (streakDays > 0 ? streakDays * 25 : 0)
        );

        const initials = st.full_name
          ? st.full_name
              .trim()
              .split(/\s+/)
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
          : 'ÖG';

        const isCurrent = st.id === studentId;
        const displayName = isCurrent
          ? `${st.full_name || userName} (Siz)`
          : st.full_name || 'Öğrenci';

        return {
          id: st.id,
          name: displayName,
          avatar_initials: initials,
          avatar_color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          field: (st.field as any) || 'SAY',
          target_department: st.target_department || 'Hedef Belirlenmedi',
          weekly_study_minutes: weeklyMinutes,
          weekly_study_hours: weeklyHours,
          weekly_xp: weeklyXp,
          streak_days: streakDays,
          is_current_user: isCurrent,
          is_bot: false,
          movement: 'same',
        };
      })
    );

    const currentUserItem = leaderboardItems.find((u) => u.is_current_user);
    const userWeeklyXp = currentUserItem ? currentUserItem.weekly_xp : 0;

    // Determine current user's league tier
    let tier: LeagueTier = 'silver';
    if (userWeeklyXp > 3500) tier = 'champions';
    else if (userWeeklyXp > 2200) tier = 'diamond';
    else if (userWeeklyXp > 1200) tier = 'platinum';
    else if (userWeeklyXp > 500) tier = 'gold';
    else if (userWeeklyXp > 100) tier = 'silver';
    else tier = 'bronze';

    // 3. Inject Motivation Bots configured for this tier (if enabled)
    const activeBots = leagueBotService.getActiveBotsForTier(tier, leaderboardItems);
    const combinedLeaderboard = [...leaderboardItems, ...activeBots];

    // Sort by weekly XP descending
    combinedLeaderboard.sort((a, b) => b.weekly_xp - a.weekly_xp);

    const totalCount = combinedLeaderboard.length;
    const promotionCutoff = Math.min(3, Math.max(1, Math.floor(totalCount / 2)));
    const relegationCutoff = totalCount > 4 ? totalCount - 2 : totalCount + 1;

    const populatedUsers: LeagueLeaderboardUser[] = combinedLeaderboard.map((u, index) => {
      const pos = index + 1;
      let zone: 'promotion' | 'safe' | 'relegation' = 'safe';
      if (pos <= promotionCutoff && totalCount > 1) zone = 'promotion';
      else if (pos >= relegationCutoff && totalCount > 4) zone = 'relegation';

      return {
        ...u,
        rank_position: pos,
        status_zone: zone,
      };
    });

    const userRankObj = populatedUsers.find((u) => u.is_current_user);
    const userRank = userRankObj ? userRankObj.rank_position : 1;

    // Calculate days left in week (resets on Sunday 23:59)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysLeft = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

    return {
      league_tier: tier,
      league_name: LEAGUE_TIER_META[tier].name,
      league_icon: LEAGUE_TIER_META[tier].icon,
      week_number: 36,
      days_left_in_week: daysLeft,
      total_participants: populatedUsers.length,
      user_current_rank: userRank,
      user_weekly_xp: userWeeklyXp,
      promotion_rank_cutoff: promotionCutoff,
      relegation_rank_cutoff: relegationCutoff,
      users: populatedUsers,
    };
  }

  /**
   * For Admin view: returns an overview of all 6 tiers with their student and bot participants.
   */
  public async getAllLeaguesOverview(): Promise<{
    tier: LeagueTier;
    name: string;
    icon: string;
    color: string;
    minXp: number;
    participants: LeagueLeaderboardUser[];
  }[]> {
    const allUsers = await usersService.getAllUsers();
    const realStudents = allUsers.filter(
      (u) => u.role === 'student' && u.status === 'active'
    );

    const allBots = leagueBotService.getAllBots().filter((b) => b.is_active);

    const realWithXp: Omit<LeagueLeaderboardUser, 'rank_position' | 'status_zone'>[] = await Promise.all(
      realStudents.map(async (st) => {
        const [sessions, streakInfo] = await Promise.all([
          studySessionsService.getSessions(st.id),
          badgesService.calculateStreak(st.id),
        ]);
        const weekStats = studySessionsService.getCurrentWeekStats(sessions);
        const weeklyMinutes = weekStats.totalMinutes || 0;
        const weeklyHours = Number((weeklyMinutes / 60).toFixed(1));
        const streakDays = streakInfo.current_streak || 0;
        const weeklyXp = Math.round(weeklyMinutes * 2 + (streakDays > 0 ? streakDays * 25 : 0));

        const initials = st.full_name
          ? st.full_name.trim().split(/\s+/).map((n) => n[0]).join('').substring(0, 2).toUpperCase()
          : 'ÖG';

        return {
          id: st.id,
          name: st.full_name || 'Öğrenci',
          avatar_initials: initials,
          avatar_color: 'bg-blue-600',
          field: (st.field as any) || 'SAY',
          target_department: st.target_department || 'Hedef Belirtilmedi',
          weekly_study_minutes: weeklyMinutes,
          weekly_study_hours: weeklyHours,
          weekly_xp: weeklyXp,
          streak_days: streakDays,
          is_current_user: false,
          is_bot: false,
          movement: 'same',
        };
      })
    );

    const TIERS: LeagueTier[] = ['champions', 'diamond', 'platinum', 'gold', 'silver', 'bronze'];

    return TIERS.map((tier) => {
      const meta = LEAGUE_TIER_META[tier];
      // Real students assigned to tier based on XP
      const tierReal = realWithXp.filter((r) => {
        if (tier === 'champions') return r.weekly_xp > 3500;
        if (tier === 'diamond') return r.weekly_xp > 2200 && r.weekly_xp <= 3500;
        if (tier === 'platinum') return r.weekly_xp > 1200 && r.weekly_xp <= 2200;
        if (tier === 'gold') return r.weekly_xp > 500 && r.weekly_xp <= 1200;
        if (tier === 'silver') return r.weekly_xp > 100 && r.weekly_xp <= 500;
        return r.weekly_xp <= 100;
      });

      // Bots in this tier
      const tierBots = leagueBotService.getActiveBotsForTier(tier, tierReal);
      const combined = [...tierReal, ...tierBots];
      combined.sort((a, b) => b.weekly_xp - a.weekly_xp);

      const ranked: LeagueLeaderboardUser[] = combined.map((u, i) => ({
        ...u,
        rank_position: i + 1,
        status_zone: i < 3 ? 'promotion' : i >= combined.length - 2 && combined.length > 4 ? 'relegation' : 'safe',
      }));

      return {
        tier,
        name: meta.name,
        icon: meta.icon,
        color: meta.color,
        minXp: meta.minXp,
        participants: ranked,
      };
    });
  }
}

export const leagueService = new LeagueService();
