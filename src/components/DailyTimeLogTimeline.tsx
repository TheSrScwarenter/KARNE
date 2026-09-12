import React, { useState, useMemo } from 'react';
import {
  Clock,
  Coffee,
  BookOpen,
  Trash2,
  Plus,
  TrendingUp,
  X,
} from 'lucide-react';
import { TimeLogEntry, TimeLogType } from '../types';
import { studySessionsService } from '../lib/studySessionsService';

interface DailyTimeLogTimelineProps {
  logs: TimeLogEntry[];
  onLogDeleted: (id: string) => void;
  onLogAdded: () => void;
  studentId: string;
}

export const DailyTimeLogTimeline: React.FC<DailyTimeLogTimelineProps> = ({
  logs,
  onLogDeleted,
  onLogAdded,
  studentId,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  });

  const [filterType, setFilterType] = useState<'all' | 'study' | 'break'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Manual Add Form State
  const [newType, setNewType] = useState<TimeLogType>('study');
  const [newSubject, setNewSubject] = useState<string>('Matematik');
  const [newTopic, setNewTopic] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter logs for selected date
  const dayLogs = useMemo(() => {
    return logs
      .filter((l) => l.start_time.startsWith(selectedDate))
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  }, [logs, selectedDate]);

  // Display filtered logs
  const displayedLogs = useMemo(() => {
    if (filterType === 'all') return dayLogs;
    return dayLogs.filter((l) => l.type === filterType);
  }, [dayLogs, filterType]);

  // Daily totals
  const totalStudyMinutes = useMemo(() => {
    return dayLogs
      .filter((l) => l.type === 'study')
      .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  }, [dayLogs]);

  const totalBreakMinutes = useMemo(() => {
    return dayLogs
      .filter((l) => l.type === 'break')
      .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  }, [dayLogs]);

  const productivityRatio = useMemo(() => {
    const total = totalStudyMinutes + totalBreakMinutes;
    if (total === 0) return 0;
    return Math.round((totalStudyMinutes / total) * 100);
  }, [totalStudyMinutes, totalBreakMinutes]);

  const formatHoursMins = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} dk`;
    if (m === 0) return `${h} saat`;
    return `${h} sa ${m} dk`;
  };

  const formatTimeHM = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  const handleAddManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const diffMinutes = Math.max(5, durationMinutes || 45);
      const startD = new Date(selectedDate);
      const now = new Date();
      startD.setHours(now.getHours(), now.getMinutes(), 0, 0);

      const endD = new Date(startD.getTime() + diffMinutes * 60 * 1000);

      await studySessionsService.addTimeLog({
        student_id: studentId,
        type: newType,
        subject: newType === 'study' ? newSubject : undefined,
        topic: newType === 'study' ? newTopic.trim() || undefined : undefined,
        note: newType === 'break' ? newNote.trim() || 'Mola' : undefined,
        start_time: startD.toISOString(),
        end_time: endD.toISOString(),
        duration_minutes: diffMinutes,
      });

      // If it's a study session, also push to study_sessions
      if (newType === 'study') {
        await studySessionsService.addSession({
          student_id: studentId,
          subject: newSubject,
          topic: newTopic.trim() || undefined,
          start_time: startD.toISOString(),
          end_time: endD.toISOString(),
          duration_minutes: diffMinutes,
          source: 'manual',
        });
      }

      setIsAddModalOpen(false);
      onLogAdded();
    } catch (err) {
      console.error('Failed to add manual log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 24-Hour Timeline Segments (06:00 to 24:00 daytime window = 18 hours = 1080 minutes)
  const DAY_START_MINUTES = 6 * 60; // 06:00
  const DAY_TOTAL_MINUTES = 18 * 60; // Until 24:00

  return (
    <div className="bento-card p-5 sm:p-6 bg-white border border-black/[0.06] space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
              GÜNLÜK SAATLİK LOG
            </span>
            <span className="text-xs font-medium text-[#86868B]">
              • Saatlik Akış
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F] tracking-tight">
            Günlük Çalışma & Mola Zaman Çizelgesi
          </h2>
          <p className="text-xs text-[#86868B] mt-0.5">
            Günün hangi dilimlerinde derse odaklandığınızı ve molalarınızı kronolojik olarak takip edin.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-1.5 px-3 bg-[#F5F5F7] border border-black/[0.08] rounded-full text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="apple-btn-primary py-1.5 px-3.5 text-xs font-medium rounded-full inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Saatlik Aralık Ekle</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#34C759] flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Toplam Çalışma
          </span>
          <span className="text-lg sm:text-xl font-bold text-[#1D1D1F] mt-1">
            {formatHoursMins(totalStudyMinutes)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FF9500]/10 border border-[#FF9500]/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#FF9500] flex items-center gap-1">
            <Coffee className="w-3.5 h-3.5" /> Toplam Mola
          </span>
          <span className="text-lg sm:text-xl font-bold text-[#1D1D1F] mt-1">
            {formatHoursMins(totalBreakMinutes)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0071E3]/10 border border-[#0071E3]/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#0071E3] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Verimlilik Oranı
          </span>
          <span className="text-lg sm:text-xl font-bold text-[#1D1D1F] mt-1">
            %{productivityRatio}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#86868B] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Oturum Sayısı
          </span>
          <span className="text-lg sm:text-xl font-bold text-[#1D1D1F] mt-1">
            {dayLogs.length} Aralık
          </span>
        </div>
      </div>

      {/* 24-HOUR VISUAL GANTT BAR TIMELINE */}
      <div className="bg-[#F5F5F7] border border-black/[0.06] rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[#86868B] font-medium">
          <span>GÜNLÜK SAATLİK ZAMAN DAĞILIMI (06:00 – 24:00)</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[#34C759]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" /> Ders Çalışma
            </span>
            <span className="flex items-center gap-1 text-[#FF9500]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" /> Mola
            </span>
          </div>
        </div>

        {/* Continuous 18h Bar Container */}
        <div className="relative h-8 bg-white border border-black/[0.06] rounded-full overflow-hidden shadow-xs">
          {dayLogs.map((log) => {
            const st = new Date(log.start_time);
            const startMins = st.getHours() * 60 + st.getMinutes();
            const relStart = Math.max(0, startMins - DAY_START_MINUTES);
            const duration = log.duration_minutes || 15;

            const leftPct = (relStart / DAY_TOTAL_MINUTES) * 100;
            const widthPct = Math.max(1, (duration / DAY_TOTAL_MINUTES) * 100);

            if (leftPct > 100 || leftPct + widthPct < 0) return null;

            return (
              <div
                key={log.id}
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.min(widthPct, 100 - leftPct)}%`,
                }}
                className={`absolute top-0 bottom-0 flex items-center justify-center text-[10px] font-semibold text-white transition-all cursor-pointer select-none group ${
                  log.type === 'study'
                    ? 'bg-[#34C759] hover:bg-[#34C759]/90'
                    : 'bg-[#FF9500] hover:bg-[#FF9500]/90'
                }`}
                title={`${formatTimeHM(log.start_time)} - ${formatTimeHM(
                  log.end_time
                )}: ${log.type === 'study' ? log.subject : log.note || 'Mola'} (${
                  log.duration_minutes
                } dk)`}
              >
                <span className="truncate px-1 opacity-90 group-hover:opacity-100 hidden sm:inline">
                  {log.type === 'study' ? log.subject : 'Mola'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hour markers ruler */}
        <div className="flex justify-between text-[10px] font-medium text-[#86868B] px-1">
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span>21:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* FILTER & CHRONOLOGICAL LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex p-0.5 bg-[#F5F5F7] rounded-full border border-black/[0.06]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#86868B]'
              }`}
            >
              Tüm Kayıtlar ({dayLogs.length})
            </button>
            <button
              onClick={() => setFilterType('study')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filterType === 'study'
                  ? 'bg-[#34C759] text-white shadow-xs'
                  : 'text-[#86868B]'
              }`}
            >
              📚 Çalışmalar ({dayLogs.filter((l) => l.type === 'study').length})
            </button>
            <button
              onClick={() => setFilterType('break')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filterType === 'break'
                  ? 'bg-[#FF9500] text-white shadow-xs'
                  : 'text-[#86868B]'
              }`}
            >
              ☕ Molalar ({dayLogs.filter((l) => l.type === 'break').length})
            </button>
          </div>

          <span className="text-xs font-medium text-[#86868B]">
            {selectedDate} Günlük Akışı
          </span>
        </div>

        {displayedLogs.length === 0 ? (
          <div className="p-8 text-center bg-[#F5F5F7]/70 border border-dashed border-black/[0.08] rounded-2xl">
            <Clock className="w-6 h-6 text-[#86868B] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#1D1D1F]">
              Bu tarihte kayıtlı saatlik log bulunmuyor.
            </p>
            <p className="text-[11px] text-[#86868B] mt-0.5">
              Yukarıdaki kronometreden çalışmaya başlayabilir veya manuel aralık ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedLogs.map((log) => {
              const isStudy = log.type === 'study';
              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isStudy
                      ? 'bg-white border-black/[0.06] hover:border-[#34C759]/40'
                      : 'bg-[#FF9500]/5 border-[#FF9500]/20 hover:border-[#FF9500]/40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Time Window Badge */}
                    <div className="px-2.5 py-1.5 rounded-xl bg-[#1D1D1F] text-white font-mono font-semibold text-xs shrink-0">
                      {formatTimeHM(log.start_time)} – {formatTimeHM(log.end_time)}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                        isStudy
                          ? 'bg-[#34C759]/10 text-[#34C759]'
                          : 'bg-[#FF9500]/15 text-[#FF9500]'
                      }`}
                    >
                      {isStudy ? (
                        <BookOpen className="w-3.5 h-3.5" />
                      ) : (
                        <Coffee className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold ${
                            isStudy ? 'text-[#1D1D1F]' : 'text-[#FF9500]'
                          }`}
                        >
                          {isStudy ? log.subject : 'Mola & Dinlenme'}
                        </span>
                        {isStudy && log.topic && (
                          <span className="text-xs text-[#86868B] font-normal">
                            • {log.topic}
                          </span>
                        )}
                        {!isStudy && log.note && (
                          <span className="text-xs text-[#86868B] font-normal italic">
                            • {log.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F5F7] border border-black/[0.04] text-[#1D1D1F] whitespace-nowrap">
                      {log.duration_minutes} Dakika
                    </span>

                    <button
                      onClick={() => onLogDeleted(log.id)}
                      className="p-1.5 rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
                      title="Log Sil"
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

      {/* MANUAL LOG ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bento-card bg-white border border-black/[0.08] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D1D1F]">
                Saatlik Çalışma / Mola Aralığı Ekle
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/[0.05] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualLog} className="space-y-3.5">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5F5F7] border border-black/[0.06] rounded-full">
                <button
                  type="button"
                  onClick={() => setNewType('study')}
                  className={`py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                    newType === 'study'
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#86868B]'
                  }`}
                >
                  📚 Ders Çalışması
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('break')}
                  className={`py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                    newType === 'break'
                      ? 'bg-[#FF9500] text-white shadow-xs'
                      : 'text-[#86868B]'
                  }`}
                >
                  ☕ Mola / Dinlenme
                </button>
              </div>

              {/* Duration in Minutes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-medium text-[#86868B]">
                    Süre (Dakika)
                  </label>
                  <span className="text-xs font-bold text-[#1D1D1F]">{durationMinutes} Dakika</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[25, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        durationMinutes === mins
                          ? 'bg-[#0071E3] text-white shadow-xs'
                          : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {mins} dk
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="5"
                  max="360"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  placeholder="Özel süre (dk)"
                  className="apple-input w-full"
                />
              </div>

              {/* Study specific fields */}
              {newType === 'study' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868B] mb-1">
                      Ders
                    </label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="apple-input w-full"
                    >
                      {[
                        'Matematik',
                        'Fizik',
                        'Kimya',
                        'Biyoloji',
                        'Türkçe',
                        'Geometri',
                        'Tarih',
                        'Coğrafya',
                        'Felsefe',
                        'Din Kültürü',
                        'Genel Deneme',
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868B] mb-1">
                      Konu (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Örn: Türev Problemleri"
                      className="apple-input w-full"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-[#86868B] mb-1">
                    Mola Notu / Açıklama
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Örn: Kahve Molası, Yürüyüş, Yemek"
                    className="apple-input w-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="apple-btn-secondary px-4 py-2 text-xs font-medium rounded-full cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="apple-btn-primary px-5 py-2 text-xs font-medium rounded-full cursor-pointer"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Aralığı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
