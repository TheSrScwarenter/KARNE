import React, { useState } from 'react';
import { ProgramItem } from '../types';
import {
  Sparkles,
  Clock,
  UserCheck,
  Calendar,
  Plus,
  LayoutGrid,
  CheckCircle2,
  Circle,
  Target,
  MessageSquare,
  Filter,
  Check,
} from 'lucide-react';

interface WeeklyCalendarViewProps {
  items: ProgramItem[];
  onItemClick: (item: ProgramItem) => void;
  onAddItem: (dayIndex: number) => void;
  onToggleComplete?: (itemId: string, completed: boolean) => void;
  readOnly?: boolean;
}

const DAYS = [
  { id: 0, name: 'Pazartesi', short: 'Pzt' },
  { id: 1, name: 'Salı', short: 'Sal' },
  { id: 2, name: 'Çarşamba', short: 'Çar' },
  { id: 3, name: 'Perşembe', short: 'Per' },
  { id: 4, name: 'Cuma', short: 'Cum' },
  { id: 5, name: 'Cumartesi', short: 'Cmt' },
  { id: 6, name: 'Pazar', short: 'Paz' },
];

const SUBJECT_THEMES: Record<
  string,
  { bg: string; border: string; text: string; badge: string; iconBg: string }
> = {
  Matematik: {
    bg: 'bg-[#1B2A4A]/5',
    border: 'border-[#1B2A4A]/25',
    text: 'text-[#1B2A4A]',
    badge: 'bg-[#1B2A4A] text-white',
    iconBg: 'bg-[#1B2A4A]/10 text-[#1B2A4A]',
  },
  Fizik: {
    bg: 'bg-[#255A8A]/5',
    border: 'border-[#255A8A]/25',
    text: 'text-[#255A8A]',
    badge: 'bg-[#255A8A] text-white',
    iconBg: 'bg-[#255A8A]/10 text-[#255A8A]',
  },
  Kimya: {
    bg: 'bg-[#D97736]/5',
    border: 'border-[#D97736]/25',
    text: 'text-[#D97736]',
    badge: 'bg-[#D97736] text-white',
    iconBg: 'bg-[#D97736]/10 text-[#D97736]',
  },
  Biyoloji: {
    bg: 'bg-[#2E6B4F]/5',
    border: 'border-[#2E6B4F]/25',
    text: 'text-[#2E6B4F]',
    badge: 'bg-[#2E6B4F] text-white',
    iconBg: 'bg-[#2E6B4F]/10 text-[#2E6B4F]',
  },
  Türkçe: {
    bg: 'bg-[#8B5CF6]/5',
    border: 'border-[#8B5CF6]/25',
    text: 'text-[#8B5CF6]',
    badge: 'bg-[#8B5CF6] text-white',
    iconBg: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  },
  Geometri: {
    bg: 'bg-[#0D9488]/5',
    border: 'border-[#0D9488]/25',
    text: 'text-[#0D9488]',
    badge: 'bg-[#0D9488] text-white',
    iconBg: 'bg-[#0D9488]/10 text-[#0D9488]',
  },
  'TYT Deneme': {
    bg: 'bg-[#D97736]/10',
    border: 'border-[#D97736]/40',
    text: 'text-[#1B2A4A]',
    badge: 'bg-[#D97736] text-white font-black',
    iconBg: 'bg-[#D97736]/20 text-[#D97736]',
  },
  'AYT Deneme': {
    bg: 'bg-[#1B2A4A]/10',
    border: 'border-[#1B2A4A]/40',
    text: 'text-[#1B2A4A]',
    badge: 'bg-[#1B2A4A] text-white font-black',
    iconBg: 'bg-[#1B2A4A]/20 text-[#1B2A4A]',
  },
  'Yanlış Soru Bankası': {
    bg: 'bg-[#D9534F]/5',
    border: 'border-[#D9534F]/25',
    text: 'text-[#D9534F]',
    badge: 'bg-[#D9534F] text-white',
    iconBg: 'bg-[#D9534F]/10 text-[#D9534F]',
  },
};

