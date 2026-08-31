import React, { useState } from 'react';
import { Calendar, Flame, Clock, Sparkles } from 'lucide-react';
import { DayStudyData } from '../lib/studySessionsService';

interface StudyHeatmapProps {
  days: DayStudyData[];
}

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ days }) => {
  const [hoveredDay, setHoveredDay] = useState<DayStudyData | null>(null);

  // Group 84 days into 12 weeks (each column has 7 days)
  // Let's organize days by columns (weeks)
  const weeks: DayStudyData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Calculate totals
  const totalMinutes12Weeks = days.reduce((sum, d) => sum + d.totalMinutes, 0);
  const totalHours12Weeks = (totalMinutes12Weeks / 60).toFixed(1);
  const activeDaysCount = days.filter((d) => d.totalMinutes > 0).length;
  const maxMinutesInDay = Math.max(...days.map((d) => d.totalMinutes), 0);

  // Color intensity calculator based on study duration
  const getCellColor = (minutes: number) => {
    if (minutes === 0) return 'bg-[#EFEBE0] border-[#DFD9CC] hover:border-[#1B2A4A]/40';
    if (minutes <= 60) return 'bg-[#2E6B4F]/20 border-[#2E6B4F]/30 hover:brightness-95';
    if (minutes <= 150) return 'bg-[#2E6B4F]/45 border-[#2E6B4F]/50 hover:brightness-95';
    if (minutes <= 240) return 'bg-[#2E6B4F]/75 border-[#2E6B4F]/80 hover:brightness-95';
    return 'bg-[#2E6B4F] border-[#2E6B4F] hover:brightness-110';
  };

  const formatDateTR = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    return `${day} ${month} ${parts[0]}`;
  };

  return (
    <div
      id="study-heatmap-card"
      className="bento-card p-5 sm:p-6 bg-white border-[#DFD9CC] relative"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center font-bold">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-[#1B2A4A] tracking-tight uppercase">
              12 Haftalık Çalışma Isı Haritası (Study Heatmap)
            </h3>
            <p className="text-[11px] text-[#7E8D9F]">
              Son 84 günün ders çalışma yoğunluğu ve istikrar grafiği
            </p>
          </div>
        </div>

        {/* Aggregate metric chips */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D97736]" />
            Toplam: <strong>{totalHours12Weeks} Saat</strong>
          </span>
          <span className="px-3 py-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#2E6B4F] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Aktif Gün: <strong>{activeDaysCount} / 84</strong>
          </span>
        </div>
      </div>

      {/* Heatmap Matrix Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          <div className="flex gap-2">
            {/* Day name labels column */}
            <div className="flex flex-col gap-1.5 pt-6 text-[10px] font-bold text-[#7E8D9F] select-none pr-1">
              {DAY_NAMES.map((name, idx) => (
                <div key={idx} className="h-4 sm:h-5 flex items-center justify-end">
                  {idx % 2 === 0 ? name : ''}
                </div>
              ))}
            </div>

            {/* Weeks Columns */}
            <div className="flex-1 flex gap-1.5">
              {weeks.map((week, weekIdx) => {
                // Determine label for top (Month change)
                const firstDayInWeek = week[0];
                const dateParts = firstDayInWeek.date.split('-');
                const dayNum = parseInt(dateParts[2], 10);
                const isMonthStart = dayNum <= 7 || weekIdx === 0;

                const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                const monthLabel = monthNames[parseInt(dateParts[1], 10) - 1];

                return (
                  <div key={weekIdx} className="flex-1 flex flex-col gap-1.5 min-w-[20px]">
                    {/* Month Label Header */}
                    <div className="h-4 text-[10px] font-bold text-[#7E8D9F] truncate text-center">
                      {isMonthStart ? monthLabel : ''}
                    </div>

                    {/* 7 Days in Week */}
                    {week.map((day, dayIdx) => (
                      <div
                        key={dayIdx}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-4 sm:h-5 rounded-[4px] sm:rounded-md border transition-all cursor-pointer ${getCellColor(
                          day.totalMinutes
                        )}`}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip Banner & Legend Footer */}
      <div className="mt-4 pt-3 border-t border-[#DFD9CC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        {/* Dynamic Tooltip */}
        <div className="min-h-[22px] flex items-center">
          {hoveredDay ? (
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B2A4A]">
              <span className="text-[#D97736]">{formatDateTR(hoveredDay.date)}:</span>
              {hoveredDay.totalMinutes > 0 ? (
                <span>
                  {Math.floor(hoveredDay.totalMinutes / 60)} sa {hoveredDay.totalMinutes % 60} dk
                  ({hoveredDay.sessionCount} oturum)
                  {Object.keys(hoveredDay.subjectBreakdown).length > 0 && (
                    <span className="text-[#4A5B78] font-normal ml-1">
                      — {Object.entries(hoveredDay.subjectBreakdown).map(([s, m]) => `${s}: ${m}dk`).join(', ')}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[#7E8D9F] font-medium">Bu gün çalışma kaydedilmedi</span>
              )}
            </div>
          ) : (
            <span className="text-[#7E8D9F] text-[11px]">
              Detayları görmek için gün kutucuklarının üzerine gelin.
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-[#7E8D9F] font-bold self-end sm:self-auto">
          <span>Az</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-xs bg-[#EFEBE0] border border-[#DFD9CC]" title="0 dk" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#2E6B4F]/20 border border-[#2E6B4F]/30" title="1-60 dk" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#2E6B4F]/45 border border-[#2E6B4F]/50" title="61-150 dk" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#2E6B4F]/75 border border-[#2E6B4F]/80" title="151-240 dk" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#2E6B4F] border border-[#2E6B4F]" title="240+ dk" />
          </div>
          <span>Çok</span>
        </div>
      </div>
    </div>
  );
};
