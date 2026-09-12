import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { badgesService } from '../lib/badgesService';
import { WeeklyLeagueView } from '../components/WeeklyLeagueView';
import { AnimatedNumber } from '../components/AnimatedNumber';
import {
  UserBadge,
  UserProfileStats,
  BadgeCategory,
  BadgeTier,
} from '../types';
import {
  Flame,
  Zap,
  ShieldCheck,
  Crown,
  Trophy,
  Clock,
  Timer,
  Award,
  Medal,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Library,
  FileText,
  BarChart3,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Search,
  Target,
  User,
  Mail,
  Phone,
  Building,
  Lock,
  ChevronRight,
  RefreshCw,
  Info,
  Calendar,
  X,
  Share2,
} from 'lucide-react';

// Icon resolver helper for dynamic badge icons
const renderBadgeIcon = (iconName: string, className = 'w-6 h-6') => {
  switch (iconName) {
    case 'Flame':
      return <Flame className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'Timer':
      return <Timer className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Medal':
      return <Medal className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Library':
      return <Library className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'BarChart3':
      return <BarChart3 className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'HelpCircle':
      return <HelpCircle className={className} />;
    case 'Search':
      return <Search className={className} />;
    case 'Target':
      return <Target className={className} />;
    default:
      return <Award className={className} />;
  }
};

