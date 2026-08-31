import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Plus,
  Filter,
  Search,
  Calendar,
  Tag,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  BarChart3,
  Layers,
  Timer,
  FileEdit,
  TrendingUp,
  Sparkles,
  Zap,
  CalendarDays,
  ListFilter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StudySession, SessionSource, TimeLogEntry } from '../types';
import { studySessionsService, DayStudyData } from '../lib/studySessionsService';
import { DailyTimeLogTimeline } from '../components/DailyTimeLogTimeline';
import { ManualSessionModal } from '../components/ManualSessionModal';
import { WeeklyTargetCard } from '../components/WeeklyTargetCard';
import { WeeklyBarChart } from '../components/WeeklyBarChart';
import { StudyHeatmap } from '../components/StudyHeatmap';

const SUBJECT_COLORS: Record<string, string> = {
  Matematik: 'bg-[#1B2A4A]/10 text-[#1B2A4A] border-[#1B2A4A]/30',
  Fizik: 'bg-[#255A8A]/10 text-[#255A8A] border-[#255A8A]/30',
  Kimya: 'bg-[#D97736]/10 text-[#D97736] border-[#D97736]/30',
  Biyoloji: 'bg-[#2E6B4F]/10 text-[#2E6B4F] border-[#2E6B4F]/30',
  Türkçe: 'bg-[#C0392B]/10 text-[#C0392B] border-[#C0392B]/30',
  Geometri: 'bg-[#4A3E72]/10 text-[#4A3E72] border-[#4A3E72]/30',
  Tarih: 'bg-[#8B5A2B]/10 text-[#8B5A2B] border-[#8B5A2B]/30',
  Coğrafya: 'bg-[#3B7A57]/10 text-[#3B7A57] border-[#3B7A57]/30',
  Felsefe: 'bg-[#6C757D]/10 text-[#6C757D] border-[#6C757D]/30',
  'Din Kültürü': 'bg-[#5C6F84]/10 text-[#5C6F84] border-[#5C6F84]/30',
  'Genel Deneme': 'bg-[#1B2A4A]/15 text-[#1B2A4A] border-[#1B2A4A]/40',
  Diğer: 'bg-[#7E8D9F]/10 text-[#7E8D9F] border-[#7E8D9F]/30',
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
      {/* Top Header & Navigation Banner to Focus Room */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20">
              DÜZENLİ ÇALIŞMA GÜNLÜĞÜ
            </span>
            <span className="text-xs text-[#7E8D9F] font-bold">YKS 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A4A] tracking-tight">
            Çalışma Günlüğü & Analiz
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B78] mt-1">
            Haftalık çalışma grafikleri, günlük zaman çizelgesi ve geçmiş seans kayıtları
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-[#DFD9CC] bg-white hover:bg-[#EFEBE0] text-[#1B2A4A] transition-colors"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-open-manual-session-modal"
            onClick={() => setIsManualModalOpen(true)}
            className="py-2.5 px-4 bg-white border border-[#DFD9CC] hover:bg-[#F7F4EE] text-[#1B2A4A] text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#D97736]" />
            <span>Manuel Giriş Ekle</span>
          </button>
        </div>
      </div>

      {/* Hero Invitation to the Ultra-Cool Dopamine Focus Room */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#1B2A4A] via-[#255A8A] to-[#1B2A4A] text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Flame className="w-7 h-7 text-[#D97736] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#D97736] text-white px-2 py-0.5 rounded-md">
                YENİ
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Dikkat Dağıtmayan Odak Kronometresi
              </h3>
            </div>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              1000000x cool arayüz, 40Hz binaural & yağmur sesleri, seviye atlama çarpanları ve dopamin ödülleriyle ders çalışmaya hemen başla!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/focus')}
          className="w-full md:w-auto px-6 py-3 bg-[#D97736] hover:bg-[#C06020] text-white text-xs font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 transform active:scale-95"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Odak Odasına Geç 🚀</span>
        </button>
      </div>

      {/* Crisp 3-Tab Selector to Eliminate Sensory Overload */}
      <div className="flex items-center gap-2 border-b border-[#DFD9CC] pb-3 overflow-x-auto">
        {[
          { id: 'analytics', label: '📊 Haftalık Rapor & Grafikler', icon: BarChart3 },
          { id: 'timeline', label: '📅 Günlük Zaman Çizelgesi', icon: CalendarDays },
          { id: 'history', label: `📋 Tüm Kayıtlar (${sessions.length})`, icon: ListFilter },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'bg-white border border-[#DFD9CC] text-[#4A5B78] hover:bg-[#F7F4EE]'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Haftalık Rapor & Grafikler */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Bento Grid: Weekly Target & Weekly Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* 12-Week Study Heatmap */}
          <StudyHeatmap days={heatmapDays} />
        </div>
      )}

      {/* TAB 2: Günlük Zaman Çizelgesi */}
      {activeTab === 'timeline' && (
        <div className="animate-in fade-in-50 duration-200">
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
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Filter Toolbar */}
          <div className="bg-white border border-[#DFD9CC] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1B2A4A]">
                <SlidersHorizontal className="w-4 h-4 text-[#D97736]" />
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
                  className="text-[11px] font-bold text-[#C0392B] hover:underline"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#7E8D9F]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Konu veya ders ara..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] placeholder:text-[#7E8D9F]"
                />
              </div>

              {/* Subject Filter */}
              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
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
                  className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
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
                  className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                >
                  <option value="this_week">Bu Hafta (Pzt – Paz)</option>
                  <option value="30days">Son 30 Gün</option>
                  <option value="12weeks">Son 12 Hafta</option>
                  <option value="all">Tüm Zamanlar</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Summary Metrics */}
            <div className="pt-2 border-t border-[#DFD9CC] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7E8D9F]">
              <div className="flex items-center gap-4">
                <span>
                  Listelenen: <strong>{filteredSessions.length} Oturum</strong>
                </span>
                <span>
                  Toplam Süre: <strong className="text-[#1B2A4A]">{filteredTotalHours} Saat</strong> ({filteredTotalMinutes} dk)
                </span>
                <span>
                  Ortalama Seans: <strong>{avgSessionMinutes} dk</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-[#1B2A4A]/10 text-[#1B2A4A] font-bold">
                  ⏱️ Timer: {filteredSessions.filter((s) => s.source === 'timer').length}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#255A8A]/10 text-[#255A8A] font-bold">
                  ✍️ Manuel: {filteredSessions.filter((s) => s.source === 'manual').length}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Study Sessions List */}
          <div className="bg-white border border-[#DFD9CC] rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1B2A4A] text-white flex items-center justify-center font-bold text-xs">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-extrabold text-[#1B2A4A] tracking-tight">
                  Çalışma Geçmişi ve Oturum Kayıtları
                </h2>
              </div>
              <span className="text-xs font-bold text-[#7E8D9F]">
                {filteredSessions.length} Kayıt
              </span>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] text-[#7E8D9F] flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1B2A4A]">Kayıt Bulunamadı</h3>
                <p className="text-xs text-[#7E8D9F] mt-1 max-w-sm mx-auto">
                  Seçilen filtre kriterlerine uygun çalışma kaydı bulunmuyor. Yeni bir çalışma başlatabilir veya manuel giriş ekleyebilirsiniz.
                </p>
                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D97736]" />
                  <span>Manuel Giriş Ekle</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#DFD9CC]">
                {filteredSessions.map((session) => {
                  const hours = Math.floor((session.duration_minutes || 0) / 60);
                  const mins = (session.duration_minutes || 0) % 60;
                  const formattedDuration = hours > 0 ? `${hours} sa ${mins > 0 ? `${mins} dk` : ''}` : `${mins} dk`;
                  const subjectStyle = SUBJECT_COLORS[session.subject] || SUBJECT_COLORS['Diğer'];

                  return (
                    <div
                      key={session.id}
                      className="p-4 sm:px-6 hover:bg-[#F7F4EE]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        {/* Subject Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${subjectStyle} whitespace-nowrap`}
                        >
                          {session.subject}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-[#1B2A4A]">
                              {session.topic || 'Genel Konu Tekrarı & Soru Çözümü'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#7E8D9F]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#7E8D9F]" />
                              {formatDateTR(session.start_time)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Duration, Source & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DFD9CC]/50">
                        {/* Source Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                            session.source === 'timer'
                              ? 'bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20'
                              : 'bg-[#255A8A]/10 text-[#255A8A] border border-[#255A8A]/20'
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
                          <span className="text-xs sm:text-sm font-black text-[#1B2A4A] block">
                            {formattedDuration}
                          </span>
                          <span className="text-[10px] text-[#7E8D9F]">
                            {session.duration_minutes} dk
                          </span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-2 rounded-lg text-[#7E8D9F] hover:text-[#C0392B] hover:bg-[#C0392B]/10 transition-colors"
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
