import React from 'react';
import {
  X,
  Sparkles,
  Lightbulb,
  Calendar,
  Trash2,
  BookOpen,
  Tag,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { WrongQuestion, ErrorType } from '../types';

interface QuestionDetailModalProps {
  question: WrongQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const ERROR_TYPE_LABELS: Record<
  ErrorType,
  { label: string; bg: string; text: string; border: string }
> = {
  dikkatsizlik: {
    label: 'Dikkatsizlik / İşlem Hatası',
    bg: 'bg-[#D97736]/10',
    text: 'text-[#D97736]',
    border: 'border-[#D97736]/30',
  },
  bilgi_eksikligi: {
    label: 'Bilgi Eksikliği',
    bg: 'bg-[#C0392B]/10',
    text: 'text-[#C0392B]',
    border: 'border-[#C0392B]/30',
  },
  kavram_yanilgisi: {
    label: 'Kavram Yanılgısı',
    bg: 'bg-[#4A3E72]/10',
    text: 'text-[#4A3E72]',
    border: 'border-[#4A3E72]/30',
  },
  zaman_yetersizligi: {
    label: 'Zaman Yetersizliği',
    bg: 'bg-[#255A8A]/10',
    text: 'text-[#255A8A]',
    border: 'border-[#255A8A]/30',
  },
  soru_tipi_yanlis_anlama: {
    label: 'Soru Tipi Yanlış Anlama',
    bg: 'bg-[#2E6B4F]/10',
    text: 'text-[#2E6B4F]',
    border: 'border-[#2E6B4F]/30',
  },
};

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  isOpen,
  onClose,
  onDelete,
}) => {
  if (!isOpen || !question) return null;

  const errorMeta =
    ERROR_TYPE_LABELS[question.error_type] || ERROR_TYPE_LABELS.bilgi_eksikligi;

  const formattedDate = new Date(question.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="question-detail-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#DFD9CC] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#1B2A4A] text-white">
              {question.subject}
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight">
                {question.topic}
              </h2>
              {question.subtopic && (
                <p className="text-xs text-[#4A5B78]">{question.subtopic}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Bu soruyu bankanızdan silmek istediğinize emin misiniz?')) {
                  onDelete(question.id);
                  onClose();
                }
              }}
              title="Soruyu Sil"
              className="w-8 h-8 rounded-full hover:bg-[#C0392B]/10 text-[#7E8D9F] hover:text-[#C0392B] flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#EFEBE0] flex items-center justify-center text-[#7E8D9F] hover:text-[#1B2A4A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata Badges Bar */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Error Type Badge */}
            <span
              className={`px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 ${errorMeta.bg} ${errorMeta.text} ${errorMeta.border}`}
            >
              <Tag className="w-3.5 h-3.5" />
              {errorMeta.label}
            </span>

            {/* Difficulty Badge */}
            <span className="px-3 py-1 rounded-full font-bold bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] capitalize">
              Zorluk: {question.difficulty}
            </span>

            {/* Date Badge */}
            <span className="px-3 py-1 rounded-full font-medium bg-[#F7F4EE] text-[#7E8D9F] border border-[#DFD9CC] flex items-center gap-1.5 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>

          {/* Soru Görseli (Eğer Varsa) */}
          {question.image_url && (
            <div className="p-2 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] flex flex-col items-center">
              <img
                src={question.image_url}
                alt="Soru Görseli"
                className="max-h-96 w-auto rounded-xl object-contain shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Soru Metni */}
          {question.raw_text && (
            <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7E8D9F] mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#1B2A4A]" />
                Soru Metni & Öğrenci Çözümü
              </h3>
              <p className="text-xs text-[#1B2A4A] leading-relaxed whitespace-pre-line font-mono bg-white p-3 rounded-xl border border-[#DFD9CC]/60">
                {question.raw_text}
              </p>
            </div>
          )}

          {/* Öğrenci Notu (Neden Yanlış Yaptım) */}
          {question.student_note && (
            <div className="p-4 rounded-2xl bg-[#D97736]/5 border border-[#D97736]/20">
              <h3 className="text-xs font-bold text-[#D97736] mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Öğrenci Notu (Neden Yanlış Yaptım?)
              </h3>
              <p className="text-xs text-[#1B2A4A] italic leading-relaxed">
                "{question.student_note}"
              </p>
            </div>
          )}

          {/* AI Analizi ve Açıklaması */}
          {question.ai_explanation && (
            <div className="p-4 rounded-2xl bg-[#1B2A4A]/5 border border-[#1B2A4A]/15">
              <h3 className="text-xs font-extrabold text-[#1B2A4A] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D97736]" />
                Yapay Zeka Hata Analizi
              </h3>
              <p className="text-xs text-[#1B2A4A] leading-relaxed">
                {question.ai_explanation}
              </p>
            </div>
          )}

          {/* Çalışma Önerisi */}
          {question.study_tip && (
            <div className="p-4 rounded-2xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/20">
              <h3 className="text-xs font-extrabold text-[#2E6B4F] mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                Benzer Sorular İçin Koçluk / Çalışma Önerisi
              </h3>
              <p className="text-xs text-[#1B2A4A] leading-relaxed font-medium">
                {question.study_tip}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