export const UserProfileView: React.FC = () => {
  const { user, navigate } = useAuth();
  const studentId = user?.id || 'st-demo-001';

  const [profileTab, setProfileTab] = useState<'badges' | 'league'>('league');
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [inspectBadge, setInspectBadge] = useState<UserBadge | null>(null);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [fetchedStats, fetchedBadges] = await Promise.all([
        badgesService.getUserProfileStats(studentId),
        badgesService.getUserBadges(studentId),
      ]);
      setStats(fetchedStats);
      setUserBadges(fetchedBadges);
    } catch (err) {
      console.error('Failed to load user profile stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [studentId]);

  if (!user) return null;

  // Filter badges
  const filteredBadges = userBadges.filter((ub) => {
    const matchesCategory =
      selectedCategory === 'all' || ub.badge.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unlocked' && ub.is_unlocked) ||
      (statusFilter === 'locked' && !ub.is_unlocked);
    return matchesCategory && matchesStatus;
  });

  const unlockedCount = userBadges.filter((ub) => ub.is_unlocked).length;
  const totalCount = userBadges.length;

  const getTierStyles = (tier: BadgeTier, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return {
        badgeBg: 'bg-[#F0ECE1] text-[#7E8D9F] border-[#DFD9CC]',
        iconColor: 'text-[#7E8D9F]',
        glow: '',
        tierName: 'Kilitli',
        pillBg: 'bg-[#E2DED4] text-[#7E8D9F]',
      };
    }

    switch (tier) {
      case 'diamond':
        return {
          badgeBg: 'bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white border-[#255A8A] shadow-md shadow-[#255A8A]/20',
          iconColor: 'text-[#54A0FF]',
          glow: 'border-[#54A0FF]/40',
          tierName: 'Elmas Rozet',
          pillBg: 'bg-[#54A0FF]/20 text-[#54A0FF] border border-[#54A0FF]/30',
        };
      case 'gold':
        return {
          badgeBg: 'bg-gradient-to-br from-[#FFF9E6] to-[#FFF0B3] text-[#7D5A00] border-[#E5C158] shadow-sm',
          iconColor: 'text-[#D97736]',
          glow: 'border-[#D97736]/30',
          tierName: 'Altın Rozet',
          pillBg: 'bg-[#D97736]/15 text-[#D97736] border border-[#D97736]/25',
        };
      case 'silver':
        return {
          badgeBg: 'bg-gradient-to-br from-[#F5F7FA] to-[#E4E7EB] text-[#334E68] border-[#CBD2D9] shadow-sm',
          iconColor: 'text-[#255A8A]',
          glow: 'border-[#255A8A]/20',
          tierName: 'Gümüş Rozet',
          pillBg: 'bg-[#255A8A]/15 text-[#255A8A] border border-[#255A8A]/20',
        };
      case 'bronze':
      default:
        return {
          badgeBg: 'bg-gradient-to-br from-[#FAF4EB] to-[#F1E4D3] text-[#6E421F] border-[#D9BE9B] shadow-sm',
          iconColor: 'text-[#9C5821]',
          glow: 'border-[#9C5821]/20',
          tierName: 'Bronz Rozet',
          pillBg: 'bg-[#9C5821]/15 text-[#9C5821] border border-[#9C5821]/20',
        };
    }
  };

  return (
    <div id="user-profile-view" className="space-y-6 max-w-6xl mx-auto animate-in fade-in pb-12">
      {/* 1. Header Profile Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DFD9CC] shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#D97736]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* User Avatar with Initials & Role Badge */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm border-2 border-white">
                {user.full_name?.charAt(0).toUpperCase() || 'K'}
              </div>
              <div
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-[#D97736] text-white flex items-center justify-center shadow-xs text-xs font-black border-2 border-white"
                title={`Level ${stats?.level.level || 1}`}
              >
                {stats?.level.level || 1}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#1B2A4A] tracking-tight">
                  {user.full_name || 'YKS Adayı'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#1B2A4A]/10 text-[#1B2A4A] border border-[#1B2A4A]/20">
                  {user.role === 'student'
                    ? `${user.field || 'SAY'} Alanı`
                    : user.role === 'coach'
                    ? 'YKS Koçu'
                    : 'Yönetici'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#2E6B4F]/15 text-[#2E6B4F] border border-[#2E6B4F]/25 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Aktif Hesap</span>
                </span>
              </div>

              <p className="text-xs text-[#4A5B78] mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#7E8D9F]" />
                  {user.email || 'ogrenci@karne.app'}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#7E8D9F]" />
                    {user.phone}
                  </span>
                )}
              </p>

              {user.role === 'student' && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1B2A4A]">
                  <span className="flex items-center gap-1 bg-[#F7F4EE] px-2.5 py-1 rounded-xl border border-[#DFD9CC]">
                    <Building className="w-3.5 h-3.5 text-[#255A8A]" />
                    <span>{user.target_university || 'Hedef Üniversite Belirlendi'}</span>
                  </span>
                  <span className="flex items-center gap-1 bg-[#F7F4EE] px-2.5 py-1 rounded-xl border border-[#DFD9CC]">
                    <Target className="w-3.5 h-3.5 text-[#D97736]" />
                    <span>{user.target_department || 'Hedef Bölüm'}</span>
                  </span>
                  {user.target_rank && (
                    <span className="flex items-center gap-1 bg-[#D97736]/10 text-[#D97736] px-2.5 py-1 rounded-xl border border-[#D97736]/20 font-bold">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{user.target_rank}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              id="btn-edit-profile-settings"
              onClick={() => navigate('/settings')}
              className="py-2.5 px-4 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] text-xs font-bold border border-[#DFD9CC] transition-colors flex items-center gap-1.5"
            >
              <User className="w-4 h-4 text-[#D97736]" />
              <span>Profili Düzenle</span>
            </button>
            <button
              type="button"
              id="btn-refresh-stats"
              onClick={loadProfileData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] transition-colors"
              title="İstatistikleri ve Rozetleri Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D97736]' : 'text-[#7E8D9F]'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Level & Streak Top Highlight Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level & XP Card */}
        <div className="bg-white p-5 rounded-3xl border border-[#DFD9CC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-[#D97736] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider">
                  Seviye Durumu
                </p>
                <h3 className="text-base font-extrabold text-[#1B2A4A]">
                  Level {stats?.level.level || 1} • {stats?.level.level_title || 'YKS Yolcusu'}
                </h3>
              </div>
            </div>
            <span className="text-xs font-black text-[#D97736] bg-[#D97736]/10 px-2.5 py-1 rounded-xl border border-[#D97736]/20">
              <AnimatedNumber value={stats?.level.current_xp || 0} suffix=" XP" duration={1000} />
            </span>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#7E8D9F]">
              <span>Sonraki Seviyeye İlerleme</span>
              <span className="font-bold text-[#1B2A4A]">%{stats?.level.progress_percentage || 0}</span>
            </div>
            <div className="w-full h-2.5 bg-[#F7F4EE] rounded-full overflow-hidden border border-[#DFD9CC]">
              <div
                className="h-full bg-gradient-to-r from-[#D97736] to-[#E68A4E] rounded-full transition-all duration-500"
                style={{ width: `${stats?.level.progress_percentage || 0}%` }}
              />
            </div>
            <p className="text-[10px] text-[#7E8D9F] text-right">
              {stats?.level.next_level_xp ? `${stats.level.next_level_xp - stats.level.current_xp} XP kaldı` : 'Maksimum Seviye'}
            </p>
          </div>
        </div>

        {/* Günlük Seri (Streak) Banner */}
        <div className="bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white p-5 rounded-3xl shadow-sm md:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
            <Flame className="w-48 h-48 text-white" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D97736] to-[#E68A4E] text-white flex items-center justify-center shadow-md animate-pulse">
                <Flame className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    {stats?.streak.current_streak || 0} Günlük Çalışma Serisi!
                  </h3>
                  <span className="text-lg">🔥</span>
                </div>
                <p className="text-xs text-gray-200 mt-0.5">
                  {stats?.streak.is_studied_today
                    ? 'Tebrikler! Bugün çalışma oturumu yaparak seriyi korudun.'
                    : 'Bugün henüz oturum kaydedilmedi. Serini kaybetmemek için bir seans tamamla!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl px-3 py-2 text-center">
                <p className="text-[10px] text-gray-300 font-bold uppercase">En Uzun Seri</p>
                <p className="text-sm font-black text-white">{stats?.streak.longest_streak || 0} Gün</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl px-3 py-2 text-center">
                <p className="text-[10px] text-gray-300 font-bold uppercase">Aktif Günler</p>
                <p className="text-sm font-black text-white">{stats?.streak.total_active_days || 0} Gün</p>
              </div>
            </div>
          </div>

          {/* 7-Days Activity Sparkline */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between gap-2 relative z-10">
            <span className="text-[11px] font-bold text-gray-300 hidden sm:inline">Son 7 Gün:</span>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1 max-w-md mx-auto sm:mx-0">
              {stats?.streak.recent_activity_days.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded-xl text-center border transition-all ${
                    day.studied
                      ? 'bg-[#D97736] text-white border-[#D97736]/40 shadow-xs'
                      : 'bg-white/10 text-gray-300 border-white/10'
                  }`}
                  title={`${day.date}: ${day.studied ? `${day.minutes} dk çalışıldı` : 'Çalışma yok'}`}
                >
                  <p className="text-[9px] font-bold uppercase">{day.dayName}</p>
                  <div className="mt-0.5 flex items-center justify-center">
                    {day.studied ? (
                      <Flame className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 my-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              id="btn-quick-focus-session"
              onClick={() => navigate('/focus')}
              className="py-1.5 px-3 rounded-xl bg-white text-[#1B2A4A] hover:bg-gray-100 text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-[#D97736]" />
              <span>Odaklan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Performance Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#DFD9CC] shadow-xs">
          <div className="flex items-center gap-2 text-[#255A8A] mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7E8D9F]">Toplam Odak</span>
          </div>
          <p className="text-xl font-black text-[#1B2A4A] mt-1">
            {stats?.total_study_hours || 0}s {((stats?.total_study_minutes || 0) % 60)}d
          </p>
          <p className="text-[10px] text-[#7E8D9F] mt-0.5">Kayıtlı çalışma süresi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFD9CC] shadow-xs">
          <div className="flex items-center gap-2 text-[#2E6B4F] mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7E8D9F]">Biten Konu</span>
          </div>
          <p className="text-xl font-black text-[#1B2A4A] mt-1">
            {stats?.completed_topics_count || 0} Konu
          </p>
          <p className="text-[10px] text-[#7E8D9F] mt-0.5">Soru bankalarından</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFD9CC] shadow-xs">
          <div className="flex items-center gap-2 text-[#D97736] mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7E8D9F]">Deneme Neti</span>
          </div>
          <p className="text-xl font-black text-[#1B2A4A] mt-1">
            {stats?.highest_exam_net ? `${stats.highest_exam_net} Net` : '0 Net'}
          </p>
          <p className="text-[10px] text-[#7E8D9F] mt-0.5">{stats?.total_exams_count || 0} Deneme çözüldü</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFD9CC] shadow-xs">
          <div className="flex items-center gap-2 text-[#C0392B] mb-1">
            <HelpCircle className="w-4 h-4" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7E8D9F]">Hata Havuzu</span>
          </div>
          <p className="text-xl font-black text-[#1B2A4A] mt-1">
            {stats?.wrong_questions_count || 0} Soru
          </p>
          <p className="text-[10px] text-[#7E8D9F] mt-0.5">Teşhis edilen soru</p>
        </div>
      </div>

      {/* 4. Tab Navigation: Haftalık YKS Ligi vs. Başarı Rozetleri */}
      <div className="bg-white p-2 rounded-2xl border border-[#DFD9CC] shadow-2xs flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setProfileTab('league')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            profileTab === 'league'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:text-[#1B2A4A] hover:bg-[#FAF8F5]'
          }`}
        >
          <Trophy className="w-4 h-4 text-[#D97736]" />
          <span>Haftalık YKS Çalışma Ligi</span>
        </button>

        <button
          type="button"
          onClick={() => setProfileTab('badges')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            profileTab === 'badges'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:text-[#1B2A4A] hover:bg-[#FAF8F5]'
          }`}
        >
          <Medal className="w-4 h-4 text-[#255A8A]" />
          <span>Başarı Rozetleri ({unlockedCount}/{totalCount})</span>
        </button>
      </div>

      {/* 5. TAB 1: WEEKLY LEAGUE VIEW */}
      {profileTab === 'league' && (
        <div className="space-y-6 animate-in fade-in">
          <WeeklyLeagueView />
        </div>
      )}

      {/* 6. TAB 2: BAŞARI ROZETLERİ GALERİSİ */}
      {profileTab === 'badges' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-6 animate-in fade-in">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DFD9CC] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-[#1B2A4A] tracking-tight">
                  Başarı Rozetleri ({unlockedCount}/{totalCount})
                </h2>
              </div>
              <p className="text-xs text-[#7E8D9F] mt-1">
                Ardışık çalışma serileri, soru bankası hedefleri ve deneme başarılarıyla kazandığınız rozetler.
              </p>
            </div>

            {/* Status Filter Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F7F4EE] rounded-2xl border border-[#DFD9CC] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                }`}
              >
                Tümü ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unlocked')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  statusFilter === 'unlocked'
                    ? 'bg-[#2E6B4F] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kazanılan ({unlockedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('locked')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  statusFilter === 'locked'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kilitli ({totalCount - unlockedCount})</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all' as BadgeCategory, label: 'Tüm Kategoriler', icon: Trophy },
              { id: 'streak' as BadgeCategory, label: '🔥 Seri (Streak)', icon: Flame },
              { id: 'study_time' as BadgeCategory, label: '⏱️ Odak Süresi', icon: Clock },
              { id: 'books' as BadgeCategory, label: '📚 Kitap & Konu', icon: BookOpen },
              { id: 'exams' as BadgeCategory, label: '📊 Denemeler', icon: BarChart3 },
              { id: 'questions' as BadgeCategory, label: '❓ Hata Teşhisi', icon: HelpCircle },
              { id: 'special' as BadgeCategory, label: '🎯 Özel Hedefler', icon: Target },
            ].map((tab) => {
              const isSelected = selectedCategory === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0 ${
                    isSelected
                      ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                      : 'bg-[#F7F4EE] text-[#4A5B78] border-[#DFD9CC] hover:bg-[#EFEBE0]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D97736]' : 'text-[#7E8D9F]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Badges Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredBadges.map((userBadge) => {
              const { badge, is_unlocked, progress_current, progress_target } = userBadge;
              const styles = getTierStyles(badge.tier, is_unlocked);
              const percentage = Math.min(100, Math.round((progress_current / progress_target) * 100));

              return (
                <div
                  key={userBadge.id}
                  id={`badge-card-${badge.code}`}
                  onClick={() => setInspectBadge(userBadge)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between relative ${
                    is_unlocked
                      ? 'bg-white border-[#DFD9CC] shadow-xs hover:border-[#1B2A4A]'
                      : 'bg-[#F7F4EE]/60 border-[#DFD9CC]/70 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Top Bar: Icon + Tier Pill */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className={`w-13 h-13 rounded-2xl flex items-center justify-center border ${styles.badgeBg}`}
                      >
                        {renderBadgeIcon(badge.icon_name, 'w-6 h-6')}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${styles.pillBg}`}>
                          {styles.tierName}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#D97736]">
                          +{badge.xp_points} XP
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-sm font-extrabold text-[#1B2A4A] group-hover:text-[#D97736] transition-colors flex items-center gap-1.5">
                      <span>{badge.title}</span>
                      {is_unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B4F] shrink-0" />}
                    </h3>
                    <p className="text-xs text-[#7E8D9F] mt-1 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  {/* Progress / Status Bar */}
                  <div className="mt-4 pt-3 border-t border-[#DFD9CC]/80">
                    {is_unlocked ? (
                      <div className="flex items-center justify-between text-xs font-bold text-[#2E6B4F]">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Kazanıldı</span>
                        </span>
                        <span className="text-[10px] text-[#7E8D9F] font-medium">Rozet Aktif</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#7E8D9F]">
                          <span>İlerleme: {progress_current} / {progress_target}</span>
                          <span className="font-bold text-[#1B2A4A]">%{percentage}</span>
                        </div>
                        <div className="w-full h-2 bg-[#E2DED4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1B2A4A] rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBadges.length === 0 && (
            <div className="p-8 text-center bg-[#F7F4EE] rounded-3xl border border-[#DFD9CC]">
              <Trophy className="w-10 h-10 text-[#7E8D9F] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-[#1B2A4A]">Seçilen filtrede rozet bulunamadı.</p>
              <p className="text-[11px] text-[#7E8D9F] mt-0.5">Diğer filtre seçeneklerini deneyebilirsiniz.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. Detailed Badge Inspection Modal */}
      {inspectBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#DFD9CC] shadow-xl p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setInspectBadge(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#7E8D9F] hover:bg-[#F7F4EE] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3 pt-2">
              <div
                className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border-2 ${
                  getTierStyles(inspectBadge.badge.tier, inspectBadge.is_unlocked).badgeBg
                }`}
              >
                {renderBadgeIcon(inspectBadge.badge.icon_name, 'w-10 h-10')}
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#F7F4EE] border border-[#DFD9CC] text-[#1B2A4A]">
                <span>{getTierStyles(inspectBadge.badge.tier, inspectBadge.is_unlocked).tierName}</span>
                <span>•</span>
                <span className="text-[#D97736]">+{inspectBadge.badge.xp_points} XP</span>
              </div>

              <h3 className="text-xl font-black text-[#1B2A4A]">
                {inspectBadge.badge.title}
              </h3>

              <p className="text-xs text-[#4A5B78] leading-relaxed max-w-sm mx-auto">
                {inspectBadge.badge.description}
              </p>

              {/* Progress Detail */}
              <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] text-left space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#1B2A4A]">
                  <span>Mevcut Durum</span>
                  {inspectBadge.is_unlocked ? (
                    <span className="text-[#2E6B4F] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tamamlandı
                    </span>
                  ) : (
                    <span className="text-[#D97736]">
                      %{Math.round((inspectBadge.progress_current / inspectBadge.progress_target) * 100)} Tamamlandı
                    </span>
                  )}
                </div>

                <div className="w-full h-2.5 bg-[#E2DED4] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      inspectBadge.is_unlocked ? 'bg-[#2E6B4F]' : 'bg-[#D97736]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((inspectBadge.progress_current / inspectBadge.progress_target) * 100))}%`,
                    }}
                  />
                </div>

                <p className="text-[11px] text-[#7E8D9F]">
                  Hedef: <strong>{inspectBadge.progress_target}</strong> | Şu An: <strong>{inspectBadge.progress_current}</strong>
                </p>
              </div>

              {/* Action */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setInspectBadge(null)}
                  className="w-full py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
