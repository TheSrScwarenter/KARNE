import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  ArrowRight,
  Award,
  Calendar,
} from 'lucide-react';
import { Exam, ExamType } from '../types';
import { examsService } from '../lib/examsService';

interface DashboardExamTrendChartProps {
  exams: Exam[];
  onNavigateToExams: () => void;
}

export const DashboardExamTrendChart: React.FC<DashboardExamTrendChartProps> = ({
  exams,
  onNavigateToExams,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | ExamType>('ALL');

  // Filter exams by type and sort chronologically (oldest to newest for proper timeline progression)
  const sortedAndFilteredExams = useMemo(() => {
    let list = [...exams];
    if (selectedFilter !== 'ALL') {
      list = list.filter((e) => e.exam_type === selectedFilter);
    }
    return list.sort(
      (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    );
  }, [exams, selectedFilter]);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return sortedAndFilteredExams.map((exam, index) => {
      const totalNet = examsService.calculateTotalNet(exam);
      const examDate = new Date(exam.exam_date);
      const displayDate = examDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
      });

      // Collect subject breakdowns
      const subjectMap: Record<string, number> = {};
      (exam.subject_results || []).forEach((sr) => {
        subjectMap[sr.subject] = sr.net;
      });

      return {
        id: exam.id,
        index: index + 1,
        examName: exam.exam_name,
        shortName:
          exam.exam_name.length > 14
            ? exam.exam_name.substring(0, 12) + '...'
            : exam.exam_name,
        displayDate,
        fullDate: examDate.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        type: exam.exam_type,
        totalNet,
        TYT_Net: exam.exam_type === 'TYT' ? totalNet : null,
        AYT_Net: exam.exam_type === 'AYT' ? totalNet : null,
        subjects: subjectMap,
      };
    });
  }, [sortedAndFilteredExams]);

  // Calculate high-level summary metrics
  const metrics = useMemo(() => {
    if (sortedAndFilteredExams.length === 0) {
      return {
        maxNet: 0,
        avgNet: 0,
        latestNet: 0,
        netDelta: 0,
        count: 0,
      };
    }

    const netValues = sortedAndFilteredExams.map((e) =>
      examsService.calculateTotalNet(e)
    );
    const maxNet = Math.max(...netValues);
    const sumNet = netValues.reduce((acc, val) => acc + val, 0);
    const avgNet = Number((sumNet / netValues.length).toFixed(2));
    const latestNet = netValues[netValues.length - 1];

    let netDelta = 0;
    if (netValues.length > 1) {
      const prevNet = netValues[netValues.length - 2];
      netDelta = Number((latestNet - prevNet).toFixed(2));
    }

    return {
      maxNet,
      avgNet,
      latestNet,
      netDelta,
      count: sortedAndFilteredExams.length,
    };
  }, [sortedAndFilteredExams]);

  // Custom Recharts HTML Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    if (!data) return null;

    const typeBadgeColor =
      data.type === 'TYT'
        ? 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20'
        : data.type === 'AYT'
        ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20'
        : 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20';

    const subjectEntries = Object.entries(data.subjects || {});

    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-black/[0.08] shadow-lg text-xs space-y-2 min-w-[200px] z-30">
        <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-2">
          <div className="font-semibold text-[#1D1D1F] truncate max-w-[140px]">
            {data.examName}
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${typeBadgeColor}`}
          >
            {data.type}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#86868B] pt-0.5">
          <span className="flex items-center gap-1 text-[11px]">
            <Calendar className="w-3 h-3 text-[#86868B]" />
            {data.fullDate}
          </span>
          <span className="font-bold text-sm text-[#1D1D1F]">
            {data.totalNet.toFixed(2)} Net
          </span>
        </div>

        {subjectEntries.length > 0 && (
          <div className="pt-2 border-t border-black/[0.06] space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#86868B]">
              Ders Dağılımı
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {subjectEntries.map(([subj, net]) => (
                <div
                  key={subj}
                  className="flex items-center justify-between text-[11px] bg-[#F5F5F7] px-1.5 py-0.5 rounded-lg"
                >
                  <span className="text-[#86868B] truncate max-w-[70px]">{subj}:</span>
                  <span className="font-semibold text-[#1D1D1F]">
                    {Number(net).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bento-card p-6 md:p-7 bg-white border border-black/[0.06]">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
              Gelişim Çizelgesi
            </span>
            <h3 className="text-base font-bold text-[#1D1D1F] tracking-tight">
              Deneme Netlerinin Zaman İçindeki Değişimi
            </h3>
          </div>
          <p className="text-xs text-[#86868B] mt-1">
            Girdiğiniz TYT ve AYT denemelerinin kronolojik net gelişim eğrisi.
          </p>
        </div>

        {/* Filter Tabs & Link */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-0.5 bg-[#F5F5F7] rounded-full border border-black/[0.06]">
            {(
              [
                { id: 'ALL', label: 'Tümü' },
                { id: 'TYT', label: 'TYT' },
                { id: 'AYT', label: 'AYT' },
                { id: 'branş', label: 'Branş' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onNavigateToExams}
            className="apple-btn-secondary px-3.5 py-1.5 text-xs font-medium rounded-full inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tüm Denemeler ({exams.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* When no exams exist */}
      {exams.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-[#F5F5F7]/70 border border-dashed border-black/[0.08] text-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center mx-auto mb-3 text-[#0071E3] shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#1D1D1F]">
            Henüz Deneme Kaydı Eklenmedi
          </h4>
          <p className="text-xs text-[#86868B] mt-1 max-w-md mx-auto leading-relaxed">
            Girdiğiniz TYT ve AYT deneme sınavlarını ekleyerek netlerinizdeki yükselişi buradan takip edebilirsiniz.
          </p>
          <button
            type="button"
            onClick={onNavigateToExams}
            className="apple-btn-primary mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Denemenizi Ekleyin</span>
          </button>
        </div>
      ) : chartData.length === 0 ? (
        <div className="py-10 px-4 rounded-2xl bg-[#F5F5F7]/70 border border-dashed border-black/[0.08] text-center">
          <p className="text-xs font-medium text-[#86868B]">
            Seçilen filtrede ({selectedFilter}) kayıtlı deneme sınavı bulunamadı.
          </p>
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className="mt-2 text-xs font-semibold text-[#0071E3] hover:underline cursor-pointer"
          >
            Tüm Denemeleri Göster
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Net Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.04]">
            <div className="px-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868B]">
                Son Net
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-[#1D1D1F]">
                  {metrics.latestNet.toFixed(2)}
                </span>
                {metrics.netDelta !== 0 && (
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold ${
                      metrics.netDelta > 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'
                    }`}
                  >
                    {metrics.netDelta > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    {metrics.netDelta > 0 ? `+${metrics.netDelta}` : metrics.netDelta}
                  </span>
                )}
              </div>
            </div>

            <div className="px-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868B]">
                Zirve Net
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-[#34C759]">
                  {metrics.maxNet.toFixed(2)}
                </span>
                <Award className="w-3.5 h-3.5 text-[#FF9500]" />
              </div>
            </div>

            <div className="px-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868B]">
                Ortalama Net
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-[#0071E3]">
                  {metrics.avgNet.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="px-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#86868B]">
                Sınav Sayısı
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-[#1D1D1F]">
                  {metrics.count} Deneme
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Line Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 16, left: -14, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F0F0F2"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayDate"
                  stroke="#86868B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E5EA' }}
                />
                <YAxis
                  stroke="#86868B"
                  fontSize={11}
                  domain={[0, 'auto']}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E5EA' }}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Average Net Reference Line */}
                {metrics.avgNet > 0 && (
                  <ReferenceLine
                    y={metrics.avgNet}
                    stroke="#FF9500"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Ort: ${metrics.avgNet}`,
                      position: 'right',
                      fill: '#FF9500',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}

                {/* Main Progression Line */}
                <Line
                  type="monotone"
                  dataKey="totalNet"
                  name="Toplam Net"
                  stroke="#0071E3"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: '#FFFFFF',
                    stroke: '#0071E3',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#0071E3',
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend / Helper */}
          <div className="flex items-center justify-between text-xs text-[#86868B] px-1 pt-1 border-t border-black/[0.06]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3]"></span>
                Toplam Net Trendi
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#FF9500]">
                <span className="w-3 h-0.5 bg-[#FF9500] border-t border-dashed"></span>
                Ortalama ({metrics.avgNet} Net)
              </span>
            </div>
            <span className="hidden sm:inline text-[11px] text-[#86868B]">
              Noktaların üzerine gelerek ders ayrıntılarını görüntüleyebilirsiniz.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
