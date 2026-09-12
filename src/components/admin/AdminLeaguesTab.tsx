import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Zap,
  Flame,
  Bot,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Power,
  Shield,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Sliders,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { leagueService, LEAGUE_TIER_META } from '../../lib/leagueService';
import { leagueBotService } from '../../lib/leagueBotService';
import { LeagueTier, LeagueBotConfig, LeagueLeaderboardUser } from '../../types';

interface LeagueOverviewItem {
  tier: LeagueTier;
  name: string;
  icon: string;
  color: string;
  minXp: number;
  participants: LeagueLeaderboardUser[];
}

export const AdminLeaguesTab: React.FC = () => {
  const [leagues, setLeagues] = useState<LeagueOverviewItem[]>([]);
  const [selectedTier, setSelectedTier] = useState<LeagueTier>('silver');
  const [bots, setBots] = useState<LeagueBotConfig[]>([]);
  const [isMasterEnabled, setIsMasterEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [botTierFilter, setBotTierFilter] = useState<'all' | LeagueTier>('all');

  // Modal for new/edit bot
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formField, setFormField] = useState<'SAY' | 'EA' | 'SOZ' | 'DIL'>('SAY');
  const [formTargetDept, setFormTargetDept] = useState('');
  const [formTier, setFormTier] = useState<LeagueTier>('silver');
  const [formBehavior, setFormBehavior] = useState<'daily_xp' | 'target_rank'>('daily_xp');
  const [formDailyXp, setFormDailyXp] = useState<number>(160);
  const [formTargetRank, setFormTargetRank] = useState<number>(2);
  const [formStreak, setFormStreak] = useState<number>(7);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const overview = await leagueService.getAllLeaguesOverview();
      setLeagues(overview);
      const allBots = leagueBotService.getAllBots();
      setBots(allBots);
      setIsMasterEnabled(leagueBotService.isMasterBotsEnabled());
    } catch (e) {
      console.error('Failed to load leagues:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleMaster = () => {
    const next = !isMasterEnabled;
    leagueBotService.setMasterBotsEnabled(next);
    setIsMasterEnabled(next);
    showToast(next ? 'Motivasyon botları genel olarak aktifleştirildi.' : 'Motivasyon botları duraklatıldı.');
    loadAll();
  };

  const handleToggleBot = (botId: string) => {
    leagueBotService.toggleBotActive(botId);
    showToast('Bot durumu güncellendi.');
    loadAll();
  };

  const handleDeleteBot = (botId: string) => {
    leagueBotService.deleteBot(botId);
    showToast('Bot silindi.');
    loadAll();
  };

  const handleGenerateFive = () => {
    leagueBotService.generateFiveBots();
    showToast('5 adet yeni motivasyon botu başarıyla oluşturuldu.');
    loadAll();
  };

  const handleResetDefaults = () => {
    leagueBotService.resetToDefaults();
    showToast('Standart motivasyon botları yeniden yüklendi.');
    loadAll();
  };

  const openNewBotModal = () => {
    setEditingBotId(null);
    setFormName('');
    setFormField('SAY');
    setFormTargetDept('');
    setFormTier(selectedTier);
    setFormBehavior('daily_xp');
    setFormDailyXp(160);
    setFormTargetRank(2);
    setFormStreak(7);
    setIsBotModalOpen(true);
  };

  const openEditBotModal = (bot: LeagueBotConfig) => {
    setEditingBotId(bot.id);
    setFormName(bot.name);
    setFormField(bot.field);
    setFormTargetDept(bot.target_department);
    setFormTier(bot.league_tier);
    setFormBehavior(bot.behavior_mode);
    setFormDailyXp(bot.daily_xp_rate);
    setFormTargetRank(bot.target_rank_position || 2);
    setFormStreak(bot.streak_days);
    setIsBotModalOpen(true);
  };

  const handleSaveBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingBotId) {
      leagueBotService.updateBot(editingBotId, {
        name: formName.trim(),
        field: formField,
        target_department: formTargetDept.trim() || 'Hedef Belirtilmedi',
        league_tier: formTier,
        behavior_mode: formBehavior,
        daily_xp_rate: Number(formDailyXp) || 120,
        target_rank_position: formBehavior === 'target_rank' ? Number(formTargetRank) : undefined,
        streak_days: Number(formStreak) || 1,
      });
      showToast('Motivasyon botu güncellendi.');
    } else {
      leagueBotService.createBot({
        name: formName.trim(),
        field: formField,
        target_department: formTargetDept.trim() || 'Hedef Belirtilmedi',
        league_tier: formTier,
        behavior_mode: formBehavior,
        daily_xp_rate: Number(formDailyXp) || 120,
        target_rank_position: formBehavior === 'target_rank' ? Number(formTargetRank) : undefined,
        streak_days: Number(formStreak) || 1,
        is_active: true,
        avatar_color: 'bg-indigo-600',
      });
      showToast('Yeni motivasyon botu oluşturuldu.');
    }

    setIsBotModalOpen(false);
    loadAll();
  };

  const activeTierObj = leagues.find((l) => l.tier === selectedTier) || leagues[0];

  const filteredBots = bots.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.target_department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTier = botTierFilter === 'all' || b.league_tier === botTierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner / Explanation */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1B2A4A] via-[#20365F] to-[#255A8A] text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/10 text-amber-300">
              <Trophy className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold">Ligler & Motivasyon Botları Masası</h2>
          </div>
          <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
            Tüm ligleri ve liglerdeki gerçek öğrencileri anlık izleyin. Öğrencilerin boş liglerde
            yalnız hissetmemesi ve tatlı rekabetle motive olabilmesi için sadece lig tablosunda
            görünen akıllı motivasyon botlarını kontrol edin.
          </p>
        </div>

        {/* Master Bot Toggle Switch */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shrink-0">
          <div className="text-right">
            <div className="text-[11px] font-bold text-white">Motivasyon Botları</div>
            <div className="text-[10px] text-white/70">
              {isMasterEnabled ? 'Aktif (Liglerde Görünür)' : 'Kapalı (Sadece Gerçek)'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleMaster}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              isMasterEnabled ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </button>
        </div>
      </div>

      {/* SECTION 1: ALL LEAGUES SELECTOR & TIER INSPECTION */}
      <div className="bento-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#D97736]" />
              <span>Tüm Liglerin Durumu & Öğrenci Mevcudu</span>
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5">
              İncelemek istediğiniz ligi seçerek ligdeki tüm öğrencileri ve botları görüntüleyin.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/20 transition-all self-start cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>

        {/* League Tiers Horizontal Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {leagues.map((l) => {
            const isSelected = l.tier === selectedTier;
            const realCount = l.participants.filter((p) => !p.is_bot).length;
            const botCount = l.participants.filter((p) => p.is_bot).length;

            return (
              <button
                key={l.tier}
                type="button"
                onClick={() => setSelectedTier(l.tier)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                  isSelected
                    ? 'border-[#0071E3] bg-[#0071E3]/5 shadow-xs ring-1 ring-[#0071E3]'
                    : 'border-black/[0.08] hover:border-black/20 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{l.icon}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/[0.04] text-[#86868B]">
                    {l.minXp}+ XP
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1D1D1F] truncate mt-2">{l.name}</div>
                  <div className="text-[10px] text-[#86868B] flex items-center gap-1 mt-0.5">
                    <span className="text-[#0071E3] font-semibold">{realCount} Gerçek</span>
                    {isMasterEnabled && botCount > 0 && (
                      <span>+ <span className="text-[#D97736] font-semibold">{botCount} Bot</span></span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Tier Participant Table */}
        {activeTierObj && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F5F5F7] p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeTierObj.icon}</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1D1D1F]">
                    {activeTierObj.name} Mevcut Sıralaması
                  </h4>
                  <p className="text-[11px] text-[#86868B]">
                    Toplam {activeTierObj.participants.length} katılımcı • Terfi Sınırı: İlk 3 • Düşme Sınırı: Son 2
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Terfi Bölgesi: 1-3. Sıra
                </span>
              </div>
            </div>

            {activeTierObj.participants.length === 0 ? (
              <div className="p-8 text-center bg-[#F5F5F7]/50 rounded-2xl border border-dashed border-black/10">
                <p className="text-xs text-[#86868B]">
                  Bu ligde şu an kayıtlı öğrenci veya bot bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-black/[0.06]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5F5F7] text-[#86868B] border-b border-black/[0.06]">
                      <th className="py-2.5 px-3 font-semibold w-12 text-center">Sıra</th>
                      <th className="py-2.5 px-3 font-semibold">Öğrenci / Hesap</th>
                      <th className="py-2.5 px-3 font-semibold">Alan & Hedef</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Haftalık Saat</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Haftalık XP</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Seri</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Hesap Türü</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] bg-white">
                    {activeTierObj.participants.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-[#F5F5F7]/50 transition-colors ${
                          user.rank_position <= 3 ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              user.rank_position === 1
                                ? 'bg-amber-400 text-amber-950 shadow-2xs'
                                : user.rank_position === 2
                                ? 'bg-slate-300 text-slate-900 shadow-2xs'
                                : user.rank_position === 3
                                ? 'bg-amber-700 text-white shadow-2xs'
                                : 'text-[#86868B]'
                            }`}
                          >
                            {user.rank_position}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-xl ${user.avatar_color} text-white flex items-center justify-center text-[10px] font-black shrink-0`}
                            >
                              {user.avatar_initials}
                            </div>
                            <span className="font-semibold text-[#1D1D1F]">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                              {user.field}
                            </span>
                            <span className="text-[#86868B] truncate max-w-[160px]">
                              {user.target_department || 'Hedef Belirtilmedi'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-[#1D1D1F]">
                          {user.weekly_study_hours} saat
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#0071E3]">
                          <span className="inline-flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {user.weekly_xp} XP
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97736]">
                            <Flame className="w-3 h-3 fill-[#D97736]" />
                            {user.streak_days} gün
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {user.is_bot ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-[#D97736] border border-[#D97736]/20">
                              <Bot className="w-3 h-3" />
                              <span>Motivasyon Botu</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <UserCheck className="w-3 h-3" />
                              <span>Gerçek Öğrenci</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: MOTIVATION BOTS MANAGEMENT DECK */}
      <div className="bento-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#0071E3]" />
              <span>Motivasyon Botları Kontrol & Yönetim Masası</span>
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5">
              Botların günlük kaç XP kazanacağını, hangi ligde yer alacağını ve hedef sıralamasını
              belirleyin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateFive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>5 Hızlı Bot Üret</span>
            </button>

            <button
              type="button"
              onClick={openNewBotModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0071E3] text-white hover:bg-[#0077ED] shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Bot Ekle</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Bot adı veya hedef bölüm ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-black/[0.08] text-xs focus:outline-hidden focus:border-[#0071E3] bg-[#F5F5F7]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#86868B]">Lig Filtresi:</span>
            <select
              value={botTierFilter}
              onChange={(e) => setBotTierFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-black/[0.08] text-xs font-semibold bg-white text-[#1D1D1F] focus:outline-hidden"
            >
              <option value="all">Tüm Ligler</option>
              <option value="bronze">Bronz</option>
              <option value="silver">Gümüş</option>
              <option value="gold">Altın</option>
              <option value="platinum">Platin</option>
              <option value="diamond">Elmas</option>
              <option value="champions">Şampiyonlar</option>
            </select>
          </div>
        </div>

        {/* Bots Grid */}
        {filteredBots.length === 0 ? (
          <div className="p-8 text-center bg-[#F5F5F7]/50 rounded-2xl border border-dashed border-black/10 space-y-2">
            <Bot className="w-8 h-8 text-[#86868B] mx-auto opacity-50" />
            <p className="text-xs text-[#86868B]">Eşleşen motivasyon botu bulunamadı.</p>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-semibold text-[#0071E3] hover:underline cursor-pointer"
            >
              Varsayılan botları yükle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBots.map((bot) => {
              const tierMeta = LEAGUE_TIER_META[bot.league_tier];

              return (
                <div
                  key={bot.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    bot.is_active
                      ? 'bg-white border-black/[0.08] shadow-xs'
                      : 'bg-[#F5F5F7]/60 border-dashed border-black/10 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl ${bot.avatar_color} text-white flex items-center justify-center text-xs font-black shrink-0`}
                      >
                        {bot.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#1D1D1F] truncate">{bot.name}</h4>
                        <p className="text-[11px] text-[#86868B] truncate">{bot.target_department}</p>
                      </div>
                    </div>

                    {/* Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleBot(bot.id)}
                      title={bot.is_active ? 'Botu Duraklat' : 'Botu Aktifleştir'}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        bot.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-black/5 text-[#86868B] border-black/10'
                      }`}
                    >
                      {bot.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                  </div>

                  {/* Settings specs */}
                  <div className="bg-[#F5F5F7] p-2.5 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#86868B]">Bulunduğu Lig:</span>
                      <span className="font-bold text-[#1D1D1F] flex items-center gap-1">
                        <span>{tierMeta?.icon}</span>
                        <span>{tierMeta?.name}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#86868B]">Kazanım Mantığı:</span>
                      <span className="font-semibold text-[#0071E3]">
                        {bot.behavior_mode === 'target_rank'
                          ? `🎯 Hedef Sıra: ${bot.target_rank_position}. Sıra`
                          : `⚡ Günlük Sabit: ${bot.daily_xp_rate} XP/gün`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#86868B]">Alan & Seri:</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {bot.field} • {bot.streak_days} gün seri
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/[0.04]">
                    <button
                      type="button"
                      onClick={() => openEditBotModal(bot)}
                      className="p-1.5 rounded-lg text-[#86868B] hover:text-[#0071E3] hover:bg-black/[0.04] transition-all cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBot(bot.id)}
                      className="p-1.5 rounded-lg text-[#86868B] hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT BOT MODAL */}
      {isBotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/[0.08] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#0071E3]" />
                <span>{editingBotId ? 'Motivasyon Botunu Düzenle' : 'Yeni Motivasyon Botu'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBotModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#86868B] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBot} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1D1D1F] mb-1">Görünen Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Kerem Y."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-[#F5F5F7] focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Alanı</label>
                  <select
                    value={formField}
                    onChange={(e) => setFormField(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-[#F5F5F7] focus:outline-hidden"
                  >
                    <option value="SAY">Sayısal (SAY)</option>
                    <option value="EA">Eşit Ağırlık (EA)</option>
                    <option value="SOZ">Sözel (SÖZ)</option>
                    <option value="DIL">Dil (DİL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">Yer Alacağı Lig</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-[#F5F5F7] focus:outline-hidden"
                  >
                    <option value="bronze">Bronz Lig</option>
                    <option value="silver">Gümüş Lig</option>
                    <option value="gold">Altın Lig</option>
                    <option value="platinum">Platin Lig</option>
                    <option value="diamond">Elmas Lig</option>
                    <option value="champions">Şampiyonlar Ligi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1D1D1F] mb-1">Hedef Bölüm</label>
                <input
                  type="text"
                  placeholder="Örn: Hacettepe Tıp Fakültesi"
                  value={formTargetDept}
                  onChange={(e) => setFormTargetDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-[#F5F5F7] focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1D1D1F] mb-1">Çalışma / XP Mantığı</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormBehavior('daily_xp')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer ${
                      formBehavior === 'daily_xp'
                        ? 'border-[#0071E3] bg-[#0071E3]/10 text-[#0071E3]'
                        : 'border-black/[0.08] text-[#86868B]'
                    }`}
                  >
                    Günlük Sabit XP
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormBehavior('target_rank')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer ${
                      formBehavior === 'target_rank'
                        ? 'border-[#0071E3] bg-[#0071E3]/10 text-[#0071E3]'
                        : 'border-black/[0.08] text-[#86868B]'
                    }`}
                  >
                    Hedef Sıralama Koru
                  </button>
                </div>
              </div>

              {formBehavior === 'daily_xp' ? (
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Günde Ne Kadar XP Kazanacak?
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="1000"
                    value={formDailyXp}
                    onChange={(e) => setFormDailyXp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-[#F5F5F7] focus:outline-hidden focus:border-[#0071E3]"
                  />
                  <p className="text-[10px] text-[#86868B] mt-1">
                    Haftanın günüyle çarpılarak haftalık lig puanı oluşturulur.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Hangi Sıralamada Kalacak?
                  </label>
                  <select
                    value={formTargetRank}
                    onChange={(e) => setFormTargetRank(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-[#F5F5F7] focus:outline-hidden"
                  >
                    <option value={1}>1. Sıra (Lider)</option>
                    <option value={2}>2. Sıra (Zirve Takipçisi)</option>
                    <option value={3}>3. Sıra (Terfi Eşiği)</option>
                    <option value={5}>5. Sıra (Orta Sıra)</option>
                  </select>
                  <p className="text-[10px] text-[#86868B] mt-1">
                    Öğrencinin puanına göre dinamik olarak puanını ayarlar ve bu sırada kalır.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#1D1D1F] mb-1">Çalışma Serisi (Gün)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formStreak}
                  onChange={(e) => setFormStreak(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-[#F5F5F7] focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsBotModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] text-[#86868B] hover:bg-black/[0.04] font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0071E3] text-white hover:bg-[#0077ED] font-semibold shadow-xs cursor-pointer"
                >
                  {editingBotId ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
