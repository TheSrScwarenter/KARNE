import React, { useState } from 'react';
import { Target, TrendingUp, Edit3, Check, X, Award, Clock } from 'lucide-react';
import { studySessionsService } from '../lib/studySessionsService';

interface WeeklyTargetCardProps {
  studentId: string;
  weeklyTotalMinutes: number;
  targetMinutes: number;
  onTargetUpdated: (newTarget: number) => void;
}

export const WeeklyTargetCard: React.FC<WeeklyTargetCardProps> = ({
  studentId,
  weeklyTotalMinutes,
  targetMinutes,
  onTargetUpdated,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [targetHoursInput, setTargetHoursInput] = useState<number>(() =>
    Math.round(targetMinutes / 60)
  );
  const [saving, setSaving] = useState<boolean>(false);

  const completedHours = Number((weeklyTotalMinutes / 60).toFixed(1));
  const targetHours = Number((targetMinutes / 60).toFixed(1));
  const percentage = Math.min(100, Math.round((weeklyTotalMinutes / (targetMinutes || 1)) * 100));

  const remainingMinutes = Math.max(0, targetMinutes - weeklyTotalMinutes);
  const remainingHours = Number((remainingMinutes / 60).toFixed(1));

  // Determine status color and text
  const isTargetMet = weeklyTotalMinutes >= targetMinutes;

  const handleSaveTarget = async () => {
    if (targetHoursInput <= 0 || isNaN(targetHoursInput)) return;
    setSaving(true);
    const newMinutes = targetHoursInput * 60;
    try {
      await studySessionsService.setWeeklyTargetMinutes(studentId, newMinutes);
      onTargetUpdated(newMinutes);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update weekly target:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="weekly-target-card"
      className="bento-card p-5 sm:p-6 bg-white border-[#DFD9CC] flex flex-col justify-between relative overflow-hidden"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#1B2A4A] tracking-tight uppercase">
                Haftalık Çalışma Hedefi
              </h3>
              <p className="text-[11px] text-[#7E8D9F]">Pazartesi – Pazar İlerlemesi</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              id="btn-edit-target"
              onClick={() => {
                setTargetHoursInput(Math.round(targetMinutes / 60));
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-[#F7F4EE] transition-colors flex items-center gap-1 text-[11px] font-bold"
              title="Hedefi Düzenle"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Hedefi Değiştir</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={100}
                value={targetHoursInput}
                onChange={(e) => setTargetHoursInput(parseInt(e.target.value) || 0)}
                className="w-16 p-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#1B2A4A] text-center"
                autoFocus
              />
              <span className="text-xs font-bold text-[#7E8D9F]">saat</span>
              <button
                onClick={handleSaveTarget}
                disabled={saving}
                className="p-1 rounded-lg bg-[#2E6B4F] text-white hover:bg-[#2E6B4F]/90 transition-colors"
                title="Kaydet"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg bg-[#EFEBE0] text-[#7E8D9F] hover:text-[#1B2A4A]"
                title="İptal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Numbers Metric */}
        <div className="flex items-baseline justify-between mt-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#1B2A4A] tracking-tight">
                {completedHours}
              </span>
              <span className="text-sm font-bold text-[#7E8D9F]">/ {targetHours} Saat</span>
            </div>
            <p className="text-xs text-[#4A5B78] mt-0.5 font-medium">
              {isTargetMet ? (
                <span className="text-[#2E6B4F] font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Tebrikler, haftalık hedefini tamamladın!
                </span>
              ) : (
                <span>Hedefe ulaşmak için <strong>{remainingHours} saat</strong> kaldı</span>
              )}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                isTargetMet ? 'text-[#2E6B4F]' : 'text-[#D97736]'
              }`}
            >
              %{percentage}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 w-full bg-[#EFEBE0] h-3 rounded-full overflow-hidden p-0.5 border border-[#DFD9CC]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isTargetMet ? 'bg-[#2E6B4F]' : 'bg-[#D97736]'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </div>

      {/* Target Breakdown Footer */}
      <div className="mt-4 pt-3 border-t border-[#DFD9CC] flex items-center justify-between text-xs text-[#7E8D9F]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#255A8A]" />
          <span>Günlük Ort: <strong>{(completedHours / 7).toFixed(1)} sa/gün</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#2E6B4F]" />
          <span>Kalan Gün: <strong>{7 - ((new Date().getDay() || 7) - 1)} gün</strong></span>
        </div>
      </div>
    </div>
  );
};
