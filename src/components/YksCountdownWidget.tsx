import React, { useState, useEffect } from 'react';
import { Target, Sparkles, Calendar, ChevronDown, Check, Flame } from 'lucide-react';
import {
  calculateYksCountdown,
  YksCountdownData,
  ExamSessionType,
  TARGET_YEAR_STORAGE_KEY,
  TARGET_SESSION_STORAGE_KEY,
  getDefaultTargetYear,
  getDefaultSessionType,
} from '../lib/yksCountdown';

interface YksCountdownWidgetProps {
  compact?: boolean;
}

export const YksCountdownWidget: React.FC<YksCountdownWidgetProps> = ({ compact = false }) => {
  const [selectedYear, setSelectedYear] = useState<number>(getDefaultTargetYear);
  const [selectedSession, setSelectedSession] = useState<ExamSessionType>(getDefaultSessionType);
  const [countdown, setCountdown] = useState<YksCountdownData>(() =>
    calculateYksCountdown(selectedYear, selectedSession)
  );
  const [showYearMenu, setShowYearMenu] = useState(false);

  // Sync with storage and external changes
  useEffect(() => {
    const handleStorage = () => {
      setSelectedYear(getDefaultTargetYear());
      setSelectedSession(getDefaultSessionType());
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('yks-target-changed', handleStorage as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('yks-target-changed', handleStorage as EventListener);
    };
  }, []);

  // Live countdown tick every 1000ms
  useEffect(() => {
    setCountdown(calculateYksCountdown(selectedYear, selectedSession));
    const interval = setInterval(() => {
      setCountdown(calculateYksCountdown(selectedYear, selectedSession));
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedYear, selectedSession]);

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    try {
      localStorage.setItem(TARGET_YEAR_STORAGE_KEY, String(year));
      window.dispatchEvent(new CustomEvent('yks-target-changed', { detail: { year, session: selectedSession } }));
    } catch {}
    setShowYearMenu(false);
  };

  const handleSelectSession = (session: ExamSessionType) => {
    setSelectedSession(session);
    try {
      localStorage.setItem(TARGET_SESSION_STORAGE_KEY, session);
      window.dispatchEvent(new CustomEvent('yks-target-changed', { detail: { year: selectedYear, session } }));
    } catch {}
  };

  if (compact) {
    return (
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setShowYearMenu(!showYearMenu)}
          id="yks-compact-countdown-btn"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-[#0071E3]/10 text-[#0071E3] hover:bg-[#0071E3]/20 border border-[#0071E3]/25 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
          title="Hedef yılı veya sınav oturumunu değiştirmek için tıklayın"
        >
          <Calendar className="w-3.5 h-3.5 text-[#0071E3] shrink-0" />
          <span className="hidden sm:inline font-extrabold whitespace-nowrap">{selectedSession} {selectedYear}:</span>
          <span className="sm:hidden font-extrabold text-[11px] text-[#0071E3]">{selectedSession}</span>
          <span className="font-mono tracking-tight font-black whitespace-nowrap">
            {countdown.days}<span className="sm:hidden text-[11px]">g</span><span className="hidden sm:inline"> Gün</span>
          </span>
          <span className="hidden xl:inline text-[11px] font-mono text-[#0071E3]/80">
            {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </span>
          <ChevronDown className={`w-3 h-3 text-[#0071E3] shrink-0 transition-transform duration-200 ${showYearMenu ? 'rotate-180' : ''}`} />
        </button>

        {showYearMenu && (
          <div
            id="compact-yks-dropdown-menu"
            className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/[0.08] p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider px-2 pb-1.5 border-b border-black/[0.04] mb-2 flex items-center justify-between">
              <span>Hedef Yılı Seç</span>
              <span className="text-[10px] text-[#34C759] font-semibold">Canlı Sayaç</span>
            </div>

            <div className="grid grid-cols-3 gap-1 mb-2">
              {[2025, 2026, 2027].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleSelectYear(yr)}
                  className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                    selectedYear === yr
                      ? 'bg-[#0071E3] text-white shadow-xs'
                      : 'bg-black/[0.04] text-[#1D1D1F] hover:bg-black/[0.08]'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            <div className="flex rounded-xl bg-black/[0.04] p-1 gap-1">
              {(['TYT', 'AYT'] as ExamSessionType[]).map((sess) => (
                <button
                  key={sess}
                  type="button"
                  onClick={() => handleSelectSession(sess)}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedSession === sess ? 'bg-white text-[#0071E3] shadow-xs' : 'text-[#86868B]'
                  }`}
                >
                  {sess}
                </button>
              ))}
            </div>

            <div className="mt-2.5 pt-2 border-t border-black/[0.04] text-[10px] text-[#86868B] text-center">
              ÖSYM Takvimi: {countdown.formattedTargetDate}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="yks-countdown-bento-widget" className="bento-card p-6 flex flex-col justify-between bg-white border border-black/[0.06] shadow-xs">
      {/* Top Header & Year Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-extrabold text-[#86868B] uppercase tracking-wider">
            {selectedSession} {selectedYear} Canlı Sayaç
          </span>
          <span className="w-2 h-2 rounded-full bg-[#34C759] animate-ping" title="Canlı Zaman Senkronize" />
        </div>

        {/* Year Selector Pills */}
        <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-black/[0.04]">
          {[2025, 2026, 2027].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => handleSelectYear(yr)}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedYear === yr
                  ? 'bg-white text-[#0071E3] shadow-xs font-extrabold'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Main Days Figure & Session Switcher */}
      <div className="my-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <p className="text-4xl sm:text-5xl font-black text-[#1D1D1F] tracking-tight">
              {countdown.days}
            </p>
            <span className="text-sm font-bold text-[#86868B]">
              Gün Kaldı
            </span>
          </div>

          {/* Session Switch (TYT / AYT) */}
          <div className="flex rounded-xl bg-[#F5F5F7] p-1 border border-black/[0.04]">
            {(['TYT', 'AYT'] as ExamSessionType[]).map((sess) => (
              <button
                key={sess}
                type="button"
                onClick={() => handleSelectSession(sess)}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  selectedSession === sess
                    ? 'bg-[#0071E3] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {sess}
              </button>
            ))}
          </div>
        </div>

        {/* Live Hours, Minutes, Seconds with Real-Time Pulse */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-black/[0.04] text-center">
          <div className="p-2 rounded-xl bg-[#F5F5F7] border border-black/[0.02]">
            <span className="block text-sm font-black text-[#1D1D1F] font-mono">
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-[#86868B]">Saat</span>
          </div>
          <div className="p-2 rounded-xl bg-[#F5F5F7] border border-black/[0.02]">
            <span className="block text-sm font-black text-[#1D1D1F] font-mono">
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-[#86868B]">Dakika</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0071E3]/5 border border-[#0071E3]/20">
            <span className="block text-sm font-black text-[#0071E3] font-mono animate-pulse">
              {String(countdown.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-[#0071E3]">Saniye (Aktif)</span>
          </div>
        </div>

        {/* Annual Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#86868B] mb-1">
            <span>Sezon İlerlemesi</span>
            <span className="text-[#0071E3]">%{countdown.progressPercent}</span>
          </div>
          <div className="w-full h-1.5 bg-[#EBEBF0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0071E3] to-[#34C759] rounded-full transition-all duration-500"
              style={{ width: `${countdown.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Target Exam Date Pill */}
      <div className="p-2.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] flex items-center justify-between text-xs mt-1">
        <span className="text-[#86868B] flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#0071E3]" />
          <span>Resmi Oturum:</span>
        </span>
        <span className="font-bold text-[#1D1D1F] text-right truncate">
          {countdown.formattedTargetDate}
        </span>
      </div>
    </div>
  );
};
