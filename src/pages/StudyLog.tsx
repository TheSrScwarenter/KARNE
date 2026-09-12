import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Plus,
  Search,
  Calendar,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  BarChart3,
  Timer,
  FileEdit,
  Zap,
  CalendarDays,
  ListFilter,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StudySession, TimeLogEntry } from '../types';
import { studySessionsService } from '../lib/studySessionsService';
import { DailyTimeLogTimeline } from '../components/DailyTimeLogTimeline';
import { ManualSessionModal } from '../components/ManualSessionModal';
import { WeeklyTargetCard } from '../components/WeeklyTargetCard';
import { WeeklyBarChart } from '../components/WeeklyBarChart';
import { StudyHeatmap } from '../components/StudyHeatmap';

const SUBJECT_COLORS: Record<string, string> = {
  Matematik: 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20',
  Fizik: 'bg-[#5856D6]/10 text-[#5856D6] border-[#5856D6]/20',
  Kimya: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20',
  Biyoloji: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20',
  Türkçe: 'bg-[#FF2D55]/10 text-[#FF2D55] border-[#FF2D55]/20',
  Geometri: 'bg-[#AF52DE]/10 text-[#AF52DE] border-[#AF52DE]/20',
  Tarih: 'bg-[#A2845E]/10 text-[#A2845E] border-[#A2845E]/20',
  Coğrafya: 'bg-[#30B0C7]/10 text-[#30B0C7] border-[#30B0C7]/20',
  Felsefe: 'bg-[#8E8E93]/10 text-[#8E8E93] border-[#8E8E93]/20',
  'Din Kültürü': 'bg-[#63E6E2]/10 text-[#007A78] border-[#63E6E2]/30',
  'Genel Deneme': 'bg-[#0071E3]/15 text-[#0071E3] border-[#0071E3]/30',
  Diğer: 'bg-[#8E8E93]/10 text-[#8E8E93] border-[#8E8E93]/20',
};

