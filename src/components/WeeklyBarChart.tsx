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
      className="bento-card p-5 sm:p-6 bg-white border-[#DFD9CC] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1B2A4A]/10 text-[#1B2A4A] flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#1B2A4A] tracking-tight uppercase">
                Haftalık Ders Dağılımı
              </h3>
              <p className="text-[11px] text-[#7E8D9F]">Bu haftaki ders bazlı çalışma saatleri</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-extrabold text-[#1B2A4A]">
              {formattedTotalHours} Saat
            </span>
            <span className="text-[10px] text-[#7E8D9F] block">Toplam Süre</span>
          </div>
        </div>

        {/* Chart Area */}
        {data.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-[#7E8D9F] text-xs">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <span>Bu hafta henüz çalışma kaydı bulunmuyor.</span>
          </div>
        ) : (
          <div className="h-44 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="subject"
                  tick={{ fill: '#4A5B78', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#DFD9CC' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#7E8D9F', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  unit=" sa"
                />
                <Tooltip
                  cursor={{ fill: 'rgba(27, 42, 74, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-[#1B2A4A] text-white p-2.5 rounded-xl text-xs shadow-xl border border-white/10">
                          <p className="font-bold">{item.subject}</p>
                          <p className="text-white/80 mt-0.5">
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Mini Subject Chips Legend */}
      {data.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#DFD9CC] flex flex-wrap items-center gap-2">
          {data.slice(0, 5).map((d, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold text-[#4A5B78] flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.subject}: {d.hours}s
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
