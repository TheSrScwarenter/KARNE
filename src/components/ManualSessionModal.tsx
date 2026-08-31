import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  BookOpen,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import { studySessionsService } from '../lib/studySessionsService';

const YKS_SUBJECTS = [
  'Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türkçe',
  'Geometri',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü',
  'Genel Deneme',
  'Diğer',
];

interface ManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
}

export const ManualSessionModal: React.FC<ManualSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentId,
}) => {
  const [subject, setSubject] = useState<string>('Matematik');
  const [topic, setTopic] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(30);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      setErrorMsg('Lütfen geçerli bir çalışma süresi girin (en az 1 dakika).');
      return;
    }

    if (!date) {
      setErrorMsg('Lütfen çalışma tarihini seçin.');
      return;
    }

    setSaving(true);
    try {
      // Build start_time and end_time based on date
      const startTime = new Date(date);
      startTime.setHours(14, 0, 0, 0); // Default to midday
      const endTime = new Date(startTime.getTime() + totalMinutes * 60 * 1000);

      await studySessionsService.addSession({
        student_id: studentId,
        subject,
        topic: topic.trim() || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: totalMinutes,
        source: 'manual',
      });

      // Reset and close
      setTopic('');
      setHours(1);
      setMinutes(30);
      onClose();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to add manual session:', err);
      setErrorMsg(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="manual-session-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#DFD9CC] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-8 transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight">
                Manuel Çalışma Kaydı Ekle
              </h2>
              <p className="text-[11px] text-[#4A5B78]">
                Geçmişte yaptığınız veya kronometre kullanmadığınız çalışmaları ekleyin
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#D97736]" />
              Ders <span className="text-[#C0392B]">*</span>
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
            >
              {YKS_SUBJECTS.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#255A8A]" />
              Konu / Detay (Opsiyonel)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Örn: 2. Dereceden Denklemler & Karmaşık Sayılar"
              className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] placeholder:text-[#7E8D9F]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#4A3E72]" />
              Çalışma Tarihi <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          {/* Duration: Hours and Minutes */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2E6B4F]" />
                Çalışma Süresi <span className="text-[#C0392B]">*</span>
              </span>
              <span className="text-[11px] font-mono text-[#7E8D9F] font-bold">
                Toplam: {hours * 60 + minutes} Dakika ({((hours * 60 + minutes) / 60).toFixed(1)} Saat)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] text-center"
                  />
                  <span className="text-xs text-[#7E8D9F] font-bold">Saat</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] text-center"
                  />
                  <span className="text-xs text-[#7E8D9F] font-bold">Dakika</span>
                </div>
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {[
                { label: '30 dk', h: 0, m: 30 },
                { label: '45 dk', h: 0, m: 45 },
                { label: '1 Saat', h: 1, m: 0 },
                { label: '1.5 Saat', h: 1, m: 30 },
                { label: '2 Saat', h: 2, m: 0 },
                { label: '3 Saat', h: 3, m: 0 },
              ].map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setHours(p.h);
                    setMinutes(p.m);
                  }}
                  className="px-2.5 py-1 bg-[#EFEBE0] hover:bg-[#DFD9CC] text-[#1B2A4A] text-[11px] font-bold rounded-lg border border-[#DFD9CC] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DFD9CC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A] rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              id="btn-save-manual-session"
              disabled={saving}
              className="py-2.5 px-5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D97736]" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D97736]" />
                  <span>Geçmiş Kaydı Ekle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
