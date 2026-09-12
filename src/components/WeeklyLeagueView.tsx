import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leagueService } from '../lib/leagueService';
import { WeeklyLeagueInfo, LeagueLeaderboardUser } from '../types';
import { AnimatedNumber } from './AnimatedNumber';
import {
  Trophy,
  Crown,
  Flame,
  Clock,
  Zap,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Shield,
  Award,
  Users,
  ChevronRight,
  Info,
} from 'lucide-react';

interface WeeklyLeagueViewProps {
  studentId?: string;
  userName?: string;
}

export const WeeklyLeagueView: React.FC<WeeklyLeagueViewProps> = ({
  studentId,
  userName,
}) => {
  const { user } = useAuth();
  const currentId = studentId || user?.id || 'st-current';
  const currentName = userName || user?.full_name || 'Öğrenci';
  const currentField = (user?.field as any) || 'SAY';

  const [leagueData, setLeagueData] = useState<WeeklyLeagueInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLeague = async () => {
      setLoading(true);
      try {
        const data = await leagueService.getWeeklyLeagueData(currentId, currentName, currentField);
        setLeagueData(data);
      } catch (err) {
        console.error('Failed to load league data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
  }, [currentId, currentName, currentField]);

  if (loading || !leagueData) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#DFD9CC] space-y-3">
        <Trophy className="w-8 h-8 text-[#D97736] animate-bounce mx-auto" />
        <p className="text-xs font-bold text-[#7E8D9F]">Haftalık Lig Sıralaması Yükleniyor...</p>
      </div>
    );
  }

  const currentUser = leagueData.users.find((u) => u.is_current_user);

  return (
    <div id="weekly-league-view" className="space-y-6 animate-in fade-in">
      {/* 1. League Hero Banner */}
      <div className="bg-gradient-to-br from-[#1B2A4A] via-[#1F335A] to-[#255A8A] text-white p-6 sm:p-7 rounded-3xl shadow-sm space-y-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Trophy className="w-64 h-64 text-white" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-xs">
              {leagueData.league_icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#D97736]">
                  Hafta {leagueData.week_number} • Sezon Ligi
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/15 text-white">
                  {leagueData.days_left_in_week} Gün Kaldı
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {leagueData.league_name}
              </h2>
            </div>
          </div>

          {/* User's Standings Card */}
          {currentUser && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 sm:px-5 flex items-center gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-gray-300 block">
                  Lig Dereceniz
                </span>
                <span className="text-2xl font-black text-[#D97736]">
                  {currentUser.rank_position}. Sıradasınız
                </span>
              </div>

              <div className="h-8 w-px bg-white/20" />

              <div>
                <span className="text-[10px] font-extrabold uppercase text-gray-300 block">
                  Haftalık XP
                </span>
                <span className="text-lg font-black text-white flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <AnimatedNumber value={currentUser.weekly_xp} suffix=" XP" duration={900} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Promotion Status Alert */}
        {currentUser && (
          <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs relative z-10">
            <div className="flex items-center gap-2">
              {currentUser.status_zone === 'promotion' ? (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold flex items-center gap-1 border border-emerald-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Üst Lige Terfi Hattındasınız! (İlk 3)</span>
                </span>
              ) : currentUser.status_zone === 'relegation' ? (
                <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-extrabold flex items-center gap-1 border border-rose-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Düşme Hattı Tehlikesi! Daha fazla çalışarak puan toplayın.</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-200 font-extrabold flex items-center gap-1 border border-blue-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Güvenli Bölgedesiniz. İlk 3 için +{Math.max(0, (leagueData.users[Math.min(2, leagueData.users.length - 1)]?.weekly_xp || 0) - currentUser.weekly_xp + 50)} XP gerekiyor.</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-300">
              Gerçek Kullanıcı Ligi • Her <strong>Pazar 23:59</strong>'da güncellenir.
            </p>
          </div>
        )}
      </div>

      {/* 2. Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#DFD9CC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#255A8A]" />
            <h3 className="text-base font-black text-[#1B2A4A]">
              Haftalık Öğrenci Sıralaması ({leagueData.total_participants} Gerçek Kullanıcı)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#7E8D9F]">
            Yalnızca gerçek kayıtlı öğrenciler listelenir
          </span>
        </div>

        <div className="divide-y divide-[#DFD9CC]">
          {leagueData.users.map((userItem) => {
            const isTop3 = userItem.rank_position <= 3;
            const isPromotionCutoff = userItem.rank_position === leagueData.promotion_rank_cutoff;
            const isRelegationCutoff = userItem.rank_position === leagueData.relegation_rank_cutoff;

            return (
              <React.Fragment key={userItem.id}>
                <div
                  className={`p-4 sm:px-6 flex items-center justify-between gap-3 transition-colors ${
                    userItem.is_current_user
                      ? 'bg-[#0071E3]/5 ring-2 ring-[#0071E3]/20'
                      : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  {/* Left: Position & Avatar & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-7 text-center shrink-0">
                      {userItem.rank_position === 1 ? (
                        <span className="text-xl">🥇</span>
                      ) : userItem.rank_position === 2 ? (
                        <span className="text-xl">🥈</span>
                      ) : userItem.rank_position === 3 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-sm font-black text-[#7E8D9F]">
                          {userItem.rank_position}
                        </span>
                      )}
                    </div>

                    {/* Movement Indicator */}
                    <div className="w-5 shrink-0 text-center">
                      {userItem.movement === 'up' ? (
                        <span className="text-[10px] font-extrabold text-[#2E6B4F] flex items-center">
                          <ArrowUp className="w-3 h-3" />
                          {userItem.movement_count || ''}
                        </span>
                      ) : userItem.movement === 'down' ? (
                        <span className="text-[10px] font-extrabold text-[#C0392B] flex items-center">
                          <ArrowDown className="w-3 h-3" />
                          {userItem.movement_count || ''}
                        </span>
                      ) : (
                        <Minus className="w-3 h-3 text-[#7E8D9F] mx-auto opacity-50" />
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-2xl ${userItem.avatar_color} text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs`}
                    >
                      {userItem.avatar_initials}
                    </div>

                    {/* Name & Subtitle */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-black truncate ${
                            userItem.is_current_user ? 'text-[#0071E3]' : 'text-[#1B2A4A]'
                          }`}
                        >
                          {userItem.name}
                        </span>
                        {userItem.is_current_user && (
                          <span className="px-2 py-0.2 rounded-md text-[9px] font-black bg-[#0071E3] text-white">
                            SİZ
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                          {userItem.field}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#7E8D9F] mt-0.5">
                        <span className="truncate">{userItem.target_department || 'YKS Hedef'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold text-[#D97736]">
                          <Flame className="w-3 h-3 fill-[#D97736]" />
                          {userItem.streak_days} Gün Seri
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Study Stats & XP */}
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <span className="text-[10px] text-[#7E8D9F] font-bold block">Bu Hafta</span>
                      <span className="text-xs font-black text-[#1B2A4A]">
                        {userItem.weekly_study_hours} Saat
                      </span>
                    </div>

                    <div className="min-w-[70px]">
                      <span className="text-[10px] text-[#7E8D9F] font-bold block">Puan</span>
                      <span className="text-sm font-black text-[#255A8A] flex items-center justify-end gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {userItem.weekly_xp} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider Line For Promotion Zone */}
                {isPromotionCutoff && (
                  <div className="px-6 py-1.5 bg-emerald-50 border-y border-emerald-200 text-center">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Crown className="w-3 h-3 text-emerald-600" />
                      <span>↑ Yukarıdaki 3 Öğrenci Bir Üst Lige Terfi Eder ↑</span>
                    </p>
                  </div>
                )}

                {/* Divider Line For Relegation Zone */}
                {isRelegationCutoff && (
                  <div className="px-6 py-1.5 bg-rose-50 border-y border-rose-200 text-center">
                    <p className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Shield className="w-3 h-3 text-rose-600" />
                      <span>↓ Aşağıdaki Öğrenciler Bir Alt Lige Düşer ↓</span>
                    </p>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. League Rules & Prizes Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#DFD9CC] shadow-xs space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A] flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#D97736]" />
          <span>Haftalık Lig Kuralları & Puanlama Mantığı</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#4A5B78] pt-1">
          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC]">
            <p className="font-extrabold text-[#1B2A4A]">⏱️ Çalışma Süresi</p>
            <p className="text-[11px] text-[#7E8D9F] mt-1">
              Kronometre ve manuel çalışma kayıtlarındaki her dakika için +2 XP kazanırsınız.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC]">
            <p className="font-extrabold text-[#1B2A4A]">🔥 Seri Çarpanı</p>
            <p className="text-[11px] text-[#7E8D9F] mt-1">
              Her aktif çalışma günü için streak seviyenize bağlı olarak +25 XP bonus puan eklenir.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC]">
            <p className="font-extrabold text-[#1B2A4A]">👑 Haftalık Terfi</p>
            <p className="text-[11px] text-[#7E8D9F] mt-1">
              Haftayı ilk 3 içinde bitirenler bir üst lig kademesine yükselir ve özel rozetler açar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
