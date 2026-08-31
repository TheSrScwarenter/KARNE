import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Zap,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Target,
  Trophy,
  BarChart2,
  Clock,
  Coffee,
  ChevronRight,
  Award,
  Music,
  Headphones,
  Sliders,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { focusAudio } from '../lib/focusAudio';
import { studySessionsService } from '../lib/studySessionsService';

type TimerMode = 'pomodoro_25' | 'deep_50' | 'marathon_90' | 'stopwatch' | 'custom';
type SoundscapeType = 'off' | 'rain' | 'binaural' | 'brownnoise' | 'whitenoise';

const SUBJECT_OPTIONS = [
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

const MOTIVATIONAL_QUOTES = [
  { text: 'Büyük başarılar, her gün tekrarlanan küçük disiplinlerin toplamıdır.', author: 'Robert Collier' },
  { text: 'Odaklanmak, evet demek değil; diğer 100 güzel fikre hayır diyebilmektir.', author: 'Steve Jobs' },
  { text: 'Zor olanı seçenler, kolay bir gelecekle ödüllendirilir.', author: 'Marcus Aurelius' },
  { text: 'Gelecek, bugünden hazırlananlara aittir.', author: 'Mustafa Kemal Atatürk' },
  { text: 'Bir şeyi basitçe anlatamıyorsan, yeterince anlamamışsın demektir.', author: 'Richard Feynman' },
];

export const FocusRoom: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.id || 'st-demo-001';

  // Timer Configuration & State
  const [mode, setMode] = useState<TimerMode>('pomodoro_25');
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [initialDuration, setInitialDuration] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);

  // Stopwatch / Elapsed state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Subject & Micro-Task
  const [selectedSubject, setSelectedSubject] = useState<string>('Matematik');
  const [microGoal, setMicroGoal] = useState<string>('');
  const [isGoalCompleted, setIsGoalCompleted] = useState<boolean>(false);

  // Audio Soundscape
  const [activeSound, setActiveSound] = useState<SoundscapeType>('off');

  // Zen & Fullscreen
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Gamification & Dopamine XP
  const [sessionXP, setSessionXP] = useState<number>(0);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [completedStats, setCompletedStats] = useState<{ durationMins: number; xp: number; subject: string } | null>(null);

  // Daily Quick Stats
  const [todayFocusMinutes, setTodayFocusMinutes] = useState<number>(145);
  const [todayStreak, setTodayStreak] = useState<number>(14);

  const containerRef = useRef<HTMLDivElement>(null);
  const quote = useMemo(() => {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  }, [mode]);

  // Determine Dopamine Level & Multiplier
  const focusLevelInfo = useMemo(() => {
    const totalMinutes = mode === 'stopwatch' ? Math.floor(elapsedSeconds / 60) : Math.floor((initialDuration - secondsLeft) / 60);

    if (totalMinutes < 15) {
      return {
        level: 1,
        title: 'Kıvılcım Odağı',
        multiplier: '1.0x',
        flameColor: '#7E8D9F',
        glowColor: 'rgba(126, 141, 159, 0.2)',
        nextGoal: 15,
        icon: Sparkles,
      };
    } else if (totalMinutes < 30) {
      return {
        level: 2,
        title: 'Alev Akışı',
        multiplier: '1.2x',
        flameColor: '#255A8A',
        glowColor: 'rgba(37, 90, 138, 0.3)',
        nextGoal: 30,
        icon: Flame,
      };
    } else if (totalMinutes < 50) {
      return {
        level: 3,
        title: 'Ateş Topu (Derin Odak)',
        multiplier: '1.5x',
        flameColor: '#D97736',
        glowColor: 'rgba(217, 119, 54, 0.4)',
        nextGoal: 50,
        icon: Flame,
      };
    } else if (totalMinutes < 80) {
      return {
        level: 4,
        title: 'Plazma Zihni',
        multiplier: '2.0x',
        flameColor: '#8E44AD',
        glowColor: 'rgba(142, 68, 173, 0.4)',
        nextGoal: 80,
        icon: Zap,
      };
    } else {
      return {
        level: 5,
        title: 'SÜPERNOVA AKIŞI 🔥',
        multiplier: '3.0x',
        flameColor: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.5)',
        nextGoal: 120,
        icon: Award,
      };
    }
  }, [mode, elapsedSeconds, initialDuration, secondsLeft]);

  // Soundscape toggle handler
  const handleSoundChange = (sound: SoundscapeType) => {
    setActiveSound(sound);
    if (sound === 'off') {
      focusAudio.stopSoundscape();
    } else {
      focusAudio.startSoundscape(sound as any);
    }
  };

  // Change Timer Mode
  const handleModeChange = (newMode: TimerMode) => {
    if (isRunning) {
      setIsRunning(false);
    }
    setMode(newMode);
    setIsBreak(false);
    setElapsedSeconds(0);

    let duration = 25 * 60;
    if (newMode === 'pomodoro_25') duration = 25 * 60;
    else if (newMode === 'deep_50') duration = 50 * 60;
    else if (newMode === 'marathon_90') duration = 90 * 60;
    else if (newMode === 'custom') duration = customMinutes * 60;

    setInitialDuration(duration);
    setSecondsLeft(duration);
  };

  // Timer Tick Engine
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setElapsedSeconds((prev) => {
            const next = prev + 1;
            if (next % 60 === 0) {
              setSessionXP((xp) => xp + 15);
              setTodayFocusMinutes((m) => m + 1);
            }
            return next;
          });
        } else {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              // Timer Finished
              handleSessionComplete();
              return 0;
            }
            if ((initialDuration - prev) % 60 === 0 && prev !== initialDuration) {
              // Add XP per minute
              setSessionXP((xp) => xp + 15);
              setTodayFocusMinutes((m) => m + 1);
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, initialDuration]);

  // Session completion handler
  const handleSessionComplete = async () => {
    setIsRunning(false);
    focusAudio.playSuccessChime('level_up');

    const durationMins =
      mode === 'stopwatch'
        ? Math.max(1, Math.round(elapsedSeconds / 60))
        : Math.max(1, Math.round(initialDuration / 60));

    const totalXP = sessionXP + durationMins * 20 + (isGoalCompleted ? 100 : 0);

    setCompletedStats({
      durationMins,
      xp: totalXP,
      subject: selectedSubject,
    });
    setShowCelebrationModal(true);

    // Auto log to studySessionsService
    try {
      const now = new Date();
      const startD = new Date(now.getTime() - durationMins * 60 * 1000);

      await studySessionsService.addSession({
        student_id: studentId,
        subject: selectedSubject,
        topic: microGoal.trim() || undefined,
        start_time: startD.toISOString(),
        end_time: now.toISOString(),
        duration_minutes: durationMins,
        source: 'timer',
      });

      await studySessionsService.addTimeLog({
        student_id: studentId,
        type: 'study',
        subject: selectedSubject,
        topic: microGoal.trim() || undefined,
        start_time: startD.toISOString(),
        end_time: now.toISOString(),
        duration_minutes: durationMins,
      });
    } catch (e) {
      console.error('Failed to auto save focus session:', e);
    }
  };

  // Toggle Play/Pause
  const toggleTimer = () => {
    if (!isRunning) {
      focusAudio.playStartBell();
      if (activeSound !== 'off') {
        focusAudio.startSoundscape(activeSound as any);
      }
    }
    setIsRunning(!isRunning);
  };

  // Reset Timer
  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'stopwatch') {
      setElapsedSeconds(0);
    } else {
      setSecondsLeft(initialDuration);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Time format calculations
  const displaySeconds = mode === 'stopwatch' ? elapsedSeconds : secondsLeft;
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const progressPercent =
    mode === 'stopwatch'
      ? Math.min(100, (elapsedSeconds % 3600) / 36)
      : Math.min(100, Math.round(((initialDuration - secondsLeft) / initialDuration) * 100));

  const FocusIcon = focusLevelInfo.icon;

  return (
    <div
      ref={containerRef}
      id="ultra-focus-room"
      className={`min-h-[86vh] flex flex-col justify-between transition-all duration-500 rounded-3xl ${
        isZenMode
          ? 'bg-[#0B132B] text-[#F7F4EE] p-6 sm:p-12 shadow-2xl'
          : 'bg-white border border-[#DFD9CC] text-[#1B2A4A] p-4 sm:p-7 shadow-xs'
      }`}
    >
      {/* Top Bar: Mode Pills & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 border-current/10">
        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-current/5 overflow-x-auto max-w-full">
          {[
            { id: 'pomodoro_25', label: '🍅 Pomodoro (25 dk)' },
            { id: 'deep_50', label: '⚡ Derin Blok (50 dk)' },
            { id: 'marathon_90', label: '🚀 Maraton (90 dk)' },
            { id: 'stopwatch', label: '⏱️ Kronometre' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleModeChange(m.id as TimerMode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                mode === m.id
                  ? isZenMode
                    ? 'bg-[#1C2541] text-[#64DFDF] shadow-md'
                    : 'bg-[#1B2A4A] text-white shadow-xs'
                  : 'hover:bg-current/10 opacity-75'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Action Toggles: Soundscape, Zen, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Soundscape Dropdown / Selector */}
          <div className="flex items-center gap-1 bg-current/5 px-2.5 py-1 rounded-xl">
            <Headphones className="w-4 h-4 text-[#D97736]" />
            <select
              value={activeSound}
              onChange={(e) => handleSoundChange(e.target.value as SoundscapeType)}
              className={`text-xs font-bold bg-transparent focus:outline-none cursor-pointer ${
                isZenMode ? 'text-[#F7F4EE]' : 'text-[#1B2A4A]'
              }`}
            >
              <option value="off" className="bg-[#1B2A4A] text-white">Sessiz Mod</option>
              <option value="rain" className="bg-[#1B2A4A] text-white">🌧️ Yağmur Sesi</option>
              <option value="binaural" className="bg-[#1B2A4A] text-white">🧠 40Hz Gama Frekansı</option>
              <option value="brownnoise" className="bg-[#1B2A4A] text-white">🪐 Derin Kahverengi Gürültü</option>
              <option value="whitenoise" className="bg-[#1B2A4A] text-white">⚡ Beyaz Gürültü</option>
            </select>
          </div>

          {/* Zen Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsZenMode(!isZenMode)}
            title="Zen / Gece Odak Modu"
            className={`p-2 rounded-xl border transition-all ${
              isZenMode
                ? 'bg-[#64DFDF]/20 border-[#64DFDF] text-[#64DFDF]'
                : 'bg-[#F7F4EE] border-[#DFD9CC] text-[#1B2A4A] hover:bg-[#EFEBE0]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Tam Ekran"
            className={`p-2 rounded-xl border transition-all ${
              isZenMode
                ? 'bg-[#1C2541] border-white/10 text-white'
                : 'bg-[#F7F4EE] border-[#DFD9CC] text-[#1B2A4A] hover:bg-[#EFEBE0]'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Focus Stage: Timer Ring & Live Dopamine Engine */}
      <div className="flex flex-col items-center justify-center my-8 text-center relative">
        {/* Flame Level & Multiplier Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wide mb-6 border transition-all duration-500 animate-pulse"
          style={{
            borderColor: focusLevelInfo.flameColor,
            backgroundColor: focusLevelInfo.glowColor,
            color: isZenMode ? '#FFFFFF' : '#1B2A4A',
          }}
        >
          <FocusIcon className="w-4 h-4" style={{ color: focusLevelInfo.flameColor }} />
          <span>{focusLevelInfo.title}</span>
          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-mono">
            {focusLevelInfo.multiplier} XP Çarpanı
          </span>
        </div>

        {/* Giant Circular Digital Timer */}
        <div className="relative flex items-center justify-center w-72 h-72 sm:w-88 sm:h-88">
          {/* Background Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="transition-all duration-300"
              stroke={isZenMode ? 'rgba(255, 255, 255, 0.08)' : '#EFEBE0'}
              strokeWidth="5"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="transition-all duration-700 ease-out"
              stroke={isZenMode ? '#64DFDF' : focusLevelInfo.flameColor}
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Clock Display */}
          <div className="absolute flex flex-col items-center justify-center space-y-1">
            <p className="font-mono text-6xl sm:text-7xl font-black tracking-tight select-none">
              {formattedTime}
            </p>
            <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
              {isRunning ? '🔥 Odaklanma Aktif' : 'Mola / Beklemede'}
            </p>

            {/* Live XP Counter */}
            <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-[#D97736]">
              <Zap className="w-3.5 h-3.5 fill-[#D97736]" />
              <span>+{sessionXP} Odak Puanı (XP)</span>
            </div>
          </div>
        </div>

        {/* Primary Controls (Play / Pause / Reset) */}
        <div className="flex items-center gap-4 mt-8">
          <button
            type="button"
            onClick={toggleTimer}
            className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center gap-2.5 transition-all transform active:scale-95 shadow-lg ${
              isRunning
                ? 'bg-[#D97736] hover:bg-[#C06020] text-white shadow-[#D97736]/30'
                : isZenMode
                ? 'bg-[#64DFDF] hover:bg-[#48BFE3] text-[#0B132B] shadow-[#64DFDF]/30'
                : 'bg-[#1B2A4A] hover:bg-[#255A8A] text-white shadow-[#1B2A4A]/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Molaya Geç</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Odağı Başlat</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetTimer}
            title="Sıfırla"
            className="p-3.5 rounded-2xl bg-current/10 hover:bg-current/15 transition-all text-current"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSessionComplete}
            title="Oturumu Bitir ve Kaydet"
            className="px-5 py-3.5 rounded-2xl bg-[#2E6B4F] hover:bg-[#255A8A] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Oturumu Kaydet</span>
          </button>
        </div>
      </div>

      {/* Target & Micro-Task Configuration Section */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all mt-4 ${
          isZenMode ? 'bg-[#1C2541]/70 border-white/10' : 'bg-[#F7F4EE] border-[#DFD9CC]'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-bold opacity-75 mb-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#D97736]" />
              Çalışılan Ders
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border focus:outline-none ${
                isZenMode
                  ? 'bg-[#0B132B] border-white/10 text-white'
                  : 'bg-white border-[#DFD9CC] text-[#1B2A4A]'
              }`}
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub} className="text-[#1B2A4A] bg-white">
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Micro-Goal / "Bu Oturumdaki Tek Hedefim" */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold opacity-75 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
                Bu Oturumdaki Tek Görevim (Dopamin Kilidi)
              </label>
              <span className="text-[10px] font-bold text-[#2E6B4F]">+100 Bonus XP</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={microGoal}
                onChange={(e) => setMicroGoal(e.target.value)}
                placeholder="Örn: 20 Trigonometri sorusu & formülleri kağıda çıkar"
                className={`flex-1 py-2 px-3 rounded-xl text-xs border focus:outline-none placeholder:opacity-50 ${
                  isZenMode
                    ? 'bg-[#0B132B] border-white/10 text-white'
                    : 'bg-white border-[#DFD9CC] text-[#1B2A4A]'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setIsGoalCompleted(!isGoalCompleted);
                  if (!isGoalCompleted) {
                    focusAudio.playSuccessChime('milestone');
                    setSessionXP((xp) => xp + 100);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isGoalCompleted
                    ? 'bg-[#2E6B4F] text-white shadow-xs'
                    : 'bg-current/10 hover:bg-current/15 text-current'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isGoalCompleted ? 'Tamamlandı! 🎉' : 'Bitirdim'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Motivational Wisdom Quote */}
        <div className="mt-3 pt-3 border-t border-current/10 flex items-center justify-between text-[11px] opacity-75 italic">
          <p>"{quote.text}"</p>
          <span className="not-italic font-bold ml-2 shrink-0">— {quote.author}</span>
        </div>
      </div>

      {/* Bottom Live Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-current/10 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-current/5">
            <Clock className="w-4 h-4 text-[#255A8A]" />
          </div>
          <div>
            <p className="text-[10px] opacity-75 font-bold">Bugün Odak</p>
            <p className="font-extrabold">{todayFocusMinutes} Dakika</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-current/5">
            <Flame className="w-4 h-4 text-[#D97736]" />
          </div>
          <div>
            <p className="text-[10px] opacity-75 font-bold">Odak Serisi</p>
            <p className="font-extrabold text-[#D97736]">{todayStreak} Gün Kesintisiz</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-current/5">
            <Trophy className="w-4 h-4 text-[#2E6B4F]" />
          </div>
          <div>
            <p className="text-[10px] opacity-75 font-bold">Seviye & Derece</p>
            <p className="font-extrabold text-[#2E6B4F]">Lv. 7 Üstat</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-current/5">
            <Zap className="w-4 h-4 text-[#8E44AD]" />
          </div>
          <div>
            <p className="text-[10px] opacity-75 font-bold">Oturum Puanı</p>
            <p className="font-extrabold text-[#8E44AD]">+{sessionXP} XP</p>
          </div>
        </div>
      </div>

      {/* Celebration & Reward Modal */}
      {showCelebrationModal && completedStats && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DFD9CC] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D97736] px-3 py-1 bg-[#D97736]/10 rounded-full">
                Harika İş Çıkardın!
              </span>
              <h3 className="text-xl font-black text-[#1B2A4A] mt-2">
                Oturum Başarıyla Tamamlandı
              </h3>
              <p className="text-xs text-[#4A5B78] mt-1">
                Çalışma süreniz otomatik olarak koçluk günlüğünüze ve haftalık hedeflerinize kaydedildi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-[#7E8D9F] font-bold">Süre</p>
                <p className="text-base font-black text-[#1B2A4A]">{completedStats.durationMins} dk</p>
              </div>
              <div>
                <p className="text-[10px] text-[#7E8D9F] font-bold">Ders</p>
                <p className="text-base font-black text-[#255A8A]">{completedStats.subject}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#7E8D9F] font-bold">Kazanılan XP</p>
                <p className="text-base font-black text-[#D97736]">+{completedStats.xp} XP</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCelebrationModal(false);
                resetTimer();
                setSessionXP(0);
                setIsGoalCompleted(false);
                setMicroGoal('');
              }}
              className="w-full py-3 bg-[#1B2A4A] hover:bg-[#255A8A] text-white text-xs font-extrabold rounded-xl transition-all shadow-md"
            >
              Yeni Oturuma Hazırım 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
