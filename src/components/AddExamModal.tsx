import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { ExamType } from '../types';
import { examsService } from '../lib/examsService';

interface SubjectRowInput {
  subject: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
}

interface TopicRowInput {
  subject: string;
  topic: string;
  wrong_count: number;
}

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
}

const COMMON_SUBJECTS = [
  'Türkçe',
  'Matematik',
  'Geometri',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Fen Bilimleri',
  'Sosyal Bilgiler',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü',
  'Edebiyat',
];

const TEMPLATES: Record<ExamType, SubjectRowInput[]> = {
  TYT: [
    { subject: 'Türkçe', correct: 35, wrong: 4, blank: 1, net: 34.0 },
    { subject: 'Sosyal Bilgiler', correct: 16, wrong: 3, blank: 1, net: 15.25 },
    { subject: 'Matematik', correct: 30, wrong: 4, blank: 6, net: 29.0 },
    { subject: 'Fen Bilimleri', correct: 16, wrong: 3, blank: 1, net: 15.25 },
  ],
  AYT: [
    { subject: 'Matematik', correct: 32, wrong: 4, blank: 4, net: 31.0 },
    { subject: 'Fizik', correct: 11, wrong: 2, blank: 1, net: 10.5 },
    { subject: 'Kimya', correct: 12, wrong: 1, blank: 0, net: 11.75 },
    { subject: 'Biyoloji', correct: 12, wrong: 1, blank: 0, net: 11.75 },
  ],
  'branş': [
    { subject: 'Matematik', correct: 34, wrong: 4, blank: 2, net: 33.0 },
  ],
};

