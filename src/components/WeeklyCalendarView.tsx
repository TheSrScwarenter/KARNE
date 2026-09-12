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
  Download,
  Printer,
  X,
  ExternalLink,
} from 'lucide-react';
import { downloadCalendarICS } from '../lib/icsExporter';

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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handlePrint = () => {
    window.focus();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintInNewWindow = () => {
    const el = document.getElementById('printable-landscape-weekly-schedule');
    if (!el) return;
    const printWin = window.open('', '_blank', 'width=1150,height=800');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>studii - YKS Haftalık Ders Çalışma Planı (Yatay A4)</title>
  <style>
    @page { size: A4 landscape; margin: 6mm 8mm; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: white;
      color: #1B2A4A;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    * { box-sizing: border-box; }
    .print-container {
      width: 100%;
      max-width: 100%;
      padding: 8px 12px;
      margin: 0 auto;
    }
    .grid { display: grid; }
    .grid-cols-7 { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
    .gap-2 { gap: 6px; }
    .border { border: 1px solid #DFD9CC; }
    .border-b { border-bottom: 1px solid #DFD9CC; }
    .border-b-2 { border-bottom: 2px solid #1B2A4A; }
    .border-t { border-top: 1px solid #DFD9CC; }
    .border-dashed { border-style: dashed; }
    .rounded-md { border-radius: 6px; }
    .rounded-lg { border-radius: 8px; }
    .rounded-xl { border-radius: 10px; }
    .rounded-2xl { border-radius: 12px; }
    .p-1 { padding: 4px; }
    .p-1\\.5 { padding: 5px; }
    .p-2 { padding: 6px; }
    .p-6 { padding: 12px; }
    .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
    .px-2 { padding-left: 6px; padding-right: 6px; }
    .px-2\\.5 { padding-left: 8px; padding-right: 8px; }
    .pb-1 { padding-bottom: 4px; }
    .pb-2 { padding-bottom: 6px; }
    .pt-1 { padding-top: 4px; }
    .pt-2 { padding-top: 6px; }
    .pt-2\\.5 { padding-top: 8px; }
    .mb-1 { margin-bottom: 4px; }
    .mb-1\\.5 { margin-bottom: 5px; }
    .mb-2 { margin-bottom: 6px; }
    .mb-3 { margin-bottom: 8px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 6px; }
    .mt-3 { margin-top: 8px; }
    .flex { display: flex; }
    .flex-1 { flex: 1 1 0%; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .font-sans { font-family: inherit; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-black { font-weight: 900; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .text-\\[8px\\] { font-size: 8px; }
    .text-\\[8\\.5px\\] { font-size: 8.5px; }
    .text-\\[9px\\] { font-size: 9px; }
    .text-\\[10px\\] { font-size: 10px; }
    .text-\\[11px\\] { font-size: 11px; }
    .text-xs { font-size: 11px; }
    .text-sm { font-size: 13px; }
    .text-2xl { font-size: 18px; }
    .text-\\[\\#1B2A4A\\] { color: #1B2A4A; }
    .text-\\[\\#0071E3\\] { color: #0071E3; }
    .text-white { color: #ffffff; }
    .text-gray-400 { color: #94a3b8; }
    .text-gray-500 { color: #64748b; }
    .text-gray-600 { color: #475569; }
    .text-amber-700 { color: #b45309; }
    .bg-white { background-color: #ffffff; }
    .bg-gray-50 { background-color: #f8fafc; }
    .bg-gray-50\\/50 { background-color: #f8fafc; }
    .bg-\\[\\#1B2A4A\\] { background-color: #1B2A4A; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .space-y-1\\.5 > * + * { margin-top: 4px; }
    .space-y-0\\.5 > * + * { margin-top: 2px; }
    .italic { font-style: italic; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .uppercase { text-transform: uppercase; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-tight { letter-spacing: -0.025em; }
    .leading-tight { line-height: 1.25; }
    .gap-10 { gap: 24px; }
    .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="print-container">
    ${el.innerHTML}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`);
    printWin.document.close();
  };

  // Format time string for printable/PDF landscape view
  // If start_time is missing, empty, or '00:00', leave it as '__:__' so student can handwrite actual duration/hours on paper
  const formatBlockPrintTime = (it: ProgramItem) => {
    const s = it.start_time?.trim();
    const e = it.end_time?.trim();
    const isZeroOrEmpty = (t?: string) =>
      !t || t === '00:00' || t === '0:00' || t === '00.00' || t === '0.00' || t === '--:--' || t === '__:__';

    const hasValidStart = !isZeroOrEmpty(s);
    const hasValidEnd = !isZeroOrEmpty(e);

    if (hasValidStart && hasValidEnd) {
      return `${s} - ${e}`;
    }
    if (hasValidStart && !hasValidEnd) {
      return `${s} - __:__`;
    }
    return '__:__';
  };

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

                      {item.start_time && item.end_time && item.start_time !== '00:00' && (
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
      {/* Subject Filter Bar & ICS Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {allSubjects.length > 1 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold flex-1">
            <span className="text-[#7E8D9F] text-[11px] flex items-center gap-1 pl-1 shrink-0">
              <Filter className="w-3 h-3" /> Filtrele:
            </span>
            <button
              type="button"
              onClick={() => setFilterSubject('all')}
              className={`px-2.5 py-1 rounded-xl transition-all shrink-0 cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
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
        ) : (
          <div />
        )}

        {items.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              id="btn-print-landscape-schedule"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
              title="Haftalık ders çalışma programını yatay A4 formatında PDF olarak kaydet veya yazıcıdan çıkart"
            >
              <Printer className="w-3.5 h-3.5 text-[#D97736]" />
              <span>Yatay A4 Yazdır / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => downloadCalendarICS(items)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#1B2A4A] border border-[#DFD9CC] hover:bg-[#F7F4EE] text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
              title="Apple Calendar, Google Calendar veya Outlook'a (.ics) takvim dosyası olarak aktar (Supabase kotası tüketmez)"
            >
              <Download className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Takvime Aktar (.ICS)</span>
            </button>
          </div>
        )}
      </div>

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

      {/* Landscape A4 Print Preview & Export Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#F5F5F7] rounded-3xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl border border-black/10 overflow-hidden">
            {/* Modal Header Bar */}
            <div className="px-5 py-3.5 bg-[#1B2A4A] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#D97736]/20 border border-[#D97736]/30 flex items-center justify-center text-[#D97736]">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Yatay A4 Haftalık Çalışma Çizelgesi
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white">
                      Yatay A4
                    </span>
                  </h3>
                  <p className="text-xs text-white/70">
                    Masa & çalışma odası için 7 günlük haftalık blok planı
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInNewWindow}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Ayrı pencerede yazdır"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span className="hidden sm:inline">Yeni Sekmede Aç</span>
                </button>

                <button
                  type="button"
                  id="btn-trigger-print-now"
                  onClick={handlePrint}
                  className="px-4 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0071E3]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır / PDF Olarak Kaydet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Sheet Preview Canvas */}
            <div className="p-4 sm:p-6 overflow-auto flex-1 bg-[#DFD9CC]/40">
              <div
                id="printable-landscape-weekly-schedule"
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-[#DFD9CC] mx-auto w-full max-w-5xl text-[#1B2A4A] font-sans flex flex-col justify-between"
              >
                {/* Header */}
                <div className="border-b-2 border-[#1B2A4A] pb-2 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-[#1B2A4A]">studii</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-[#1B2A4A] text-white uppercase tracking-wider">
                      YKS HAFTALIK DERS ÇALIŞMA PLANI
                    </span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-xs sm:text-sm text-[#1B2A4A]">Masa & Çalışma Odası Haftalık Çizelgesi</div>
                    <div className="text-gray-500 text-[11px]">
                      Tarih: _____ / _____ / 2026 • Toplam Planlanan: {items.length} Blok
                    </div>
                  </div>
                </div>

                {/* 7-Column Timetable */}
                <div className="grid grid-cols-7 gap-2 flex-1 border border-[#DFD9CC] rounded-xl p-2 bg-gray-50/50">
                  {DAYS.map((day) => {
                    const dayItems = displayedItems
                      .filter((item) => Number(item.day_of_week) === day.id)
                      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
                    const isWeekend = day.id === 5 || day.id === 6;

                    return (
                      <div
                        key={day.id}
                        className={`border rounded-lg p-1.5 flex flex-col justify-between text-[10px] min-h-[220px] ${
                          isWeekend ? 'bg-amber-500/5 border-amber-300' : 'bg-white border-gray-300'
                        }`}
                      >
                        <div>
                          {/* Day Column Header */}
                          <div className="border-b border-gray-200 pb-1 mb-1.5 flex items-center justify-between">
                            <span className="font-black text-xs text-[#1B2A4A]">{day.name}</span>
                            <span className="text-[9px] font-bold text-gray-500">{dayItems.length} Blok</span>
                          </div>

                          {/* Day Blocks */}
                          <div className="space-y-1.5">
                            {dayItems.length === 0 ? (
                              <div className="py-8 text-center text-gray-400 italic text-[9px]">
                                Serbest / Dinlenme
                              </div>
                            ) : (
                              dayItems.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="p-1.5 rounded bg-gray-50 border border-gray-200 leading-tight space-y-0.5"
                                >
                                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-[#0071E3]">
                                    <span className="tracking-wider">{formatBlockPrintTime(it)}</span>
                                    <span className="text-gray-400 font-bold">[ &nbsp; ]</span>
                                  </div>
                                  <div className="font-bold text-[#1B2A4A] truncate text-[10px]">{it.subject}</div>
                                  {it.topic && (
                                    <div className="text-gray-600 text-[9px] line-clamp-1">
                                      {it.topic}
                                    </div>
                                  )}
                                  {it.target_questions && it.target_questions > 0 && (
                                    <div className="text-[8.5px] text-amber-700 font-bold">
                                      Hedef: {it.target_questions} Soru
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Day Footer note area */}
                        <div className="border-t border-dashed border-gray-300 pt-1 mt-2 text-[8px] text-gray-400">
                          <div>Notlar: ____________</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Schedule Footer */}
                <div className="border-t border-gray-300 pt-2.5 mt-3 flex items-center justify-between text-[11px] text-gray-600">
                  <div>
                    <span className="font-bold text-[#1B2A4A]">Prensip:</span> Planlanan blokları eksiksiz tamamla, yanlış soruları aynı gün analiz et!
                  </div>
                  <div className="flex items-center gap-10 text-[10px]">
                    <div>Öğrenci İmzası: ____________________</div>
                    <div>Rehber Koç / Veli: ____________________</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Landscape Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 6mm 8mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-landscape-weekly-schedule,
          #printable-landscape-weekly-schedule * {
            visibility: visible !important;
          }
          #printable-landscape-weekly-schedule {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            background: white !important;
            box-shadow: none !important;
            border: 1px solid #1B2A4A !important;
            border-radius: 8px !important;
            z-index: 999999 !important;
            padding: 6mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
