import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { BarChart3, Clock } from 'lucide-react';

interface WeeklyBarChartProps {
  data: {
    subject: string;
    minutes: number;
    hours: number;
    color: string;
  }[];
  totalMinutes: number;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({
  data,
  totalMinutes,
}) => {
  const formattedTotalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div
      id="weekly-barchart-card"
      className="bento-card p-5 sm:p-6 bg-white border border-black/[0.06] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1D1D1F] tracking-tight uppercase">
                Haftalık Ders Dağılımı
              </h3>
              <p className="text-[11px] text-[#86868B]">Bu haftaki ders bazlı çalışma saatleri</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-[#1D1D1F]">
              {formattedTotalHours} Saat
            </span>
            <span className="text-[10px] text-[#86868B] block">Toplam Süre</span>
          </div>
        </div>

        {/* Chart Area */}
        {data.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-[#86868B] text-xs">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <span>Bu hafta henüz çalışma kaydı bulunmuyor.</span>
          </div>
        ) : (
          <div className="h-44 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="subject"
                  tick={{ fill: '#86868B', fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: '#E5E5EA' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#86868B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  unit=" sa"
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl text-xs shadow-lg border border-black/[0.08] text-[#1D1D1F]">
                          <p className="font-semibold">{item.subject}</p>
                          <p className="text-[#86868B] mt-0.5">
                            {item.hours} Saat ({item.minutes} dk)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#0071E3'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Mini Subject Chips Legend */}
      {data.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-black/[0.06] flex flex-wrap items-center gap-2">
          {data.slice(0, 5).map((d, i) => (
            <span
              key={i}
              className="text-[10px] font-medium text-[#86868B] flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color || '#0071E3' }} />
              {d.subject}: {d.hours}s
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
