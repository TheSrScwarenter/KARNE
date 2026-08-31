import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Plus,
  Loader2,
  Sliders,
} from 'lucide-react';
import { ProgramConstraints, DEFAULT_CONSTRAINTS } from '../lib/programService';

interface ConstraintFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (constraints: ProgramConstraints) => Promise<void>;
  initialConstraints?: ProgramConstraints;
  loading: boolean;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Pazartesi', short: 'Pzt' },
  { id: 1, name: 'Salı', short: 'Sal' },
  { id: 2, name: 'Çarşamba', short: 'Çar' },
  { id: 3, name: 'Perşembe', short: 'Per' },
  { id: 4, name: 'Cuma', short: 'Cum' },
  { id: 5, name: 'Cumartesi', short: 'Cmt' },
  { id: 6, name: 'Pazar', short: 'Paz' },
];

export const ConstraintFormModal: React.FC<ConstraintFormModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  initialConstraints,
  loading,
}) => {
  const [targetHours, setTargetHours] = useState<number>(
    initialConstraints?.target_hours || DEFAULT_CONSTRAINTS.target_hours
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialConstraints?.available_days || DEFAULT_CONSTRAINTS.available_days
  );
  const [weekdayHours, setWeekdayHours] = useState<{ start: string; end: string }>({
    start: '17:00',
    end: '22:00',
  });
  const [weekendHours, setWeekendHours] = useState<{ start: string; end: string }>({
    start: '09:00',
    end: '19:00',
  });
  const [notes, setNotes] = useState<string>(
    initialConstraints?.notes || 'Hafta sonu denemeleri ve Türev-Elektrik pekiştirmesi önceliklidir.'
  );

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      alert('Lütfen çalışabileceğiniz en az bir gün seçin.');
      return;
    }

    const daily_slots = selectedDays.map((d) => {
      const isWeekend = d === 5 || d === 6;
      return {
        day: d,
        start: isWeekend ? weekendHours.start : weekdayHours.start,
        end: isWeekend ? weekendHours.end : weekdayHours.end,
        label: DAYS_OF_WEEK[d].name,
      };
    });

    await onGenerate({
      target_hours: targetHours,
      available_days: selectedDays,
      daily_slots,
      notes,
    });
  };

  return (
    <div
      id="constraint-form-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#DFD9CC] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-6 transition-all">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-[#F7F4EE] flex items-center justify-center font-bold shadow-xs">
              <Sliders className="w-5 h-5 text-[#D97736]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight">
                AI Program Kısıt ve Tercih Formu
              </h2>
              <p className="text-[11px] text-[#7E8D9F]">
                Haftalık hedef saat ve müsaitlik aralıklarınıza göre yapay zeka ders programı üretir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#EFEBE0] flex items-center justify-center text-[#7E8D9F] hover:text-[#1B2A4A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Target Hours */}
          <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-[#1B2A4A] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D97736]" />
                <span>Haftalık Toplam Çalışma Hedefi</span>
              </label>
              <span className="text-sm font-black text-[#1B2A4A] font-mono bg-white px-2.5 py-0.5 rounded-lg border border-[#DFD9CC]">
                {targetHours} Saat / Hafta
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={2}
              value={targetHours}
              onChange={(e) => setTargetHours(Number(e.target.value))}
              className="w-full h-2 bg-[#DFD9CC] rounded-lg appearance-none cursor-pointer accent-[#1B2A4A]"
            />
            <div className="flex justify-between text-[10px] text-[#7E8D9F] font-bold mt-1">
              <span>10 Saat (Hafif)</span>
              <span>30 Saat (Önerilen)</span>
              <span>60 Saat (Yoğun Kamp)</span>
            </div>
          </div>

          {/* Available Days Grid */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-2">
              Müsait Çalışma Günleri (Haftalık Grid)
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`py-2 px-1 rounded-xl text-center border text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                        : 'bg-[#F7F4EE] text-[#7E8D9F] border-[#DFD9CC] hover:bg-[#EFEBE0]'
                    }`}
                  >
                    <span className="text-[10px] uppercase opacity-80">{day.short}</span>
                    <span className="text-xs font-black">{day.id + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots (Weekdays & Weekends) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Weekday Slot */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#DFD9CC]">
              <span className="block text-xs font-bold text-[#1B2A4A] mb-2">
                Hafta İçi Müsait Saatler
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={weekdayHours.start}
                  onChange={(e) => setWeekdayHours((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full py-1.5 px-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#1B2A4A]"
                />
                <span className="text-[#7E8D9F] text-xs font-bold">-</span>
                <input
                  type="time"
                  value={weekdayHours.end}
                  onChange={(e) => setWeekdayHours((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full py-1.5 px-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#1B2A4A]"
                />
              </div>
            </div>

            {/* Weekend Slot */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#DFD9CC]">
              <span className="block text-xs font-bold text-[#1B2A4A] mb-2">
                Hafta Sonu Müsait Saatler
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={weekendHours.start}
                  onChange={(e) => setWeekendHours((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full py-1.5 px-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#1B2A4A]"
                />
                <span className="text-[#7E8D9F] text-xs font-bold">-</span>
                <input
                  type="time"
                  value={weekendHours.end}
                  onChange={(e) => setWeekendHours((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full py-1.5 px-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#1B2A4A]"
                />
              </div>
            </div>
          </div>

          {/* Notes & Special Focus */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1">
              Özel Odak veya Koç Notları (Opsiyonel)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Hafta içi okuldan sonra 1 saat dinlenme olsun, Pazar günü AYT denemesi yapılsın..."
              className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          {/* Info Banner */}
          <div className="p-3 rounded-xl bg-[#255A8A]/10 border border-[#255A8A]/20 flex items-start gap-2.5 text-xs text-[#1B2A4A]">
            <Sparkles className="w-4 h-4 text-[#D97736] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Program oluşturulurken <strong>Deneme Analizindeki zayıf dersleriniz</strong>, <strong>Yanlış Soru Bankası hatalarınız</strong> ve <strong>geçmiş çalışma süreleriniz</strong> Gemini 3.7 tarafından otomatik harmanlanacaktır.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#DFD9CC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A] rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              id="btn-confirm-generate-program"
              disabled={loading}
              className="py-2.5 px-5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs font-bold rounded-2xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D97736]" />
                  <span>AI Program Oluşturuyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#D97736]" />
                  <span>AI ile Program Oluştur</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
