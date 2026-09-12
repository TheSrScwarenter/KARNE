import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Check,
  Copy,
  Clock,
  Target,
  FileText,
  Flame,
  Trophy,
  GraduationCap,
  Sparkles,
  BookOpen,
  X,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { weeklyReportService, WeeklySummaryData } from '../lib/weeklyReportService';
import { useAuth } from '../context/AuthContext';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData?: WeeklySummaryData;
  studentId?: string;
  studentName?: string;
  studentField?: string;
  targetDept?: string;
  coachName?: string;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  studentId,
  studentName,
  studentField = 'SAY',
  targetDept,
  coachName,
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WeeklySummaryData | null>(reportData || null);
  const printRef = useRef<HTMLDivElement>(null);

  const effectiveStudentId = studentId || user?.id || 'st-demo-001';
  const effectiveStudentName = studentName || user?.full_name || 'Öğrenci';
  const effectiveCoachName = coachName || user?.coach_name || (user?.coach_id ? 'Rehber Koç' : '');

  // Fetch real data when opened
  useEffect(() => {
    if (!isOpen) return;

    if (reportData) {
      setData(reportData);
      return;
    }

    let isMounted = true;
    setLoading(true);

    weeklyReportService
      .getRealWeeklyReportData(
        effectiveStudentId,
        effectiveStudentName,
        studentField,
        targetDept || 'Hedef Üniversite / Bölüm',
        effectiveCoachName
      )
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load weekly report data:', err);
        if (isMounted) {
          setData(
            weeklyReportService.getWeeklyReportData(
              effectiveStudentName,
              studentField,
              targetDept,
              effectiveCoachName
            )
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, effectiveStudentId, effectiveStudentName, effectiveCoachName, studentField, targetDept, reportData]);

  if (!isOpen) return null;

  const currentReport: WeeklySummaryData =
    data ||
    weeklyReportService.getWeeklyReportData(
      effectiveStudentName,
      studentField,
      targetDept,
      effectiveCoachName
    );

  const handleCopyWhatsApp = async () => {
    const text = weeklyReportService.generateWhatsAppShareText(currentReport);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Printable CSS Injection to ensure clean horizontal/portrait print of the report */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-weekly-report,
          #printable-weekly-report * {
            visibility: visible !important;
          }
          #printable-weekly-report {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
            font-size: 11pt !important;
          }
          .print-hidden-element {
            display: none !important;
          }
        }
      `}</style>

      {/* Container */}
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-black/10 overflow-hidden my-auto animate-in fade-in max-h-[92vh] flex flex-col">
        {/* Top Control Bar (Non-printable) */}
        <div className="p-4 sm:px-6 bg-[#1B2A4A] text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/10 text-[#D97736]">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Haftalık Veli & Öğrenci Özet Raporu</h3>
              <p className="text-[11px] text-white/70">Gerçek çalışma verileriyle A4 PDF ve WhatsApp paylaşımı</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı!' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              id="btn-print-weekly-report"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-[#1B2A4A] hover:bg-gray-100 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Yazdır / PDF Kaydet</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Sheet */}
        <div
          ref={printRef}
          id="printable-weekly-report"
          className="p-6 sm:p-8 bg-white overflow-y-auto space-y-6 text-[#1D1D1F] print:p-0 print:m-0 print:w-full"
        >
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#7E8D9F]">
              <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
              <p className="text-xs font-semibold">Öğrencinin haftalık verileri toplanıyor...</p>
            </div>
          ) : (
            <>
              {/* Sheet Header */}
              <div className="border-b-2 border-[#1B2A4A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-[#1B2A4A]">studii</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#1B2A4A] text-white uppercase tracking-wider">
                      YKS GELİŞİM
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-[#1B2A4A] mt-1">
                    HAFTALIK GELİŞİM & VELİ BİLGİLENDİRME RAPORU
                  </h2>
                  <p className="text-xs text-[#86868B] font-medium">{currentReport.weekRange}</p>
                </div>

                <div className="text-left sm:text-right text-xs space-y-0.5 bg-[#F5F5F7] p-3 rounded-2xl sm:bg-transparent sm:p-0">
                  <div className="font-bold text-[#1D1D1F] text-sm">{currentReport.studentName}</div>
                  <div className="text-[#86868B] text-[11px]">
                    Alan: <strong className="text-[#1D1D1F]">{currentReport.studentField}</strong> • Hedef:{' '}
                    <strong className="text-[#1D1D1F]">{currentReport.targetDepartment}</strong>
                  </div>
                  <div className="flex items-center sm:justify-end gap-1.5 text-[11px] font-semibold mt-1">
                    {currentReport.hasCoach ? (
                      <span className="text-[#0071E3] flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        Rehber Koç: {currentReport.coachName}
                      </span>
                    ) : (
                      <span className="text-[#7E8D9F] flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                        <UserX className="w-3 h-3 text-gray-500" />
                        Koç: Henüz Atanmadı
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Core Hero Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06]">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#0071E3]" /> Çalışma Süresi
                  </span>
                  <div className="text-xl font-black text-[#1B2A4A] mt-1">
                    {currentReport.totalStudyHours} <span className="text-xs font-semibold text-[#86868B]">saat</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    Hedef: {currentReport.targetStudyHours} sa
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06]">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3 text-[#D97736]" /> Çözülen Soru
                  </span>
                  <div className="text-xl font-black text-[#1B2A4A] mt-1">
                    {currentReport.totalQuestionsSolved} <span className="text-xs font-semibold text-[#86868B]">soru</span>
                  </div>
                  <span className="text-[10px] text-[#0071E3] font-bold">
                    %{currentReport.accuracyPercentage} Doğruluk
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06]">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-600" /> Çalışma Serisi
                  </span>
                  <div className="text-xl font-black text-[#D97736] mt-1">
                    {currentReport.streakDays} <span className="text-xs font-semibold text-[#86868B]">gün</span>
                  </div>
                  <span className="text-[10px] text-[#86868B] font-semibold">Düzenli Çalışma</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06]">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-500" /> Lig & Sıra
                  </span>
                  <div className="text-xl font-black text-[#1B2A4A] mt-1">
                    {currentReport.leagueRank}. <span className="text-xs font-semibold text-[#86868B]">sıra</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">{currentReport.leagueName}</span>
                </div>
              </div>

              {/* 2-Column Section: Ders Dağılımı & Denemeler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Ders Bazlı Dağılım */}
                <div className="p-4 rounded-2xl border border-black/[0.08] space-y-3">
                  <h4 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>Ders Bazlı Çalışma Dağılımı</span>
                  </h4>
                  {currentReport.subjectBreakdown.length === 0 ? (
                    <p className="text-xs text-[#86868B] py-2">Bu hafta kayıtlı çalışma oturumu bulunmuyor.</p>
                  ) : (
                    <div className="space-y-2">
                      {currentReport.subjectBreakdown.map((s) => (
                        <div key={s.subject} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#1D1D1F]">{s.subject}</span>
                          <div className="flex items-center gap-3 text-[#86868B]">
                            <span>{s.hours} saat</span>
                            <span className="font-bold text-[#1B2A4A]">{s.questions} soru</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Deneme Sınavları */}
                <div className="p-4 rounded-2xl border border-black/[0.08] space-y-3">
                  <h4 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bu Haftanın Deneme Sonuçları</span>
                  </h4>
                  {currentReport.exams.length === 0 ? (
                    <p className="text-xs text-[#86868B] py-2">Bu hafta girilmiş deneme sınavı bulunmuyor.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {currentReport.exams.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#F5F5F7] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-[#1D1D1F]">{ex.name}</div>
                            <div className="text-[10px] text-[#86868B]">{ex.date} • {ex.type}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-[#0071E3]">{ex.totalNet}</span>
                            <span className="text-[10px] font-bold text-[#86868B] block">Net</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Coach Evaluation Note */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-bold text-[#D97736] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
                  <span>
                    {currentReport.hasCoach
                      ? 'Koçun Haftalık Değerlendirmesi & Veli Notu'
                      : 'Sistem Rehberlik Değerlendirmesi & Veli Notu'}
                  </span>
                </h4>
                <p className="text-xs text-[#1D1D1F] leading-relaxed italic">
                  "{currentReport.coachWeeklyNote}"
                </p>
              </div>

              {/* Critical Topics Section (Kritik Çalışılması Gereken Konular) */}
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#C0392B]" />
                    <span>Kritik Çalışılması Gereken Konular</span>
                  </h4>
                  <span className="text-[10px] text-[#86868B]">Deneme ve soru analizine dayalı</span>
                </div>

                {currentReport.criticalTopics && currentReport.criticalTopics.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1D1D1F]">
                    {currentReport.criticalTopics.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-xl bg-white border border-[#DFD9CC]"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-[#1B2A4A]">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-emerald-500/20 flex items-center gap-2 text-emerald-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Henüz kritik bir konu yok.</strong> Tüm derslerde dengeli ilerliyorsunuz veya yeni deneme analizi bekleniyor.
                    </span>
                  </div>
                )}
              </div>

              {/* Signatures Footer */}
              <div className="pt-4 border-t border-black/[0.08] flex items-center justify-between text-xs text-[#86868B]">
                <div>
                  <span>Rapor Oluşturulma Tarihi: </span>
                  <strong className="text-[#1D1D1F]">{new Date().toLocaleDateString('tr-TR')}</strong>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="border-b border-black/20 w-28 mb-1" />
                    <span className="text-[10px]">
                      {currentReport.hasCoach ? 'Rehber Koç Kaşesi' : 'Sistem Onayı'}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-black/20 w-28 mb-1" />
                    <span className="text-[10px]">Veli İmzası</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
