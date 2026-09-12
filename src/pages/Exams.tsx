import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Plus,
  Sparkles,
  Calendar,
  ChevronRight,
  BookOpen,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Exam, ExamType, WrongQuestion } from '../types';
import { examsService, AIExamAnalysis } from '../lib/examsService';
import { wrongQuestionsService } from '../lib/wrongQuestionsService';
import { AddExamModal } from '../components/AddExamModal';
import { ExamTrendChart } from '../components/ExamTrendChart';
import { AIExamInsights } from '../components/AIExamInsights';
import { ExamDetailModal } from '../components/ExamDetailModal';

export const Exams: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.id || 'st-demo-001';

  const [exams, setExams] = useState<Exam[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Filters & Search for Exam List
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<ExamType | 'ALL'>('ALL');

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIExamAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Fetch exams & wrong questions
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedExams, fetchedWQ] = await Promise.all([
        examsService.getExams(studentId),
        wrongQuestionsService.getQuestions(studentId),
      ]);
      setExams(fetchedExams);
      setWrongQuestions(fetchedWQ);

      if (fetchedExams.length > 0) {
        // Check cached AI analysis
        const cachedAI = examsService.getCachedAIAnalysis(studentId);
        if (cachedAI) {
          setAiAnalysis(cachedAI);
        } else {
          setAiAnalysis(null);
        }
      } else {
        setAiAnalysis(null);
        examsService.clearCachedAIAnalysis(studentId);
      }
    } catch (err) {
      console.error('Failed to load exams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  // Trigger AI Analysis
  const handleTriggerAI = async () => {
    if (exams.length === 0) return;
    setAiLoading(true);
    try {
      const result = await examsService.analyzeExamsWithAI(studentId, exams, wrongQuestions);
      setAiAnalysis(result);
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Delete Exam
  const handleDeleteExam = async (examId: string) => {
    await examsService.deleteExam(examId);
    setExams((prev) => {
      const updated = prev.filter((e) => e.id !== examId);
      if (updated.length === 0) {
        setAiAnalysis(null);
        examsService.clearCachedAIAnalysis(studentId);
      }
      return updated;
    });
  };

  // Filtered Exam List
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchType = typeFilter === 'ALL' || e.exam_type === typeFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        e.exam_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.subject_results || []).some((sr) =>
          sr.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchType && matchSearch;
    });
  }, [exams, typeFilter, searchQuery]);

  // Overall Stats
  const stats = useMemo(() => {
    if (exams.length === 0) {
      return { totalCount: 0, latestNet: 0, avgNet: 0, maxNet: 0 };
    }
    const nets = exams.map((e) => examsService.calculateTotalNet(e));
    const latestNet = nets[0] || 0;
    const avgNet = Number((nets.reduce((a, b) => a + b, 0) / nets.length).toFixed(1));
    const maxNet = Math.max(...nets);
    return {
      totalCount: exams.length,
      latestNet,
      avgNet,
      maxNet,
    };
  }, [exams]);

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Page Header */}
      <div className="bento-card p-6 sm:p-7 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                Deneme Analizi Modülü
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#34C759]/10 text-[#34C759] uppercase">
                Canlı Takip
              </span>
            </div>
            <p className="text-xs text-[#86868B] mt-0.5">
              TYT / AYT deneme sınavı netleri, dinamik netleme formülü, gelişim trendleri ve AI zayıf konu tespiti
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="btn-open-add-exam"
            onClick={() => setIsAddModalOpen(true)}
            className="apple-btn-primary py-2.5 px-5 text-xs font-semibold rounded-full flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Deneme Ekle</span>
          </button>

          {exams.length > 0 && (
            <button
              type="button"
              id="btn-header-ai-analyze"
              onClick={handleTriggerAI}
              disabled={aiLoading}
              className="apple-btn-secondary py-2.5 px-4 text-xs font-semibold rounded-full flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#0071E3]" />
              <span className="hidden sm:inline">AI İle Analiz Et</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards (Stats Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bento-card p-4 sm:p-5 bg-white">
          <span className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wide">
            Toplam Deneme
          </span>
          <span className="text-2xl font-bold text-[#1D1D1F] font-mono mt-1 block">
            {stats.totalCount}
          </span>
          <span className="text-[10px] text-[#86868B] mt-0.5 block">TYT & AYT Sınavları</span>
        </div>

        <div className="bento-card p-4 sm:p-5 bg-white">
          <span className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wide">
            Son Deneme Neti
          </span>
          <span className="text-2xl font-bold text-[#34C759] font-mono mt-1 block">
            {stats.latestNet}
          </span>
          <span className="text-[10px] text-[#86868B] mt-0.5 block truncate">
            {exams[0]?.exam_name || 'Kayıtlı deneme yok'}
          </span>
        </div>

        <div className="bento-card p-4 sm:p-5 bg-white">
          <span className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wide">
            Ortalama Net
          </span>
          <span className="text-2xl font-bold text-[#0071E3] font-mono mt-1 block">
            {stats.avgNet}
          </span>
          <span className="text-[10px] text-[#86868B] mt-0.5 block">Tüm denemeler ortalaması</span>
        </div>

        <div className="bento-card p-4 sm:p-5 bg-white">
          <span className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wide">
            En Yüksek Net
          </span>
          <span className="text-2xl font-bold text-[#FF9500] font-mono mt-1 block">
            {stats.maxNet}
          </span>
          <span className="text-[10px] text-[#86868B] mt-0.5 block">Zirve performans skoru</span>
        </div>
      </div>

      {/* 1. Trend Grafiği (Recharts Line Chart with subject toggles) */}
      <ExamTrendChart exams={exams} />

      {/* 2. Deneme Listesi & Filtreleme Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
              Kayıtlı Deneme Sınavları ({filteredExams.length})
            </h2>
            <p className="text-xs text-[#86868B]">
              Kronolojik deneme listesi, ders netleri ve detaylı konu dökümü
            </p>
          </div>

          {/* Search & Type Filter Toolbar */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Deneme veya ders ara..."
                className="py-1.5 pl-8 pr-3.5 bg-white border border-black/[0.08] rounded-full text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] w-44 sm:w-56 transition-colors"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ExamType | 'ALL')}
              className="py-1.5 px-3 bg-white border border-black/[0.08] rounded-full text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] cursor-pointer"
            >
              <option value="ALL">Tüm Türler</option>
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="branş">Branş</option>
            </select>
          </div>
        </div>

        {/* Exams Grid / Cards */}
        {filteredExams.length === 0 ? (
          <div className="bento-card p-8 sm:p-10 bg-white text-center space-y-3">
            <Award className="w-8 h-8 text-[#86868B] mx-auto opacity-50" />
            <p className="text-xs text-[#86868B] font-semibold">
              {exams.length === 0
                ? 'Henüz kaydedilmiş deneme sınavınız bulunmuyor.'
                : 'Arama kriterlerine uygun deneme kaydı bulunamadı.'}
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="apple-btn-primary py-2 px-5 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>İlk Denemeni Ekle</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExams.map((exam) => {
              const totalNet = examsService.calculateTotalNet(exam);
              return (
                <div
                  key={exam.id}
                  id={`exam-card-${exam.id}`}
                  onClick={() => setSelectedExam(exam)}
                  className="bento-card p-5 bg-white hover:border-[#0071E3]/30 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Title, Date, Type Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors line-clamp-1">
                            {exam.exam_name}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              exam.exam_type === 'TYT'
                                ? 'bg-[#0071E3]/10 text-[#0071E3]'
                                : exam.exam_type === 'AYT'
                                ? 'bg-[#FF9500]/10 text-[#FF9500]'
                                : 'bg-[#34C759]/10 text-[#34C759]'
                            }`}
                          >
                            {exam.exam_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#86868B] mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(exam.exam_date).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Total Net Hero */}
                      <div className="text-right flex-shrink-0 bg-[#F5F5F7] px-3.5 py-1.5 rounded-2xl border border-black/[0.04]">
                        <span className="block text-[9px] font-semibold text-[#86868B] uppercase">Toplam Net</span>
                        <span className="text-lg font-bold text-[#1D1D1F] font-mono">
                          {totalNet}
                        </span>
                      </div>
                    </div>

                    {/* Subject Result Chips */}
                    <div className="flex flex-wrap gap-1.5 my-3">
                      {(exam.subject_results || []).map((sr) => (
                        <div
                          key={sr.id}
                          className="px-2.5 py-1 rounded-full bg-[#F5F5F7] border border-black/[0.04] text-[11px] flex items-center gap-1.5"
                        >
                          <span className="font-semibold text-[#1D1D1F]">{sr.subject}:</span>
                          <span className="font-mono font-bold text-[#0071E3]">{sr.net} Net</span>
                        </div>
                      ))}
                    </div>

                    {/* Topic Mistakes Preview (if any) */}
                    {exam.topic_results && exam.topic_results.length > 0 && (
                      <div className="pt-2 border-t border-black/[0.04] flex items-center gap-1.5 text-[11px] text-[#86868B]">
                        <BookOpen className="w-3 h-3 text-[#FF9500]" />
                        <span className="truncate">
                          Konu Hataları:{' '}
                          <strong className="text-[#1D1D1F]">
                            {exam.topic_results.map((tr) => `${tr.topic} (${tr.wrong_count})`).join(', ')}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Detail Link */}
                  <div className="pt-3 mt-2 border-t border-black/[0.04] flex items-center justify-between text-xs font-semibold text-[#0071E3]">
                    <span className="text-[11px] text-[#86868B] font-normal">
                      {(exam.subject_results || []).length} Ders Sonucu
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Detayları İncele</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. AI Analiz & İçgörüler Bölümü (Gemini 3.7 + Heuristics) */}
      <AIExamInsights
        analysis={aiAnalysis}
        loading={aiLoading}
        onRefresh={handleTriggerAI}
        examCount={exams.length}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Add Exam Modal */}
      <AddExamModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
        studentId={studentId}
      />

      {/* Exam Detail Modal */}
      <ExamDetailModal
        exam={selectedExam}
        onClose={() => setSelectedExam(null)}
        onDelete={handleDeleteExam}
      />
    </div>
  );
};
