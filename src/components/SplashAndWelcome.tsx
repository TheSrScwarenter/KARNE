import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Target,
  BrainCircuit,
  Clock,
  HelpCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SplashAndWelcomeProps {
  onComplete: () => void;
}

export const SplashAndWelcome: React.FC<SplashAndWelcomeProps> = ({ onComplete }) => {
  const { switchDemoRole } = useAuth();
  const [stage, setStage] = useState<'loading' | 'welcome'>('loading');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<'student' | 'coach'>('student');

  // 7 seconds (7000ms) progressive loading duration
  useEffect(() => {
    const totalDurationMs = 7000;
    const intervalMs = 50;
    const totalSteps = totalDurationMs / intervalMs;
    const increment = 100 / totalSteps;

    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setStage('welcome'), 350);
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, []);

  const handleStart = (role: 'student' | 'coach') => {
    switchDemoRole(role);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#1B2A4A] text-[#F7F4EE] flex items-center justify-center font-sans">
      {/* Background ambient aesthetic blurs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#255A8A]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#D97736]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1B2A4A]/50 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {stage === 'loading' ? (
          /* STAGE 1: Minimalist High-End Loading Screen */
          <motion.div
            key="loading-stage"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center text-center p-6 max-w-sm w-full relative z-10"
          >
            {/* Animated Brand Emblem */}
            <div className="relative mb-6">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 8,
                  ease: 'linear',
                }}
                className="w-20 h-20 rounded-3xl border-2 border-[#D97736]/60 border-dashed absolute -inset-1"
              />
              <div className="w-18 h-18 rounded-2xl overflow-hidden shadow-2xl relative border-2 border-white/20">
                <img
                  src="/logo.jpg"
                  alt="Karne Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 justify-center">
              <span>Karne</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#D97736] text-white font-mono font-bold">
                YKS 2026
              </span>
            </h1>
            <p className="text-xs text-[#9BB1D0] mt-1.5 font-medium">
              Yeni Nesil YKS Çalışma & Koçluk Ekosistemi
            </p>

            {/* Progress Bar Container */}
            <div className="w-full mt-8 bg-white/10 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[#255A8A] via-[#D97736] to-[#2E6B4F] rounded-full"
                style={{ width: `${Math.min(100, Math.round(loadingProgress))}%` }}
                transition={{ ease: 'linear', duration: 0.05 }}
              />
            </div>

            <div className="flex items-center justify-between w-full mt-3 text-[11px] font-mono text-[#7E8D9F]">
              <span className="flex items-center gap-1.5 truncate max-w-[240px]">
                <Cloud className="w-3.5 h-3.5 text-[#D97736] animate-pulse shrink-0" />
                <span className="truncate">
                  {loadingProgress < 25
                    ? 'YKS 2026 Müfredatı Yükleniyor...'
                    : loadingProgress < 55
                    ? 'AI Soru & Teşhis Motoru Başlatılıyor...'
                    : loadingProgress < 85
                    ? 'Deneme & Ders İstatistikleri Hazırlanıyor...'
                    : 'Karne Ekosistemi Hazır!'}
                </span>
              </span>
              <span className="font-bold text-white/90 shrink-0">%{Math.min(100, Math.round(loadingProgress))}</span>
            </div>
          </motion.div>
        ) : (
          /* STAGE 2: Interactive Welcome & Role Onboarding Screen */
          <motion.div
            key="welcome-stage"
            initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl mx-4 bg-[#F7F4EE] text-[#1B2A4A] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#DFD9CC] relative z-10 my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Header Banner */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B2A4A]/5 border border-[#1B2A4A]/15 text-xs font-bold text-[#1B2A4A] mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
                <span>YKS 2026 Geri Sayımı Başladı</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1B2A4A] tracking-tight">
                Karne Platformuna Hoş Geldin! 🎯
              </h2>
              <p className="text-xs sm:text-sm text-[#4A5B78] mt-2 max-w-lg mx-auto leading-relaxed">
                YKS 2026 hazırlık sürecini yanlış soru analizleri, süre takibi, deneme net grafikleri ve Gemini 3.7 AI ders programı ile zirveye taşı.
              </p>
            </div>

            {/* Platform Feature Highlight Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              <div className="p-3 rounded-2xl bg-white border border-[#DFD9CC] flex flex-col items-center text-center shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center mb-2">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#1B2A4A]">Soru Bankası</span>
                <span className="text-[10px] text-[#7E8D9F] mt-0.5">AI Hata Teşhisi</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#DFD9CC] flex flex-col items-center text-center shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#255A8A]/10 text-[#255A8A] flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#1B2A4A]">Çalışma Logu</span>
                <span className="text-[10px] text-[#7E8D9F] mt-0.5">12 Hafta Isı Haritası</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#DFD9CC] flex flex-col items-center text-center shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center mb-2">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#1B2A4A]">Deneme Analizi</span>
                <span className="text-[10px] text-[#7E8D9F] mt-0.5">TYT / AYT Trendleri</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#DFD9CC] flex flex-col items-center text-center shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center mb-2">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#1B2A4A]">AI Program</span>
                <span className="text-[10px] text-[#7E8D9F] mt-0.5">Zayıf Konu Odaklı</span>
              </div>
            </div>

            {/* Role Selection Bento */}
            <div className="space-y-3 mb-6 sm:mb-8">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#4A5B78] text-center">
                Deneyimlemek İstediğin Rolü Seç
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                    selectedRole === 'student'
                      ? 'bg-white border-[#1B2A4A] shadow-md scale-[1.01]'
                      : 'bg-[#EFEBE0]/60 border-[#DFD9CC] hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#255A8A]/10 text-[#255A8A] flex items-center justify-center mb-2">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    {selectedRole === 'student' && (
                      <CheckCircle2 className="w-5 h-5 text-[#2E6B4F]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1B2A4A]">Öğrenci Paneli</h3>
                    <p className="text-[11px] text-[#4A5B78] mt-1 leading-snug">
                      Soruları kaydet, süreni tut, denemelerini gir ve AI destekli haftalık ders programını takip et.
                    </p>
                  </div>
                </button>

                {/* Coach Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('coach')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                    selectedRole === 'coach'
                      ? 'bg-white border-[#1B2A4A] shadow-md scale-[1.01]'
                      : 'bg-[#EFEBE0]/60 border-[#DFD9CC] hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center mb-2">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    {selectedRole === 'coach' && (
                      <CheckCircle2 className="w-5 h-5 text-[#2E6B4F]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1B2A4A]">Koç & Danışman Paneli</h3>
                    <p className="text-[11px] text-[#4A5B78] mt-1 leading-snug">
                      Öğrencilerini yönet, deneme gelişimlerini izle, koçluk notları yaz ve AI program taslaklarını onayla.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-center sm:text-left text-[11px] text-[#7E8D9F]">
                <span>İstediğin zaman sol menüden rolünü değiştirebilirsin.</span>
              </div>

              <button
                type="button"
                onClick={() => handleStart(selectedRole)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#1B2A4A] hover:bg-[#255A8A] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 min-h-[48px]"
              >
                <span>Uygulamaya Başla</span>
                <ArrowRight className="w-4 h-4 text-[#D97736]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