const DEFAULT_THEME = {
  bg: 'bg-[#F7F4EE]',
  border: 'border-[#DFD9CC]',
  text: 'text-[#1B2A4A]',
  badge: 'bg-[#4A5B78] text-white',
  iconBg: 'bg-[#DFD9CC] text-[#1B2A4A]',
};

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  items,
  onItemClick,
  onAddItem,
  onToggleComplete,
  readOnly = false,
}) => {
  const [activeReasonPopover, setActiveReasonPopover] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [mobileViewMode, setMobileViewMode] = useState<'single' | 'all'>('single');

  // Filter items by subject if selected
  const displayedItems = filterSubject === 'all' ? items : items.filter((i) => i.subject === filterSubject);

  // Group items by day
  const itemsByDay = DAYS.map((day) => {
    const dayItems = displayedItems
      .filter((item) => Number(item.day_of_week) === day.id)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    return {
      day,
      items: dayItems,
    };
  });

  const allSubjects = Array.from(new Set(items.map((it) => it.subject))).filter(Boolean);

  const renderDayCard = (day: (typeof DAYS)[0], dayItems: ProgramItem[], isCompact = false) => {
    const isWeekend = day.id === 5 || day.id === 6;
    const totalMinutes = dayItems.reduce((sum, item) => {
      if (!item.start_time || !item.end_time) return sum;
      const [sh, sm] = item.start_time.split(':').map(Number);
      const [eh, em] = item.end_time.split(':').map(Number);
      return sum + Math.max(0, (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0)));
    }, 0);
    const hoursFormatted = (totalMinutes / 60).toFixed(1).replace('.0', '');
    const completedInDay = dayItems.filter((i) => i.completed).length;

    return (
      <div
        key={day.id}
        className={`rounded-2xl border flex flex-col transition-all ${
          isCompact ? 'min-h-[220px]' : 'min-h-[380px]'
        } ${
          isWeekend ? 'bg-[#F7F4EE]/90 border-[#DFD9CC]' : 'bg-white border-[#DFD9CC]'
        }`}
      >
        {/* Day Header */}
        <div className="p-3 sm:p-3.5 border-b border-[#DFD9CC]/70 flex items-center justify-between bg-white/60 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-[#1B2A4A] tracking-tight">
                {day.name}
              </span>
              {isWeekend && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#D97736]/15 text-[#D97736]">
                  Kamp
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#7E8D9F] font-bold mt-0.5">
              <span>
                {dayItems.length} Blok{totalMinutes > 0 ? ` (${hoursFormatted} sa)` : ''}
              </span>
              {dayItems.length > 0 && completedInDay > 0 && (
                <span className="text-[#2E6B4F]">✓ {completedInDay}/{dayItems.length}</span>
              )}
            </div>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => onAddItem(day.id)}
              title={`${day.name} gününe yeni blok ekle`}
              className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-[#F7F4EE] hover:bg-[#1B2A4A] active:scale-95 text-[#7E8D9F] hover:text-[#F7F4EE] flex items-center justify-center transition-all border border-[#DFD9CC] min-h-[28px] min-w-[28px]"
            >
              <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

        {/* Day Items Stack */}
        <div className="p-2 sm:p-2.5 space-y-2 flex-1 flex flex-col justify-start">
          {dayItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-[#DFD9CC] rounded-xl text-[#7E8D9F] min-h-[120px]">
              <span className="text-xs font-bold text-[#7E8D9F]">Planlanan Blok Yok</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onAddItem(day.id)}
                  className="mt-2 text-xs text-[#1B2A4A] font-bold hover:underline py-1 px-2.5 rounded-lg bg-[#F7F4EE] border border-[#DFD9CC]"
                >
                  + Blok Ekle
                </button>
              )}
            </div>
          ) : (
            dayItems.map((item) => {
              const theme = SUBJECT_THEMES[item.subject] || DEFAULT_THEME;
              const isPopoverOpen = activeReasonPopover === item.id;
              const isDone = !!item.completed;

              return (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className={`group relative p-2.5 rounded-xl border ${
                    isDone
                      ? 'bg-[#2E6B4F]/5 border-[#2E6B4F]/30 opacity-90'
                      : `${theme.border} ${theme.bg}`
                  } cursor-pointer hover:shadow-xs hover:scale-[1.008] transition-all`}
                >
                  {/* Top Status & Indicators */}
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5">
                      {/* Interactive Complete Checkbox */}
                      {onToggleComplete && !readOnly ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(item.id, !item.completed);
                          }}
                          title={isDone ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            isDone
                              ? 'bg-[#2E6B4F] text-white shadow-2xs'
                              : 'bg-white border border-[#DFD9CC] text-transparent hover:text-[#7E8D9F]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#2E6B4F] shrink-0" />
                      ) : null}

                      {item.start_time && item.end_time && (
                        <span className="text-[10px] font-mono font-bold text-[#4A5B78]">
                          {item.start_time} - {item.end_time}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Coach Generated / Note Indicator */}
                      {item.generated_by === 'coach' ? (
                        <span
                          title="Koç tarafından özel planlandı"
                          className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#D97736]/15 text-[#D97736]"
                        >
                          KOÇ
                        </span>
                      ) : item.generated_by === 'student' ? (
                        <span
                          title="Öğrenci tarafından düzenlendi"
                          className="w-4 h-4 rounded-full bg-[#255A8A]/15 text-[#255A8A] flex items-center justify-center text-[9px]"
                        >
                          <UserCheck className="w-2.5 h-2.5" />
                        </span>
                      ) : null}

                      {/* Reasoning Popover Trigger */}
                      {item.ai_reasoning && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReasonPopover(isPopoverOpen ? null : item.id);
                          }}
                          title="Planlama gerekçesini gör"
                          className="w-5 h-5 rounded-full bg-white text-[#D97736] hover:bg-[#D97736] hover:text-white flex items-center justify-center text-[10px] shadow-2xs border border-[#DFD9CC] transition-colors"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-black ${isDone ? 'text-[#2E6B4F] line-through' : theme.text} truncate`}>
                      {item.subject}
                    </span>
                    {item.target_questions && item.target_questions > 0 && (
                      <span className="text-[10px] font-bold text-[#D97736] flex items-center gap-0.5">
                        <Target className="w-3 h-3" />
                        <span>{item.target_questions}S</span>
                      </span>
                    )}
                  </div>

                  {/* Topic */}
                  <p className={`text-[11px] font-medium ${isDone ? 'text-[#7E8D9F]' : 'text-[#4A5B78]'} line-clamp-2 leading-tight`}>
                    {item.topic}
                  </p>

                  {/* Coach Notes banner inside card */}
                  {item.coach_notes && (
                    <div className="mt-1.5 pt-1 border-t border-[#DFD9CC]/50 text-[10px] text-[#2E6B4F] font-semibold flex items-center gap-1 truncate">
                      <MessageSquare className="w-2.5 h-2.5 shrink-0 text-[#2E6B4F]" />
                      <span className="truncate">{item.coach_notes}</span>
                    </div>
                  )}

                  {/* Reason Popover */}
                  {isPopoverOpen && item.ai_reasoning && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute z-30 left-0 right-0 top-full mt-1.5 p-3 bg-[#1B2A4A] text-white rounded-xl shadow-xl text-xs sm:text-[11px] leading-relaxed border border-[#DFD9CC]/20 animate-in fade-in zoom-in-95"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5 pb-1.5 border-b border-white/15">
                        <span className="font-bold flex items-center gap-1.5 text-[#D97736] text-[10px] uppercase">
                          <Sparkles className="w-3.5 h-3.5" /> Planlama Gerekçesi
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveReasonPopover(null)}
                          className="text-white/60 hover:text-white text-xs p-1"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-white/90">{item.ai_reasoning}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="weekly-program-calendar" className="w-full space-y-3">
      {/* Subject Filter Bar */}
      {allSubjects.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          <span className="text-[#7E8D9F] text-[11px] flex items-center gap-1 pl-1">
            <Filter className="w-3 h-3" /> Filtrele:
          </span>
          <button
            type="button"
            onClick={() => setFilterSubject('all')}
            className={`px-2.5 py-1 rounded-xl transition-all ${
              filterSubject === 'all'
                ? 'bg-[#1B2A4A] text-white shadow-2xs'
                : 'bg-white text-[#4A5B78] border border-[#DFD9CC] hover:bg-[#F7F4EE]'
            }`}
          >
            Tüm Dersler ({items.length})
          </button>
          {allSubjects.map((sub) => {
            const count = items.filter((i) => i.subject === sub).length;
            const isSel = filterSubject === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setFilterSubject(sub)}
                className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 ${
                  isSel
                    ? 'bg-[#1B2A4A] text-white shadow-2xs'
                    : 'bg-white text-[#4A5B78] border border-[#DFD9CC] hover:bg-[#F7F4EE]'
                }`}
              >
                <span>{sub}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile-Only Controls & Tabs (md:hidden) */}
      <div className="md:hidden space-y-3 mb-3">
        {/* Toggle Mode: Single Day vs All Days */}
        <div className="flex items-center justify-between gap-2 bg-[#EFEBE0] p-1.5 rounded-xl border border-[#DFD9CC]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileViewMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                mobileViewMode === 'single'
                  ? 'bg-white text-[#1B2A4A] shadow-xs'
                  : 'text-[#7E8D9F] hover:text-[#1B2A4A]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Günlük Görünüm</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                mobileViewMode === 'all'
                  ? 'bg-white text-[#1B2A4A] shadow-xs'
                  : 'text-[#7E8D9F] hover:text-[#1B2A4A]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tüm Hafta</span>
            </button>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#4A5B78] pr-1.5">
            {displayedItems.length} Blok
          </span>
        </div>

        {/* Day Pills Bar for Mobile */}
        {mobileViewMode === 'single' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            {DAYS.map((d) => {
              const count = displayedItems.filter((it) => Number(it.day_of_week) === d.id).length;
              const isSelected = selectedMobileDay === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedMobileDay(d.id)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all min-w-[56px] min-h-[50px] border ${
                    isSelected
                      ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                      : 'bg-white text-[#4A5B78] border-[#DFD9CC] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <span className="text-xs font-black">{d.short}</span>
                  <span
                    className={`text-[10px] font-bold mt-0.5 px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : count > 0
                        ? 'bg-[#E2DED4] text-[#1B2A4A]'
                        : 'text-[#7E8D9F]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Single Day View Container */}
      <div className="md:hidden">
        {mobileViewMode === 'single' ? (
          <div>
            {renderDayCard(
              DAYS[selectedMobileDay],
              itemsByDay[selectedMobileDay].items,
              false
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {itemsByDay.map(({ day, items: dayItems }) =>
              renderDayCard(day, dayItems, true)
            )}
          </div>
        )}
      </div>

      {/* Desktop & Tablet 7-column Responsive Grid (md:grid) */}
      <div className="hidden md:grid md:grid-cols-7 gap-2.5 lg:gap-3">
        {itemsByDay.map(({ day, items: dayItems }) =>
          renderDayCard(day, dayItems, false)
        )}
      </div>
    </div>
  );
};