export const StudyLog: React.FC = () => {
  const { user, navigate } = useAuth();
  const studentId = user?.id || 'st-demo-001';

  const [activeTab, setActiveTab] = useState<'analytics' | 'timeline' | 'history'>('analytics');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLogEntry[]>([]);
  const [targetMinutes, setTargetMinutes] = useState<number>(1800); // 30 hours
  const [loading, setLoading] = useState<boolean>(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Filters for historical table
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'this_week' | '30days' | '12weeks' | 'all'>('this_week');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load study sessions, time logs & user weekly target
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedSessions, fetchedLogs, fetchedTarget] = await Promise.all([
        studySessionsService.getSessions(studentId),
        studySessionsService.getTimeLogs(studentId),
        studySessionsService.getWeeklyTargetMinutes(studentId),
      ]);
      setSessions(fetchedSessions);
      setTimeLogs(fetchedLogs);
      setTargetMinutes(fetchedTarget);
    } catch (err) {
      console.error('Failed to load study sessions data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogDeleted = async (id: string) => {
    await studySessionsService.deleteTimeLog(id);
    setTimeLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleDeleteSession = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await studySessionsService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  // Compute stats for current week & heatmap
  const weekStats = useMemo(() => {
    return studySessionsService.getCurrentWeekStats(sessions);
  }, [sessions]);

  const heatmapDays = useMemo(() => {
    return studySessionsService.getHeatmapData(sessions);
  }, [sessions]);

  // Filtered sessions for the historical list
  const filteredSessions = useMemo(() => {
    const now = new Date();
    let minTime = 0;

    if (dateRange === 'this_week') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      minTime = monday.getTime();
    } else if (dateRange === '30days') {
      minTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    } else if (dateRange === '12weeks') {
      minTime = now.getTime() - 84 * 24 * 60 * 60 * 1000;
    }

    return sessions.filter((s) => {
      if (selectedSubject !== 'all' && s.subject !== selectedSubject) {
        return false;
      }
      if (selectedSource !== 'all' && s.source !== selectedSource) {
        return false;
      }
      if (minTime > 0) {
        const sTime = new Date(s.start_time).getTime();
        if (sTime < minTime) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sub = s.subject.toLowerCase();
        const top = (s.topic || '').toLowerCase();
        if (!sub.includes(q) && !top.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, selectedSubject, selectedSource, dateRange, searchQuery]);

  const filteredTotalMinutes = useMemo(() => {
    return filteredSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  }, [filteredSessions]);

  const filteredTotalHours = (filteredTotalMinutes / 60).toFixed(1);
  const avgSessionMinutes = filteredSessions.length > 0 ? Math.round(filteredTotalMinutes / filteredSessions.length) : 0;

  const formatDateTR = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const availableSubjects = useMemo(() => {
    const list = Array.from(new Set(sessions.map((s) => s.subject)));
    return list.sort();
  }, [sessions]);

  return (
    <div id="study-log-page" className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
              DÜZENLİ ÇALIŞMA GÜNLÜĞÜ
            </span>
            <span className="text-xs text-[#86868B] font-medium">YKS 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight">
            Çalışma Günlüğü & Analiz
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B] mt-1">
            Haftalık çalışma grafikleri, günlük zaman çizelgesi ve geçmiş seans kayıtları
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-full border border-black/[0.08] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] transition-colors cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-open-manual-session-modal"
            onClick={() => setIsManualModalOpen(true)}
            className="apple-btn-secondary py-2.5 px-4 text-xs font-medium rounded-full inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0071E3]" />
            <span>Manuel Giriş Ekle</span>
          </button>
        </div>
      </div>

      {/* Focus Room Banner (Apple Clean Style) */}
      <div className="bento-card p-5 sm:p-6 bg-white border border-black/[0.06] text-[#1D1D1F] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20 flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20 px-2.5 py-0.5 rounded-full">
                YENİ
              </span>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#1D1D1F]">
                Dikkat Dağıtmayan Odak Kronometresi
              </h3>
            </div>
            <p className="text-xs text-[#86868B] mt-1 max-w-xl">
              Canlı süre sayacı, arka plan ambiyans sesleri ve dopamin çarpanlarıyla ders çalışmaya hemen başlayın.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/focus')}
          className="apple-btn-primary w-full md:w-auto px-5 py-2.5 text-xs font-semibold rounded-full flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Odak Odasına Geç</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3-Tab Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] rounded-full border border-black/[0.06] w-fit overflow-x-auto">
        {[
          { id: 'analytics', label: '📊 Haftalık Rapor & Grafikler', icon: BarChart3 },
          { id: 'timeline', label: '📅 Günlük Zaman Çizelgesi', icon: CalendarDays },
          { id: 'history', label: `📋 Tüm Kayıtlar (${sessions.length})`, icon: ListFilter },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Haftalık Rapor & Grafikler */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WeeklyTargetCard
              studentId={studentId}
              weeklyTotalMinutes={weekStats.totalMinutes}
              targetMinutes={targetMinutes}
              onTargetUpdated={(newTarget) => setTargetMinutes(newTarget)}
            />

            <WeeklyBarChart
              data={weekStats.chartData}
              totalMinutes={weekStats.totalMinutes}
            />
          </div>

          <StudyHeatmap days={heatmapDays} />
        </div>
      )}

      {/* TAB 2: Günlük Zaman Çizelgesi */}
      {activeTab === 'timeline' && (
        <div>
          <DailyTimeLogTimeline
            logs={timeLogs}
            onLogDeleted={handleLogDeleted}
            onLogAdded={loadData}
            studentId={studentId}
          />
        </div>
      )}

      {/* TAB 3: Tüm Kayıtlar & Filtreleme */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bento-card bg-white border border-black/[0.06] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1D1D1F]">
                <SlidersHorizontal className="w-4 h-4 text-[#0071E3]" />
                <span>Kayıt Filtreleri ve Arama</span>
              </div>

              {(selectedSubject !== 'all' || selectedSource !== 'all' || dateRange !== 'this_week' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedSubject('all');
                    setSelectedSource('all');
                    setDateRange('this_week');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-medium text-[#FF3B30] hover:underline cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#86868B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Konu veya ders ara..."
                  className="apple-input w-full pl-9!"
                />
              </div>

              {/* Subject Filter */}
              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="apple-input w-full"
                >
                  <option value="all">Tüm Dersler ({sessions.length})</option>
                  {availableSubjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="apple-input w-full"
                >
                  <option value="all">Tüm Kaynaklar</option>
                  <option value="timer">⏱️ Sadece Canlı Timer</option>
                  <option value="manual">✍️ Sadece Manuel Giriş</option>
                </select>
              </div>

              {/* Date Range Selector */}
              <div>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="apple-input w-full"
                >
                  <option value="this_week">Bu Hafta (Pzt – Paz)</option>
                  <option value="30days">Son 30 Gün</option>
                  <option value="12weeks">Son 12 Hafta</option>
                  <option value="all">Tüm Zamanlar</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Summary Metrics */}
            <div className="pt-2 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-[#86868B]">
              <div className="flex items-center gap-4">
                <span>
                  Listelenen: <strong className="text-[#1D1D1F] font-semibold">{filteredSessions.length} Oturum</strong>
                </span>
                <span>
                  Toplam Süre: <strong className="text-[#0071E3] font-semibold">{filteredTotalHours} Saat</strong> ({filteredTotalMinutes} dk)
                </span>
                <span>
                  Ortalama Seans: <strong className="text-[#1D1D1F] font-semibold">{avgSessionMinutes} dk</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-medium">
                  ⏱️ Timer: {filteredSessions.filter((s) => s.source === 'timer').length}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] font-medium">
                  ✍️ Manuel: {filteredSessions.filter((s) => s.source === 'manual').length}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Study Sessions List */}
          <div className="bento-card bg-white border border-black/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F5F5F7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold text-xs">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-[#1D1D1F] tracking-tight">
                  Çalışma Geçmişi ve Oturum Kayıtları
                </h2>
              </div>
              <span className="text-xs font-medium text-[#86868B]">
                {filteredSessions.length} Kayıt
              </span>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] text-[#86868B] flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">Kayıt Bulunamadı</h3>
                <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
                  Seçilen filtre kriterlerine uygun çalışma kaydı bulunmuyor. Yeni bir çalışma başlatabilir veya manuel giriş ekleyebilirsiniz.
                </p>
                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="apple-btn-primary mt-4 px-4 py-2 text-xs font-medium rounded-full inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manuel Giriş Ekle</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06]">
                {filteredSessions.map((session) => {
                  const hours = Math.floor((session.duration_minutes || 0) / 60);
                  const mins = (session.duration_minutes || 0) % 60;
                  const formattedDuration = hours > 0 ? `${hours} sa ${mins > 0 ? `${mins} dk` : ''}` : `${mins} dk`;
                  const subjectStyle = SUBJECT_COLORS[session.subject] || SUBJECT_COLORS['Diğer'];

                  return (
                    <div
                      key={session.id}
                      className="p-4 sm:px-6 hover:bg-[#F5F5F7]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        {/* Subject Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${subjectStyle} whitespace-nowrap`}
                        >
                          {session.subject}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">
                              {session.topic || 'Genel Konu Tekrarı & Soru Çözümü'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#86868B]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateTR(session.start_time)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Duration, Source & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.04]">
                        {/* Source Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                            session.source === 'timer'
                              ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'
                              : 'bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20'
                          }`}
                        >
                          {session.source === 'timer' ? (
                            <>
                              <Timer className="w-3 h-3" /> Canlı Timer
                            </>
                          ) : (
                            <>
                              <FileEdit className="w-3 h-3" /> Manuel
                            </>
                          )}
                        </span>

                        {/* Duration Badge */}
                        <div className="text-right min-w-[70px]">
                          <span className="text-xs sm:text-sm font-bold text-[#1D1D1F] block">
                            {formattedDuration}
                          </span>
                          <span className="text-[10px] text-[#86868B]">
                            {session.duration_minutes} dk
                          </span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-2 rounded-full text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
                          title="Kayıt Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Session Modal */}
      <ManualSessionModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={loadData}
        studentId={studentId}
      />
    </div>
  );
};
