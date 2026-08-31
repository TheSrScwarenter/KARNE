import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Tag,
  Hash,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  booksService,
  PUBLISHER_PRESETS,
  SUBJECT_OPTIONS,
  COMPREHENSIVE_CURRICULUM,
  getCurriculumKey,
} from '../lib/booksService';
import { BookDifficulty, StudentBook } from '../types';

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (book: StudentBook) => void;
  studentId: string;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentId,
}) => {
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('3D Yayınları');
  const [customPublisher, setCustomPublisher] = useState('');
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'TYT-AYT'>('TYT');
  const [subject, setSubject] = useState('Matematik');
  const [difficulty, setDifficulty] = useState<BookDifficulty>('orta');
  const [totalQuestions, setTotalQuestions] = useState<number>(1400);
  const [targetDate, setTargetDate] = useState<string>('');
  const [studentNotes, setStudentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const actualPublisher = publisher === 'Diğer Yayınevi' ? customPublisher.trim() || 'Özel Yayın' : publisher;

  // Get preview of curriculum topics for this selection
  const currKey = getCurriculumKey(examType, subject);
  const previewTopics = COMPREHENSIVE_CURRICULUM[currKey]?.topics || [];

  const handleQuickPreset = (presetTitle: string, presetPub: string, pExam: 'TYT' | 'AYT' | 'TYT-AYT', pSubj: string, pDiff: BookDifficulty, pQ: number) => {
    setTitle(presetTitle);
    setPublisher(presetPub);
    setExamType(pExam);
    setSubject(pSubj);
    setDifficulty(pDiff);
    setTotalQuestions(pQ);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Lütfen kitap adını giriniz.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await booksService.addBook({
        student_id: studentId,
        title: title.trim(),
        publisher: actualPublisher,
        exam_type: examType,
        subject,
        difficulty,
        total_questions: totalQuestions > 0 ? Number(totalQuestions) : undefined,
        target_completion_date: targetDate || null,
        student_notes: studentNotes.trim() || null,
        status: 'in_progress',
      });

      onSuccess(created);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Kitap eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#DFD9CC] rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-xl relative my-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DFD9CC]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5 text-[#D97736]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1B2A4A] tracking-tight">
                Yeni Kaynak & Kitap Ekle
              </h2>
              <p className="text-xs text-[#4A5B78]">
                Kitabını tanımla, YKS konuları otomatik yüklensin ve çözdükçe tik at.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-[#F7F4EE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-[#C0392B]/10 border border-[#C0392B]/30 text-[#C0392B] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Popular Presets */}
        <div>
          <span className="text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D97736]" /> Popüler YKS Kaynak Şablonları (Hızlı Seçim)
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickPreset('3D TYT Matematik Soru Bankası', '3D Yayınları', 'TYT', 'Matematik', 'orta', 1650)}
              className="px-2.5 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] text-xs font-semibold transition-all"
            >
              3D TYT Mat
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Bilgi Sarmal AYT Fizik Soru Bankası', 'Bilgi Sarmal', 'AYT', 'Fizik', 'orta', 1200)}
              className="px-2.5 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] text-xs font-semibold transition-all"
            >
              Bilgi Sarmal AYT Fizik
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Orijinal TYT-AYT Geometri', 'Orijinal Yayınları', 'TYT-AYT', 'Geometri', 'zor', 1450)}
              className="px-2.5 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] text-xs font-semibold transition-all"
            >
              Orijinal Geometri
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Aydın AYT Kimya Soru Bankası', 'Aydın Yayınları', 'AYT', 'Kimya', 'zor', 1150)}
              className="px-2.5 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] text-xs font-semibold transition-all"
            >
              Aydın AYT Kimya
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Palme AYT Biyoloji Soru Bankası', 'Palme Yayınları', 'AYT', 'Biyoloji', 'orta', 1300)}
              className="px-2.5 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] text-xs font-semibold transition-all"
            >
              Palme AYT Biyo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Title & Publisher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                Kitap / Kaynak Adı *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: 3D TYT Matematik Soru Bankası"
                className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                Yayınevi
              </label>
              <select
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
              >
                {PUBLISHER_PRESETS.map((pub) => (
                  <option key={pub} value={pub}>
                    {pub}
                  </option>
                ))}
              </select>

              {publisher === 'Diğer Yayınevi' && (
                <input
                  type="text"
                  value={customPublisher}
                  onChange={(e) => setCustomPublisher(e.target.value)}
                  placeholder="Yayınevi adını yazınız..."
                  className="mt-2 w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Row 2: Exam Type & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                Sınav Türü
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl">
                {(['TYT', 'AYT', 'TYT-AYT'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setExamType(t)}
                    className={`py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      examType === t
                        ? 'bg-[#1B2A4A] text-white shadow-xs'
                        : 'text-[#4A5B78] hover:bg-[#EFEBE0]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                Ders
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
              >
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Difficulty, Total Questions & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                Zorluk Seviyesi
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as BookDifficulty)}
                className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
              >
                <option value="kolay">🟢 Kolay (Temel / Başlangıç)</option>
                <option value="orta">🟡 Orta (ÖSYM Standartı)</option>
                <option value="zor">🔴 Zor (İleri Düzey)</option>
                <option value="derece">🟣 Derece (Yüksek Hedef)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                Toplam Soru Sayısı
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                placeholder="Örn: 1500"
                className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                Hedef Bitiş Tarihi
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
              />
            </div>
          </div>

          {/* Student Note */}
          <div>
            <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
              Öğrenci Notu / Çözüm Stratejisi (Opsiyonel)
            </label>
            <input
              type="text"
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Örn: Hafta sonları 3'er test çözülecek, kırmızı soruları koçuma soracağım..."
              className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none placeholder:text-[#7E8D9F]"
            />
          </div>

          {/* Automatic Curriculum Topic Checklist Preview */}
          <div className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1B2A4A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E6B4F]" />
                Otomatik Eklenecek Konu Listesi ({previewTopics.length} Konu)
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#DFD9CC] text-[#4A5B78]">
                {currKey}
              </span>
            </div>

            <p className="text-[11px] text-[#4A5B78]">
              Kitap eklendiğinde aşağıdaki konular için etkileşimli tik kutucukları oluşturulacaktır:
            </p>

            <div className="max-h-32 overflow-y-auto pr-1 flex flex-wrap gap-1.5">
              {previewTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#DFD9CC] text-[10px] font-medium text-[#1B2A4A]"
                >
                  {i + 1}. {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#DFD9CC]/60">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-[#F7F4EE] text-[#4A5B78] text-xs font-bold hover:bg-[#EFEBE0] transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl bg-[#1B2A4A] text-white text-xs font-extrabold hover:bg-[#1B2A4A]/90 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4 text-[#D97736]" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Kitabı ve Konuları Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
