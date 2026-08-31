import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  BookOpen,
  Coffee,
  Sun,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { studySessionsService, ActiveTimerState } from '../lib/studySessionsService';

const YKS_SUBJECTS = [
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
  'Diğer',
];

const BREAK_PRESETS = [
  'Kısa Dinlenme & Su',
  'Kahve / Çay Molası',
  'Öğle / Akşam Yemeği',
  'Yürüyüş & Hava Alma',
  'Göz Dinlendirme',
];

interface StudyTimerWidgetProps {
  studentId: string;
  onSessionSaved: () => void;
}

export const StudyTimerWidget: React.FC<StudyTimerWidgetProps> = ({
  studentId,
  onSessionSaved,
}) => {
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [subject, setSubject] = useState<string>('Matematik');
  const [topic, setTopic] = useState<string>('');
  const [breakNote, setBreakNote] = useState<string>('Kahve / Çay Molası');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [segmentStartTime, setSegmentStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Accumulated segments in the active continuous session
  const [sessionSegments, setSessionSegments] = useState<
    {
      type: 'study' | 'break';
      subject?: string;
      topic?: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      note?: string;
    }[]
  >([]);

  const timerRef = useRef<number | null>(null);

  // Restore ongoing timer from localStorage on mount
  useEffect(() => {
    const savedState = studySessionsService.getActiveTimer();
    if (savedState) {
      setMode(savedState.mode || 'study');
      setSubject(savedState.subject || 'Matematik');
      setTopic(savedState.topic || '');
      setSegmentStartTime(savedState.startTime);
      setIsPaused(savedState.isPaused);
      if (savedState.sessionSegments) {
        setSessionSegments(savedState.sessionSegments);
      }

      if (savedState.isPaused) {
        setElapsedSeconds(savedState.elapsedSeconds || 0);
        setIsRunning(true);
      } else {
        const now = Date.now();
        const totalElapsed =
          (savedState.elapsedSeconds || 0) +
          Math.floor((now - savedState.startTime) / 1000);
        setElapsedSeconds(Math.max(0, totalElapsed));
        setIsRunning(true);
      }
    }
  }, []);

  // Timer ticker loop
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next % 5 === 0 && segmentStartTime) {
            studySessionsService.saveActiveTimer({
              mode,
              subject,
              topic,
              startTime: segmentStartTime,
              elapsedSeconds: next,
              isPaused: false,
              sessionSegments,
            });
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, isPaused, segmentStartTime, mode, subject, topic, sessionSegments]);

  // Start study timer
  const handleStartStudy = () => {
    const now = Date.now();
    setMode('study');
    setSegmentStartTime(now);
    setIsRunning(true);
    setIsPaused(false);
    setElapsedSeconds(0);

    studySessionsService.saveActiveTimer({
      mode: 'study',
      subject,
      topic,
      startTime: now,
      elapsedSeconds: 0,
      isPaused: false,
      sessionSegments,
    });
  };

  // Switch to Break (Mola Ver)
  const handleSwitchToBreak = async () => {
    const now = Date.now();
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const startIso = segmentStartTime
      ? new Date(segmentStartTime).toISOString()
      : new Date(now - durationMinutes * 60000).toISOString();
    const endIso = new Date(now).toISOString();

    // Record study segment
    const newSegment = {
      type: 'study' as const,
      subject,
      topic: topic.trim() || undefined,
      startTime: startIso,
      endTime: endIso,
      durationMinutes,
    };

    // Save to daily time logs
    try {
      await studySessionsService.addTimeLog({
        student_id: studentId,
        type: 'study',
        subject,
        topic: topic.trim() || undefined,
        start_time: startIso,
        end_time: endIso,
        duration_minutes: durationMinutes,
      });
    } catch (e) {
      console.warn('Failed to add study time log:', e);
    }

    const updatedSegments = [...sessionSegments, newSegment];
    setSessionSegments(updatedSegments);

    // Switch to break mode
    setMode('break');
    setSegmentStartTime(now);
    setElapsedSeconds(0);
    setIsPaused(false);

    studySessionsService.saveActiveTimer({
      mode: 'break',
      subject,
      topic,
      startTime: now,
      elapsedSeconds: 0,
      isPaused: false,
      sessionSegments: updatedSegments,
    });
  };

  // Switch back to Study (Molayı Bitir & Çalışmaya Dön)
  const handleSwitchToStudy = async () => {
    const now = Date.now();
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const startIso = segmentStartTime
      ? new Date(segmentStartTime).toISOString()
      : new Date(now - durationMinutes * 60000).toISOString();
    const endIso = new Date(now).toISOString();

    // Record break segment
    const newSegment = {
      type: 'break' as const,
      startTime: startIso,
      endTime: endIso,
      durationMinutes,
      note: breakNote,
    };

    // Save break to daily time logs
    try {
      await studySessionsService.addTimeLog({
        student_id: studentId,
        type: 'break',
        start_time: startIso,
        end_time: endIso,
        duration_minutes: durationMinutes,
        note: breakNote,
      });
    } catch (e) {
      console.warn('Failed to add break time log:', e);
    }

    const updatedSegments = [...sessionSegments, newSegment];
    setSessionSegments(updatedSegments);

    // Switch back to study mode
    setMode('study');
    setSegmentStartTime(now);
    setElapsedSeconds(0);
    setIsPaused(false);

    studySessionsService.saveActiveTimer({
      mode: 'study',
      subject,
      topic,
      startTime: now,
      elapsedSeconds: 0,
      isPaused: false,
      sessionSegments: updatedSegments,
    });
  };

  const handlePause = () => {
    setIsPaused(true);
    if (segmentStartTime) {
      studySessionsService.saveActiveTimer({
        mode,
        subject,
        topic,
        startTime: segmentStartTime,
        elapsedSeconds,
        isPaused: true,
        pausedAt: Date.now(),
        sessionSegments,
      });
    }
  };

  const handleResume = () => {
    const now = Date.now();
    setSegmentStartTime(now);
    setIsPaused(false);
    studySessionsService.saveActiveTimer({
      mode,
      subject,
      topic,
      startTime: now,
      elapsedSeconds,
      isPaused: false,
      sessionSegments,
    });
  };

  // Complete and save entire session
  const handleStopAndSave = async () => {
    setSaving(true);
    const now = Date.now();
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const startIso = segmentStartTime
      ? new Date(segmentStartTime).toISOString()
      : new Date(now - durationMinutes * 60000).toISOString();
    const endIso = new Date(now).toISOString();

    try {
      // Save last segment
      if (mode === 'study') {
        await studySessionsService.addTimeLog({
          student_id: studentId,
          type: 'study',
          subject,
          topic: topic.trim() || undefined,
          start_time: startIso,
          end_time: endIso,
          duration_minutes: durationMinutes,
        });

        // Also add total study session to study_sessions table
        const totalStudyMins =
          sessionSegments
            .filter((s) => s.type === 'study')
            .reduce((sum, s) => sum + s.durationMinutes, 0) + durationMinutes;

        await studySessionsService.addSession({
          student_id: studentId,
          subject,
          topic: topic.trim() || undefined,
          start_time:
            sessionSegments.length > 0 ? sessionSegments[0].startTime : startIso,
          end_time: endIso,
          duration_minutes: totalStudyMins,
          source: 'timer',
        });
      } else {
        await studySessionsService.addTimeLog({
          student_id: studentId,
          type: 'break',
          start_time: startIso,
          end_time: endIso,
          duration_minutes: durationMinutes,
          note: breakNote,
        });

        // Save study sessions if any were accumulated
        const studySegs = sessionSegments.filter((s) => s.type === 'study');
        if (studySegs.length > 0) {
          const totalStudyMins = studySegs.reduce((sum, s) => sum + s.durationMinutes, 0);
          await studySessionsService.addSession({
            student_id: studentId,
            subject,
            topic: topic.trim() || undefined,
            start_time: studySegs[0].startTime,
            end_time: studySegs[studySegs.length - 1].endTime,
            duration_minutes: totalStudyMins,
            source: 'timer',
          });
        }
      }

      // Clear state
      studySessionsService.saveActiveTimer(null);
      setIsRunning(false);
      setIsPaused(false);
      setSegmentStartTime(null);
      setElapsedSeconds(0);
      setSessionSegments([]);

      setSuccessToast(`Oturum ve saatlik zaman logları başarıyla kaydedildi!`);
      setTimeout(() => setSuccessToast(null), 4000);

      onSessionSaved();
    } catch (err) {
      console.error('Failed to save timer session:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (
      window.confirm(
        'Devam eden kronometreyi iptal etmek istediğinize emin misiniz? Kayıt tutulmayacak.'
      )
    ) {
      studySessionsService.saveActiveTimer(null);
      setIsRunning(false);
      setIsPaused(false);
      setSegmentStartTime(null);
      setElapsedSeconds(0);
      setSessionSegments([]);
    }
  };

  // Format HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return {
      hh: String(hours).padStart(2, '0'),
      mm: String(minutes).padStart(2, '0'),
      ss: String(seconds).padStart(2, '0'),
    };
  };

  const { hh, mm, ss } = formatTime(elapsedSeconds);

  return (
    <div
      id="study-timer-widget"
      className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all ${
        mode === 'break' && isRunning
          ? 'border-[#D97736]/40 bg-gradient-to-r from-white via-[#F7F4EE] to-[#D97736]/5'
          : 'border-[#DFD9CC]'
      }`}
    >
      {/* Background Subtle Gradient Glow */}
      {isRunning && !isPaused && (
        <div
          className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl -z-0 pointer-events-none ${
            mode === 'study' ? 'bg-[#2E6B4F]/10' : 'bg-[#D97736]/15'
          }`}
        />
      )}

      {/* Success Notification Toast */}
      {successToast && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/30 text-[#2E6B4F] text-xs font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 relative z-10">
        {/* Left: Configuration & State Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                mode === 'study'
                  ? 'bg-[#1B2A4A] text-white'
                  : 'bg-[#D97736] text-white'
              }`}
            >
              {mode === 'study' ? 'DERS ÇALIŞMA' : 'MOLA ZAMANI'}
            </span>

            <span className="text-xs font-bold text-[#4A5B78] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D97736]" /> Canlı Saatlik Çalışma & Mola Sayacı
            </span>

            {isRunning && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 ${
                  isPaused
                    ? 'bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/30'
                    : mode === 'study'
                    ? 'bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/30 animate-pulse'
                    : 'bg-[#D97736]/15 text-[#D97736] border border-[#D97736]/40 animate-pulse'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPaused
                      ? 'bg-[#D97736]'
                      : mode === 'study'
                      ? 'bg-[#2E6B4F]'
                      : 'bg-[#D97736]'
                  }`}
                />
                {isPaused
                  ? 'DURAKLATILDI'
                  : mode === 'study'
                  ? 'DERS KAYDI AKTİF'
                  : 'MOLA KAYDI AKTİF'}
              </span>
            )}
          </div>

          {/* Mode Specific Controls */}
          {mode === 'study' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Subject Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#1B2A4A]" />
                  Ders Seçimi
                </label>
                <select
                  id="timer-subject-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isRunning && !isPaused}
                  className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] disabled:opacity-85"
                >
                  {YKS_SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[#1B2A4A]" />
                  Konu / Hedef (Opsiyonel)
                </label>
                <input
                  id="timer-topic-input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Örn: Türev - Ekstremum Noktalar"
                  className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] placeholder:text-[#7E8D9F]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#D97736] uppercase tracking-wider flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5" />
                Mola Açıklaması / Tipi
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BREAK_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBreakNote(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      breakNote === preset
                        ? 'bg-[#D97736] text-white font-bold'
                        : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0] border border-[#DFD9CC]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Continuous Session Segments breadcrumb */}
          {sessionSegments.length > 0 && (
            <div className="pt-2 border-t border-[#DFD9CC]/60 flex items-center gap-2 overflow-x-auto text-[11px] text-[#4A5B78]">
              <span className="font-bold text-[#1B2A4A] whitespace-nowrap">Bugünkü Oturum Akışı:</span>
              {sessionSegments.map((seg, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
                    seg.type === 'study'
                      ? 'bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20'
                      : 'bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/20'
                  }`}
                >
                  {seg.type === 'study' ? '📚' : '☕'} {seg.type === 'study' ? seg.subject : 'Mola'}:{' '}
                  {seg.durationMinutes} dk
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Middle & Right: Digital Chronometer Display & Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between lg:justify-end gap-5 bg-[#F7F4EE] border border-[#DFD9CC] p-4 rounded-2xl">
          {/* Digital Timer Counter */}
          <div className="text-center sm:text-left flex items-baseline gap-1 font-mono select-none">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-black text-[#1B2A4A] tracking-wider leading-none">
                {hh}
              </span>
              <span className="text-[9px] text-[#7E8D9F] font-sans font-bold uppercase mt-0.5">
                Saat
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-[#7E8D9F] mx-0.5">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-black text-[#1B2A4A] tracking-wider leading-none">
                {mm}
              </span>
              <span className="text-[9px] text-[#7E8D9F] font-sans font-bold uppercase mt-0.5">
                Dakika
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-[#7E8D9F] mx-0.5">:</span>
            <div className="flex flex-col items-center">
              <span
                className={`text-3xl sm:text-4xl font-black tracking-wider leading-none ${
                  mode === 'study' ? 'text-[#2E6B4F]' : 'text-[#D97736]'
                }`}
              >
                {ss}
              </span>
              <span className="text-[9px] text-[#7E8D9F] font-sans font-bold uppercase mt-0.5">
                Saniye
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {!isRunning ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-start-study-timer"
                  onClick={handleStartStudy}
                  className="py-3 px-5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current text-[#D97736]" />
                  <span>Çalışmayı Başlat</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mola Ver / Çalışmaya Dön Toggle Button */}
                {mode === 'study' ? (
                  <button
                    id="btn-take-break"
                    onClick={handleSwitchToBreak}
                    className="py-2.5 px-4 bg-[#D97736] hover:bg-[#D97736]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    title="Mola başlatır ve çalışma aralığını kaydeder"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Mola Ver</span>
                  </button>
                ) : (
                  <button
                    id="btn-resume-study-mode"
                    onClick={handleSwitchToStudy}
                    className="py-2.5 px-4 bg-[#2E6B4F] hover:bg-[#2E6B4F]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    title="Molayı tamamlar ve ders çalışmaya döner"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Molayı Bitir & Derse Dön</span>
                  </button>
                )}

                {/* Pause / Resume */}
                {isPaused ? (
                  <button
                    onClick={handleResume}
                    className="py-2.5 px-3 bg-white hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] text-xs font-bold rounded-xl transition-all"
                    title="Sayacı Sürdür"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="py-2.5 px-3 bg-white hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] text-xs font-bold rounded-xl transition-all"
                    title="Duraklat"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Finish & Save All */}
                <button
                  id="btn-stop-timer"
                  onClick={handleStopAndSave}
                  disabled={saving}
                  className="py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  title="Tüm oturumu ve logları kaydet"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-[#C0392B]" />
                  <span>{saving ? 'Kaydediliyor...' : 'Bitir & Kaydet'}</span>
                </button>

                {/* Discard */}
                <button
                  id="btn-discard-timer"
                  onClick={handleDiscard}
                  className="p-2.5 rounded-xl bg-white hover:bg-[#EFEBE0] text-[#7E8D9F] hover:text-[#C0392B] border border-[#DFD9CC] transition-colors"
                  title="İptal Et"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
