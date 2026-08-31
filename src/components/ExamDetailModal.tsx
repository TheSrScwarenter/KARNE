import React from 'react';
import {
  X,
  Award,
  Calendar,
  Layers,
  Trash2,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { Exam } from '../types';
import { examsService } from '../lib/examsService';

interface ExamDetailModalProps {
  exam: Exam | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const ExamDetailModal: React.FC<ExamDetailModalProps> = ({
  exam,
  onClose,
  onDelete,
}) => {
  if (!exam) return null;

  const totalNet = examsService.calculateTotalNet(exam);
  const totalCorrect = (exam.subject_results || []).reduce((acc, s) => acc + (s.correct || 0), 0);
  const totalWrong = (exam.subject_results || []).reduce((acc, s) => acc + (s.wrong || 0), 0);
  const totalBlank = (exam.subject_results || []).reduce((acc, s) => acc + (s.blank || 0), 0);

  return (
    <div
      id="exam-detail-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#DFD9CC] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-6 transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-[#F7F4EE] flex items-center justify-center font-bold shadow-xs">
              <Award className="w-5 h-5 text-[#D97736]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight">
                  {exam.exam_name}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                  {exam.exam_type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#7E8D9F] mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#EFEBE0] flex items-center justify-center text-[#7E8D9F] hover:text-[#1B2A4A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Summary Badges */}
          <div className="grid grid-cols-4 gap-2 text-center bg-[#F7F4EE] p-3 rounded-2xl border border-[#DFD9CC]">
            <div>
              <span className="block text-[10px] font-bold text-[#7E8D9F] uppercase">Doğru</span>
              <span className="text-sm font-black text-[#2E6B4F] font-mono">{totalCorrect}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-[#7E8D9F] uppercase">Yanlış</span>
              <span className="text-sm font-black text-[#C0392B] font-mono">{totalWrong}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-[#7E8D9F] uppercase">Boş</span>
              <span className="text-sm font-black text-[#7E8D9F] font-mono">{totalBlank}</span>
            </div>
            <div className="border-l border-[#DFD9CC] pl-2">
              <span className="block text-[10px] font-bold text-[#1B2A4A] uppercase">Toplam Net</span>
              <span className="text-base font-black text-[#D97736] font-mono">{totalNet}</span>
            </div>
          </div>

          {/* Subject Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#1B2A4A]" />
              <span>Ders Bazlı Sonuçlar</span>
            </h4>

            <div className="border border-[#DFD9CC] rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#F7F4EE] text-[#7E8D9F] text-[10px] font-bold uppercase border-b border-[#DFD9CC]">
                  <tr>
                    <th className="py-2 px-3 text-left">Ders</th>
                    <th className="py-2 px-2 text-center">Doğru</th>
                    <th className="py-2 px-2 text-center">Yanlış</th>
                    <th className="py-2 px-2 text-center">Boş</th>
                    <th className="py-2 px-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFD9CC]/60">
                  {(exam.subject_results || []).map((sr) => (
                    <tr key={sr.id} className="hover:bg-[#F7F4EE]/40 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold text-[#1B2A4A]">{sr.subject}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-[#2E6B4F]">{sr.correct}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-[#C0392B]">{sr.wrong}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-[#7E8D9F]">{sr.blank}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-[#1B2A4A]">
                        {sr.net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Topic Mistakes (if any) */}
          {exam.topic_results && exam.topic_results.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#255A8A]" />
                <span>Kaydedilen Konu Hataları</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exam.topic_results.map((tr) => (
                  <div
                    key={tr.id}
                    className="p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#255A8A] block">
                        {tr.subject}
                      </span>
                      <span className="font-bold text-[#1B2A4A]">{tr.topic}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#C0392B]/10 text-[#C0392B] font-mono font-black text-xs">
                      {tr.wrong_count} Yanlış
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDelete(exam.id);
              onClose();
            }}
            className="px-3 py-2 text-xs font-bold text-[#C0392B] hover:bg-[#C0392B]/10 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Denemeyi Sil</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl hover:bg-[#1B2A4A]/90 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
