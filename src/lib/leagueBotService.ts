import { LeagueBotConfig, LeagueTier, LeagueLeaderboardUser } from '../types';

const STORAGE_KEY = 'studii_league_bots_v2';
const MASTER_SWITCH_KEY = 'studii_league_bots_master_enabled';

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-cyan-600',
];

export const INITIAL_LEAGUE_BOTS: LeagueBotConfig[] = [
  {
    id: 'bot-01',
    name: 'Kerem Y.',
    field: 'SAY',
    target_department: 'Hacettepe Tıp Fakültesi',
    league_tier: 'gold',
    behavior_mode: 'target_rank',
    target_rank_position: 1,
    daily_xp_rate: 220,
    streak_days: 14,
    is_active: true,
    avatar_color: 'bg-emerald-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-02',
    name: 'Zeynep B.',
    field: 'EA',
    target_department: 'Koç Üniversitesi Hukuk',
    league_tier: 'gold',
    behavior_mode: 'daily_xp',
    daily_xp_rate: 180,
    streak_days: 9,
    is_active: true,
    avatar_color: 'bg-blue-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-03',
    name: 'Emre K.',
    field: 'SAY',
    target_department: 'İTÜ Bilgisayar Mühendisliği',
    league_tier: 'silver',
    behavior_mode: 'daily_xp',
    daily_xp_rate: 160,
    streak_days: 6,
    is_active: true,
    avatar_color: 'bg-indigo-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-04',
    name: 'Sude M.',
    field: 'SAY',
    target_department: 'ODTÜ Makine Mühendisliği',
    league_tier: 'silver',
    behavior_mode: 'target_rank',
    target_rank_position: 3,
    daily_xp_rate: 140,
    streak_days: 8,
    is_active: true,
    avatar_color: 'bg-purple-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-05',
    name: 'Berke D.',
    field: 'EA',
    target_department: 'Boğaziçi İktisat',
    league_tier: 'silver',
    behavior_mode: 'daily_xp',
    daily_xp_rate: 110,
    streak_days: 5,
    is_active: true,
    avatar_color: 'bg-amber-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-06',
    name: 'Melis A.',
    field: 'DIL',
    target_department: 'Boğaziçi Çeviribilim',
    league_tier: 'bronze',
    behavior_mode: 'daily_xp',
    daily_xp_rate: 80,
    streak_days: 3,
    is_active: true,
    avatar_color: 'bg-teal-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-07',
    name: 'İrem T.',
    field: 'SAY',
    target_department: 'İstanbul Çapa Tıp',
    league_tier: 'platinum',
    behavior_mode: 'target_rank',
    target_rank_position: 2,
    daily_xp_rate: 280,
    streak_days: 21,
    is_active: true,
    avatar_color: 'bg-rose-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-08',
    name: 'Eren S.',
    field: 'SOZ',
    target_department: 'Ankara İletişim',
    league_tier: 'bronze',
    behavior_mode: 'daily_xp',
    daily_xp_rate: 75,
    streak_days: 4,
    is_active: true,
    avatar_color: 'bg-cyan-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-09',
    name: 'Deniz C.',
    field: 'SAY',
    target_department: 'Bilkent Endüstri Mühendisliği',
    league_tier: 'diamond',
    behavior_mode: 'daily_xp',
    daily_xp_rate: 340,
    streak_days: 30,
    is_active: true,
    avatar_color: 'bg-blue-600',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bot-10',
    name: 'Caner V.',
    field: 'SAY',
    target_department: 'Cerrahpaşa Tıp',
    league_tier: 'champions',
    behavior_mode: 'daily_xp',
    daily_xp_rate: 450,
    streak_days: 45,
    is_active: true,
    avatar_color: 'bg-purple-600',
    created_at: new Date().toISOString(),
  },
];

class LeagueBotService {
  public isMasterBotsEnabled(): boolean {
    const raw = localStorage.getItem(MASTER_SWITCH_KEY);
    if (raw === null) return true; // Enabled by default
    return raw === 'true';
  }

  public setMasterBotsEnabled(enabled: boolean): void {
    localStorage.setItem(MASTER_SWITCH_KEY, enabled ? 'true' : 'false');
  }