export const AddExamModal: React.FC<AddExamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentId,
}) => {
  const [examName, setExamName] = useState<string>('');
  const [examType, setExamType] = useState<ExamType>('TYT');
  const [examDate, setExamDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [subjects, setSubjects] = useState<SubjectRowInput[]>(TEMPLATES.TYT);
  const [showTopicDetails, setShowTopicDetails] = useState<boolean>(false);
  const [topics, setTopics] = useState<TopicRowInput[]>([
    { subject: 'Matematik', topic: '', wrong_count: 1 },
  ]);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Change exam type and load template
  const handleTypeChange = (newType: ExamType) => {
    setExamType(newType);
    setSubjects(TEMPLATES[newType].map((s) => ({ ...s })));
  };

  // Update subject row
  const updateSubjectRow = (
    index: number,
    field: 'subject' | 'correct' | 'wrong' | 'blank',
    value: any
  ) => {
    setSubjects((prev) => {
      const copy = [...prev];
      const row = { ...copy[index] };

      if (field === 'subject') {
        row.subject = value;
      } else {
        const numVal = Math.max(0, parseInt(value) || 0);
        row[field] = numVal;
        row.net = examsService.calculateNet(
          field === 'correct' ? numVal : row.correct,
          field === 'wrong' ? numVal : row.wrong
        );
      }

      copy[index] = row;
      return copy;
    });
  };

  // Add new subject row
  const addSubjectRow = () => {
    setSubjects((prev) => [
      ...prev,
      { subject: 'Matematik', correct: 0, wrong: 0, blank: 0, net: 0 },
    ]);
  };

  // Remove subject row
  const removeSubjectRow = (index: number) => {
    if (subjects.length <= 1) return;
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  // Add topic row
  const addTopicRow = () => {
    const defaultSubj = subjects[0]?.subject || 'Matematik';
    setTopics((prev) => [...prev, { subject: defaultSubj, topic: '', wrong_count: 1 }]);
  };

  // Update topic row
  const updateTopicRow = (
    index: number,
    field: 'subject' | 'topic' | 'wrong_count',
    value: any
  ) => {
    setTopics((prev) => {
      const copy = [...prev];
      const row = { ...copy[index] };
      if (field === 'wrong_count') {
        row.wrong_count = Math.max(1, parseInt(value) || 1);
      } else {
        row[field] = value;
      }
      copy[index] = row;
      return copy;
    });
  };

  // Remove topic row
  const removeTopicRow = (index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate Total Net
  const totalNet = Number(subjects.reduce((sum, s) => sum + s.net, 0).toFixed(2));
  const totalCorrect = subjects.reduce((sum, s) => sum + s.correct, 0);
  const totalWrong = subjects.reduce((sum, s) => sum + s.wrong, 0);
  const totalBlank = subjects.reduce((sum, s) => sum + s.blank, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!examName.trim()) {
      setErrorMsg('Lütfen deneme sınavının adını girin (Örn: 3D Türkiye Geneli TYT - 1).');
      return;
    }

    if (subjects.length === 0) {
      setErrorMsg('Lütfen en az bir ders sonucu ekleyin.');
      return;
    }

    setSaving(true);
    try {
      const validTopics = showTopicDetails
        ? topics.filter((t) => t.topic.trim().length > 0)
        : [];

      await examsService.addExam({
        student_id: studentId,
        exam_name: examName.trim(),
        exam_type: examType,
        exam_date: examDate,
        subjects: subjects.map((s) => ({
          subject: s.subject,
          correct: s.correct,
          wrong: s.wrong,
          blank: s.blank,
          net: s.net,
        })),
        topics: validTopics,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add exam:', err);
      setErrorMsg(err.message || 'Deneme sınavı kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="add-exam-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#DFD9CC] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-6 transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B2A4A] text-[#F7F4EE] flex items-center justify-center font-bold">
              <Award className="w-4 h-4 text-[#D97736]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight">
                Yeni Deneme Sınavı Ekle
              </h2>
              <p className="text-[11px] text-[#4A5B78]">
                Ders bazlı netleri girin, netler otomatik hesaplansın (Doğru - Yanlış/4)
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Exam Name & Date & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Exam Name */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1">
                Deneme Adı / Yayın <span className="text-[#C0392B]">*</span>
              </label>
              <input
                id="input-exam-name"
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Örn: 3D Türkiye Geneli TYT - 1"
                required
                className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>

            {/* Exam Type Selector */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1">
                Sınav Türü <span className="text-[#C0392B]">*</span>
              </label>
              <select
                id="select-exam-type"
                value={examType}
                onChange={(e) => handleTypeChange(e.target.value as ExamType)}
                className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
              >
                <option value="TYT">TYT</option>
                <option value="AYT">AYT</option>
                <option value="branş">Branş Denemesi</option>
              </select>
            </div>

            {/* Exam Date */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1">
                Tarih <span className="text-[#C0392B]">*</span>
              </label>
              <input
                id="input-exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>

          {/* Quick Preset Template Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#7E8D9F]">Hızlı Şablon:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleTypeChange('TYT')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  examType === 'TYT'
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                    : 'bg-[#EFEBE0] text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#DFD9CC]'
                }`}
              >
                TYT Standart (Türkçe, Sosyal, Mat, Fen)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('AYT')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  examType === 'AYT'
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                    : 'bg-[#EFEBE0] text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#DFD9CC]'
                }`}
              >
                AYT Sayısal (Mat, Fiz, Kim, Biy)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('branş')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  examType === 'branş'
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                    : 'bg-[#EFEBE0] text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#DFD9CC]'
                }`}
              >
                Branş Denemesi
              </button>
            </div>
          </div>

          {/* Subject Rows Table / Input List */}
          <div className="border border-[#DFD9CC] rounded-2xl overflow-hidden bg-white">
            <div className="bg-[#F7F4EE] px-4 py-2.5 border-b border-[#DFD9CC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#1B2A4A]" />
                <span className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wide">
                  Ders Sonuçları & Net Hesaplama
                </span>
              </div>
              <button
                type="button"
                onClick={addSubjectRow}
                className="px-2.5 py-1 bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-[#D97736]" />
                <span>Ders Ekle</span>
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-2.5">
              {/* Header row on desktop */}
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-[#7E8D9F] uppercase px-2">
                <span className="col-span-4">Ders Adı</span>
                <span className="col-span-2 text-center">Doğru</span>
                <span className="col-span-2 text-center">Yanlış</span>
                <span className="col-span-2 text-center">Boş</span>
                <span className="col-span-1 text-center text-[#1B2A4A]">Net</span>
                <span className="col-span-1 text-right">İşlem</span>
              </div>

              {subjects.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#F7F4EE]/60 p-2 sm:p-2 rounded-xl border border-[#DFD9CC]/60"
                >
                  {/* Subject Name */}
                  <div className="sm:col-span-4">
                    <select
                      value={row.subject}
                      onChange={(e) => updateSubjectRow(idx, 'subject', e.target.value)}
                      className="w-full py-1.5 px-2 bg-white border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                    >
                      {COMMON_SUBJECTS.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Correct */}
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <span className="sm:hidden text-[10px] font-bold text-[#7E8D9F] w-12">Doğru:</span>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={row.correct}
                      onChange={(e) => updateSubjectRow(idx, 'correct', e.target.value)}
                      className="w-full py-1.5 px-1 bg-white border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#2E6B4F] text-center focus:outline-none focus:border-[#1B2A4A]"
                    />
                  </div>

                  {/* Wrong */}
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <span className="sm:hidden text-[10px] font-bold text-[#7E8D9F] w-12">Yanlış:</span>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={row.wrong}
                      onChange={(e) => updateSubjectRow(idx, 'wrong', e.target.value)}
                      className="w-full py-1.5 px-1 bg-white border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#C0392B] text-center focus:outline-none focus:border-[#1B2A4A]"
                    />
                  </div>

                  {/* Blank */}
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <span className="sm:hidden text-[10px] font-bold text-[#7E8D9F] w-12">Boş:</span>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={row.blank}
                      onChange={(e) => updateSubjectRow(idx, 'blank', e.target.value)}
                      className="w-full py-1.5 px-1 bg-white border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#7E8D9F] text-center focus:outline-none focus:border-[#1B2A4A]"
                    />
                  </div>

                  {/* Net */}
                  <div className="sm:col-span-1 text-center font-mono font-black text-xs text-[#1B2A4A] bg-white py-1.5 rounded-lg border border-[#DFD9CC]">
                    {row.net}
                  </div>

                  {/* Delete button */}
                  <div className="sm:col-span-1 text-right flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeSubjectRow(idx)}
                      disabled={subjects.length <= 1}
                      className="p-1 text-[#7E8D9F] hover:text-[#C0392B] disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary Footer Bar */}
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-white/80">
                <span>Doğru: <strong className="text-white">{totalCorrect}</strong></span>
                <span>Yanlış: <strong className="text-white">{totalWrong}</strong></span>
                <span>Boş: <strong className="text-white">{totalBlank}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/80 font-bold uppercase text-[10px]">Toplam Net:</span>
                <span className="text-base font-black text-[#D97736] font-mono">
                  {totalNet}
                </span>
              </div>
            </div>
          </div>

          {/* Optional: Konu Bazlı Detay Ekle (Accordion) */}
          <div className="border border-[#DFD9CC] rounded-2xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowTopicDetails(!showTopicDetails)}
              className="w-full bg-[#F7F4EE] px-4 py-3 flex items-center justify-between text-xs font-bold text-[#1B2A4A] hover:bg-[#EFEBE0] transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#255A8A]" />
                <span>Konu Bazlı Yanlış Detayı Ekle (Opsiyonel)</span>
                <span className="text-[10px] font-normal text-[#7E8D9F]">
                  — AI Analizi için zayıf konu tespitini güçlendirir
                </span>
              </div>
              {showTopicDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTopicDetails && (
              <div className="p-4 space-y-3 border-t border-[#DFD9CC]">
                <p className="text-[11px] text-[#7E8D9F]">
                  Bu denemede yanlış yaptığınız spesifik konuları ve yanlış sayılarını girin:
                </p>

                {topics.map((tRow, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-2">
                    <select
                      value={tRow.subject}
                      onChange={(e) => updateTopicRow(tIdx, 'subject', e.target.value)}
                      className="w-36 py-1.5 px-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg text-xs font-bold text-[#1B2A4A]"
                    >
                      {subjects.map((s, i) => (
                        <option key={i} value={s.subject}>
                          {s.subject}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={tRow.topic}
                      onChange={(e) => updateTopicRow(tIdx, 'topic', e.target.value)}
                      placeholder="Örn: Türev - Ekstremum Noktalar veya Paragraf"
                      className="flex-1 py-1.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg text-xs text-[#1B2A4A]"
                    />

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={tRow.wrong_count}
                        onChange={(e) => updateTopicRow(tIdx, 'wrong_count', e.target.value)}
                        className="w-14 py-1.5 px-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg text-xs font-bold text-center text-[#C0392B]"
                      />
                      <span className="text-[10px] text-[#7E8D9F] font-bold">yanlış</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTopicRow(tIdx)}
                      className="p-1 text-[#7E8D9F] hover:text-[#C0392B]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTopicRow}
                  className="px-3 py-1.5 text-xs font-bold text-[#255A8A] bg-[#255A8A]/10 hover:bg-[#255A8A]/20 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Başka Konu Yanlışı Ekle</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
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
              id="btn-save-exam"
              disabled={saving}
              className="py-2.5 px-5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D97736]" />
                  <span>Deneme Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D97736]" />
                  <span>Denemeyi Kaydet ({totalNet} Net)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
