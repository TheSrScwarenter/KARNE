import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, Eye, EyeOff, Filter, BarChart2 } from 'lucide-react';
import { Exam, ExamType } from '../types';

interface ExamTrendChartProps {
  exams: Exam[];
}

const SUBJECT_COLORS: Record<string, string> = {
  Toplam: '#1B2A4A',
  Matematik: '#D97736',
  Türkçe: '#255A8A',
  'Fen Bilimleri': '#2E6B4F',
  Fizik: '#7C3AED',
  Kimya: '#DB2777',
  Biyoloji: '#059669',
  'Sosyal Bilgiler': '#D97706',
  Geometri: '#4F46E5',
  Tarih: '#9333EA',
  Coğrafya: '#0D9488',
  Edebiyat: '#BE123C',
};

const DEFAULT_COLOR = '#64748B';

export const ExamTrendChart: React.FC<ExamTrendChartProps> = ({ exams }) => {
  const [selectedType, setSelectedType] = useState<ExamType | 'ALL'>('ALL');
  
  // Keep track of which lines are visible
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    Toplam: true,
    Matematik: true,
    Türkçe: true,
    'Fen Bilimleri': true,
    Fizik: true,
    Kimya: true,
    Biyoloji: true,
    'Sosyal Bilgiler': true,
  });

  // Filter exams by type and sort chronologically (oldest to newest for the trend line)
  const filteredExams = useMemo(() => {
    let list = [...exams];
    if (selectedType !== 'ALL') {
      list = list.filter((e) => e.exam_type === selectedType);
    }
    return list.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
  }, [exams, selectedType]);

  // Extract all unique subjects across the filtered exams
  const allSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    filteredExams.forEach((exam) => {
      (exam.subject_results || []).forEach((sr) => {
        subjectsSet.add(sr.subject);
      });
    });
    return Array.from(subjectsSet);
  }, [filteredExams]);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return filteredExams.map((exam) => {
      const row: Record<string, any> = {
        name: exam.exam_name,
        shortName: exam.exam_name.length > 15 ? exam.exam_name.substring(0, 13) + '...' : exam.exam_name,
        date: new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        type: exam.exam_type,
      };

      let total = 0;
      (exam.subject_results || []).forEach((sr) => {
        row[sr.subject] = sr.net;
        total += sr.net;
      });

      row['Toplam'] = Number(total.toFixed(2));
      return row;
    });
  }, [filteredExams]);

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  const toggleAll = (show: boolean) => {
    const updated: Record<string, boolean> = { Toplam: show };
    allSubjects.forEach((s) => {
      updated[s] = show;
    });
    setVisibleLines(updated);
  };

  if (exams.length === 0) {
    return (
      <div className="bg-white border border-[#DFD9CC] rounded-3xl p-8 text-center">
        <TrendingUp className="w-8 h-8 text-[#7E8D9F] mx-auto mb-2 opacity-50" />
        <p className="text-xs text-[#7E8D9F] font-bold">
          Henüz deneme sınavı kaydı bulunmuyor. Trend grafiğini görmek için deneme ekleyin.
        </p>
      </div>
    );
  }

  return (
    <div id="exam-trend-chart-container" className="bg-white border border-[#DFD9CC] rounded-3xl p-5 sm:p-6 shadow-xs">
      {/* Chart Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D97736]" />
            <h3 className="text-base font-extrabold text-[#1B2A4A]">
              Deneme Net Gelişim Trendi
            </h3>
          </div>
          <p className="text-xs text-[#7E8D9F] mt-0.5">
            Zaman içindeki toplam ve ders bazlı net değişimleri (X ekseni: Tarih, Y ekseni: Net)
          </p>
        </div>

        {/* Exam Type Selector */}
        <div className="flex items-center gap-1.5 bg-[#F7F4EE] p-1 rounded-2xl border border-[#DFD9CC]">
          {(['ALL', 'TYT', 'AYT', 'branş'] as const).map((typeKey) => (
            <button
              key={typeKey}
              onClick={() => setSelectedType(typeKey)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                selectedType === typeKey
                  ? 'bg-[#1B2A4A] text-white shadow-xs'
                  : 'text-[#4A5B78] hover:text-[#1B2A4A]'
              }`}
            >
              {typeKey === 'ALL' ? 'Tümü' : typeKey === 'branş' ? 'Branş' : typeKey}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility Toggle Chips */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#DFD9CC]/60 pt-3">
        <span className="text-[11px] font-bold text-[#7E8D9F] mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Görünüm:
        </span>

        {/* Toplam Net Toggle */}
        <button
          onClick={() => toggleLine('Toplam')}
          className={`px-2.5 py-1 text-xs font-black rounded-lg border transition-all flex items-center gap-1.5 ${
            visibleLines['Toplam'] !== false
              ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
              : 'bg-[#F7F4EE] text-[#7E8D9F] border-[#DFD9CC] opacity-60'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: visibleLines['Toplam'] !== false ? '#D97736' : '#94A3B8' }}
          />
          <span>Toplam Net</span>
          {visibleLines['Toplam'] !== false ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
        </button>

        {/* Subject Toggles */}
        {allSubjects.map((subj) => {
          const isVisible = visibleLines[subj] !== false;
          const color = SUBJECT_COLORS[subj] || DEFAULT_COLOR;
          return (
            <button
              key={subj}
              onClick={() => toggleLine(subj)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                isVisible
                  ? 'bg-[#F7F4EE] text-[#1B2A4A] border-[#DFD9CC]'
                  : 'bg-[#F7F4EE]/40 text-[#7E8D9F] border-[#DFD9CC]/40 opacity-50 line-through'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isVisible ? color : '#CBD5E1' }}
              />
              <span>{subj}</span>
            </button>
          );
        })}

        {/* Quick Show/Hide All */}
        <div className="ml-auto flex items-center gap-1 text-[10px] text-[#7E8D9F]">
          <button
            onClick={() => toggleAll(true)}
            className="hover:text-[#1B2A4A] underline font-bold px-1"
          >
            Tümünü Göster
          </button>
          <span>•</span>
          <button
            onClick={() => toggleAll(false)}
            className="hover:text-[#1B2A4A] underline font-bold px-1"
          >
            Gizle
          </button>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#DFD9CC' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#DFD9CC' }}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const examItem = chartData.find((d) => d.date === label);
                  return (
                    <div className="bg-[#1B2A4A] text-white p-3 rounded-2xl shadow-xl border border-white/10 text-xs min-w-[200px]">
                      <div className="border-b border-white/20 pb-1.5 mb-2 flex items-center justify-between">
                        <span className="font-extrabold text-[#D97736]">{examItem?.name || label}</span>
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                          {examItem?.type}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                          <div key={`item-${index}`} className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-white/80">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-mono font-bold text-white">
                              {entry.value} Net
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Toplam Net Bold Line */}
            {visibleLines['Toplam'] !== false && (
              <Line
                type="monotone"
                dataKey="Toplam"
                name="Toplam Net"
                stroke={SUBJECT_COLORS['Toplam']}
                strokeWidth={3.5}
                dot={{ r: 4, fill: '#D97736', stroke: '#1B2A4A', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            )}

            {/* Individual Subject Lines */}
            {allSubjects.map((subj) => {
              if (visibleLines[subj] === false) return null;
              const color = SUBJECT_COLORS[subj] || DEFAULT_COLOR;
              return (
                <Line
                  key={subj}
                  type="monotone"
                  dataKey={subj}
                  name={subj}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: color }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