  public getAllBots(): LeagueBotConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveBots(INITIAL_LEAGUE_BOTS);
        return INITIAL_LEAGUE_BOTS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_LEAGUE_BOTS;
    }
  }

  public saveBots(bots: LeagueBotConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
    } catch (e) {
      console.error('Failed to save league bots:', e);
    }
  }

  public createBot(data: Omit<LeagueBotConfig, 'id' | 'created_at'>): LeagueBotConfig {
    const bots = this.getAllBots();
    const newBot: LeagueBotConfig = {
      ...data,
      id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    bots.push(newBot);
    this.saveBots(bots);
    return newBot;
  }

  public updateBot(id: string, partial: Partial<LeagueBotConfig>): LeagueBotConfig | null {
    const bots = this.getAllBots();
    const idx = bots.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    bots[idx] = { ...bots[idx], ...partial };
    this.saveBots(bots);
    return bots[idx];
  }

  public toggleBotActive(id: string): boolean {
    const bots = this.getAllBots();
    const bot = bots.find((b) => b.id === id);
    if (!bot) return false;
    bot.is_active = !bot.is_active;
    this.saveBots(bots);
    return bot.is_active;
  }

  public deleteBot(id: string): boolean {
    const bots = this.getAllBots();
    const filtered = bots.filter((b) => b.id !== id);
    this.saveBots(filtered);
    return true;
  }

  public resetToDefaults(): LeagueBotConfig[] {
    this.saveBots(INITIAL_LEAGUE_BOTS);
    this.setMasterBotsEnabled(true);
    return INITIAL_LEAGUE_BOTS;
  }

  // Generate 5 fresh realistic motivation bots
  public generateFiveBots(): LeagueBotConfig[] {
    const names = [
      'Alp K.', 'Elif S.', 'Oğuzhan T.', 'Büşra Ç.', 'Kaan R.',
      'Selin Y.', 'Mert E.', 'Doğa Ö.', 'Barış N.', 'Ece G.'
    ];
    const depts = [
      'ODTÜ Havacılık ve Uzay', 'İTÜ Yapay Zeka', 'Galatasaray Hukuk',
      'Boğaziçi Psikoloji', 'Hacettepe Diş Hekimliği', 'Yıldız Teknik Mimarlık'
    ];
    const tiers: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const fields: ('SAY' | 'EA' | 'SOZ' | 'DIL')[] = ['SAY', 'EA', 'SAY', 'EA', 'DIL'];

    const newBots: LeagueBotConfig[] = [];
    for (let i = 0; i < 5; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const dept = depts[Math.floor(Math.random() * depts.length)];
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const field = fields[Math.floor(Math.random() * fields.length)];
      const isTargetRank = Math.random() > 0.5;

      newBots.push(
        this.createBot({
          name,
          field,
          target_department: dept,
          league_tier: tier,
          behavior_mode: isTargetRank ? 'target_rank' : 'daily_xp',
          target_rank_position: isTargetRank ? Math.floor(Math.random() * 4) + 1 : undefined,
          daily_xp_rate: Math.floor(Math.random() * 180) + 90,
          streak_days: Math.floor(Math.random() * 15) + 3,
          is_active: true,
          avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        })
      );
    }
    return newBots;
  }

  /**
   * Generates formatted LeagueLeaderboardUser entries for bots assigned to a tier,
   * calculating their XP dynamically according to the day of week or target rank position.
   */
  public getActiveBotsForTier(
    tier: LeagueTier,
    realLeaderboard: Omit<LeagueLeaderboardUser, 'rank_position' | 'status_zone'>[]
  ): Omit<LeagueLeaderboardUser, 'rank_position' | 'status_zone'>[] {
    if (!this.isMasterBotsEnabled()) return [];

    const allBots = this.getAllBots();
    const activeBots = allBots.filter((b) => b.is_active && b.league_tier === tier);
    if (activeBots.length === 0) return [];

    const now = new Date();
    // Monday is 1, Sunday is 7
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    // Baseline XP by tier
    const TIER_BASELINE_XP: Record<LeagueTier, number> = {
      bronze: 30,
      silver: 180,
      gold: 600,
      platinum: 1350,
      diamond: 2350,
      champions: 3600,
    };

    const maxRealXp = realLeaderboard.length > 0 ? Math.max(...realLeaderboard.map((r) => r.weekly_xp)) : 0;
    const avgRealXp = realLeaderboard.length > 0
      ? Math.round(realLeaderboard.reduce((a, b) => a + b.weekly_xp, 0) / realLeaderboard.length)
      : TIER_BASELINE_XP[tier];

    return activeBots.map((bot) => {
      let computedXp = 0;

      if (bot.behavior_mode === 'target_rank') {
        const targetRank = bot.target_rank_position || 2;
        if (targetRank === 1) {
          computedXp = Math.max(TIER_BASELINE_XP[tier] + 300, maxRealXp + 85);
        } else if (targetRank <= 3) {
          computedXp = Math.max(TIER_BASELINE_XP[tier] + 150, Math.round(maxRealXp * 0.9) + 40);
        } else {
          computedXp = Math.max(TIER_BASELINE_XP[tier], Math.round(avgRealXp * 0.85));
        }
      } else {
        // daily_xp rate mode
        const earnedThisWeek = dayOfWeek * bot.daily_xp_rate;
        const streakBonus = bot.streak_days * 15;
        computedXp = TIER_BASELINE_XP[tier] + earnedThisWeek + streakBonus;
      }

      const totalMinutes = Math.round(computedXp / 2);
      const totalHours = Number((totalMinutes / 60).toFixed(1));

      const initials = bot.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      return {
        id: bot.id,
        name: `${bot.name}`,
        avatar_initials: initials || 'BT',
        avatar_color: bot.avatar_color || 'bg-blue-600',
        field: bot.field,
        target_department: bot.target_department,
        weekly_study_minutes: totalMinutes,
        weekly_study_hours: totalHours,
        weekly_xp: computedXp,
        streak_days: bot.streak_days,
        is_current_user: false,
        is_bot: true,
        movement: 'same',
      };
    });
  }
}

export const leagueBotService = new LeagueBotService();
