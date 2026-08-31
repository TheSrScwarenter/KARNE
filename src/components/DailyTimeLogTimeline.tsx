import React, { useState, useMemo } from 'react';
import {
  Clock,
  Coffee,
  BookOpen,
  Calendar,
  Trash2,
  Plus,
  Flame,
  CheckCircle2,
  TrendingUp,
  Sparkles,
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
    <div className="bg-white border border-[#DFD9CC] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
              GÜNLÜK SAATLİK LOG
            </span>
            <span className="text-xs font-bold text-[#D97736]">
              • Hangi Saatlerde Çalıştın & Mola Verdin?
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#1B2A4A] tracking-tight mt-1">
            Günlük Çalışma & Mola Zaman Çizelgesi
          </h2>
          <p className="text-xs text-[#4A5B78] mt-0.5">
            Günün hangi dilimlerinde derse odaklandığını ve ne kadar mola verdiğini kronolojik olarak takip et.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2 px-3.5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#D97736]" />
            <span>Saatlik Aralık Ekle</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/20 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#2E6B4F] flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Toplam Çalışma
          </span>
          <span className="text-lg sm:text-xl font-black text-[#1B2A4A] mt-1">
            {formatHoursMins(totalStudyMinutes)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#D97736]/10 border border-[#D97736]/20 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#D97736] flex items-center gap-1">
            <Coffee className="w-3.5 h-3.5" /> Toplam Mola
          </span>
          <span className="text-lg sm:text-xl font-black text-[#1B2A4A] mt-1">
            {formatHoursMins(totalBreakMinutes)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1B2A4A]/5 border border-[#1B2A4A]/15 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#1B2A4A] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#D97736]" /> Verimlilik Oranı
          </span>
          <span className="text-lg sm:text-xl font-black text-[#1B2A4A] mt-1">
            %{productivityRatio}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#7E8D9F] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Oturum Sayısı
          </span>
          <span className="text-lg sm:text-xl font-black text-[#1B2A4A] mt-1">
            {dayLogs.length} Aralık
          </span>
        </div>
      </div>

      {/* 24-HOUR VISUAL GANTT BAR TIMELINE */}
      <div className="bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[#7E8D9F] font-bold">
          <span>GÜNLÜK SAATLİK ZAMAN DAĞILIMI (06:00 – 24:00)</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[#2E6B4F]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2E6B4F]" /> Ders Çalışma
            </span>
            <span className="flex items-center gap-1 text-[#D97736]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#D97736]" /> Mola
            </span>
          </div>
        </div>

        {/* Continuous 18h Bar Container */}
        <div className="relative h-9 bg-white border border-[#DFD9CC] rounded-xl overflow-hidden shadow-2xs">
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
                className={`absolute top-0 bottom-0 flex items-center justify-center text-[10px] font-bold text-white transition-all cursor-pointer select-none group ${
                  log.type === 'study'
                    ? 'bg-[#2E6B4F] hover:bg-[#2E6B4F]/90'
                    : 'bg-[#D97736] hover:bg-[#D97736]/90'
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
        <div className="flex justify-between text-[10px] font-mono font-semibold text-[#7E8D9F] px-1">
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
          <div className="flex items-center gap-1.5 p-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-[#1B2A4A] text-white shadow-xs'
                  : 'text-[#4A5B78]'
              }`}
            >
              Tüm Kayıtlar ({dayLogs.length})
            </button>
            <button
              onClick={() => setFilterType('study')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'study'
                  ? 'bg-[#2E6B4F] text-white shadow-xs'
                  : 'text-[#4A5B78]'
              }`}
            >
              📚 Çalışmalar ({dayLogs.filter((l) => l.type === 'study').length})
            </button>
            <button
              onClick={() => setFilterType('break')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'break'
                  ? 'bg-[#D97736] text-white shadow-xs'
                  : 'text-[#4A5B78]'
              }`}
            >
              ☕ Molalar ({dayLogs.filter((l) => l.type === 'break').length})
            </button>
          </div>

          <span className="text-xs font-bold text-[#7E8D9F]">
            {selectedDate} Günlük Akışı
          </span>
        </div>

        {displayedLogs.length === 0 ? (
          <div className="p-8 text-center bg-[#F7F4EE]/50 border border-dashed border-[#DFD9CC] rounded-2xl">
            <Clock className="w-6 h-6 text-[#7E8D9F] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#1B2A4A]">
              Bu tarihte kayıtlı saatlik log bulunmuyor.
            </p>
            <p className="text-[11px] text-[#7E8D9F] mt-0.5">
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
                      ? 'bg-white border-[#DFD9CC] hover:border-[#2E6B4F]/40'
                      : 'bg-[#D97736]/5 border-[#D97736]/20 hover:border-[#D97736]/40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Time Window Badge */}
                    <div className="px-2.5 py-1.5 rounded-xl bg-[#1B2A4A] text-white font-mono font-bold text-xs flex-shrink-0">
                      {formatTimeHM(log.start_time)} – {formatTimeHM(log.end_time)}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                        isStudy
                          ? 'bg-[#2E6B4F]/10 text-[#2E6B4F]'
                          : 'bg-[#D97736]/15 text-[#D97736]'
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
                          className={`text-xs font-black ${
                            isStudy ? 'text-[#1B2A4A]' : 'text-[#D97736]'
                          }`}
                        >
                          {isStudy ? log.subject : 'Mola & Dinlenme'}
                        </span>
                        {isStudy && log.topic && (
                          <span className="text-xs text-[#4A5B78] font-medium">
                            • {log.topic}
                          </span>
                        )}
                        {!isStudy && log.note && (
                          <span className="text-xs text-[#4A5B78] font-medium italic">
                            • {log.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[#F7F4EE] border border-[#DFD9CC] text-[#1B2A4A] whitespace-nowrap">
                      {log.duration_minutes} Dakika
                    </span>

                    <button
                      onClick={() => onLogDeleted(log.id)}
                      className="p-1.5 rounded-lg text-[#7E8D9F] hover:text-[#C0392B] hover:bg-[#C0392B]/10 transition-colors"
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
          <div className="bg-white border border-[#DFD9CC] rounded-3xl p-6 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1B2A4A]">
                Saatlik Çalışma / Mola Aralığı Ekle
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#7E8D9F] hover:text-[#1B2A4A] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualLog} className="space-y-3.5">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewType('study')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    newType === 'study'
                      ? 'bg-[#1B2A4A] text-white shadow-xs'
                      : 'text-[#4A5B78]'
                  }`}
                >
                  📚 Ders Çalışması
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('break')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    newType === 'break'
                      ? 'bg-[#D97736] text-white shadow-xs'
                      : 'text-[#4A5B78]'
                  }`}
                >
                  ☕ Mola / Dinlenme
                </button>
              </div>

              {/* Duration in Minutes (Hour inputs removed as requested) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-[#7E8D9F]">
                    Süre (Dakika)
                  </label>
                  <span className="text-xs font-black text-[#1B2A4A]">{durationMinutes} Dakika</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[25, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        durationMinutes === mins
                          ? 'bg-[#1B2A4A] text-white shadow-xs'
                          : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
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
                  className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
                />
              </div>

              {/* Study specific fields */}
              {newType === 'study' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#7E8D9F] mb-1">
                      Ders
                    </label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
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
                    <label className="block text-[11px] font-bold text-[#7E8D9F] mb-1">
                      Konu (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Örn: Türev Problemleri"
                      className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none placeholder:text-[#7E8D9F]"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-[#7E8D9F] mb-1">
                    Mola Notu / Açıklama
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Örn: Kahve Molası, Yürüyüş, Yemek"
                    className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none placeholder:text-[#7E8D9F]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2 px-4 bg-[#F7F4EE] text-[#4A5B78] text-xs font-bold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl shadow-xs"
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
