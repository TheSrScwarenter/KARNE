import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  AlertTriangle,
  Sparkles,
  Eye,
  Trash2,
  RefreshCw,
  FolderOpen,
  TrendingUp,
  Brain,
  Target,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  HelpCircle,
  Database,
  Cloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WrongQuestion, ErrorType, WrongQuestionsAnalysisReport } from '../types';
import { wrongQuestionsService } from '../lib/wrongQuestionsService';
import { NewQuestionModal } from '../components/NewQuestionModal';
import { QuestionDetailModal } from '../components/QuestionDetailModal';

const ERROR_TYPE_CONFIG: Record<
  ErrorType,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  dikkatsizlik: {
    label: 'Dikkatsizlik',
    bg: 'bg-[#D97736]/10',
    text: 'text-[#D97736]',
    border: 'border-[#D97736]/30',
    dot: 'bg-[#D97736]',
  },
  bilgi_eksikligi: {
    label: 'Bilgi Eksikliği',
    bg: 'bg-[#C0392B]/10',
    text: 'text-[#C0392B]',
    border: 'border-[#C0392B]/30',
    dot: 'bg-[#C0392B]',
  },
  kavram_yanilgisi: {
    label: 'Kavram Yanılgısı',
    bg: 'bg-[#4A3E72]/10',
    text: 'text-[#4A3E72]',
    border: 'border-[#4A3E72]/30',
    dot: 'bg-[#4A3E72]',
  },
  zaman_yetersizligi: {
    label: 'Zaman Yetersizliği',
    bg: 'bg-[#255A8A]/10',
    text: 'text-[#255A8A]',
    border: 'border-[#255A8A]/30',
    dot: 'bg-[#255A8A]',
  },
  soru_tipi_yanlis_anlama: {
    label: 'Soru Tipi Yanlış Anlama',
    bg: 'bg-[#2E6B4F]/10',
    text: 'text-[#2E6B4F]',
    border: 'border-[#2E6B4F]/30',
    dot: 'bg-[#2E6B4F]',
  },
};

export const WrongQuestions: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // AI Analysis report state
  const [aiReport, setAiReport] = useState<WrongQuestionsAnalysisReport | null>(null);
  const [analyzingSummary, setAnalyzingSummary] = useState<boolean>(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState<boolean>(true);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<WrongQuestion | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Filter states
  const [selectedExamType, setSelectedExamType] = useState<'all' | 'TYT' | 'AYT'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedErrorType, setSelectedErrorType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const studentId = user?.id || 'st-demo-001';

  // Load questions
  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await wrongQuestionsService.getQuestions(studentId);
      setQuestions(data);

      if (data.length > 0) {
        wrongQuestionsService
          .analyzeWrongQuestionsSummary(data, false)
          .then((rep) => setAiReport(rep))
          .catch((err) => console.warn('AI summary fetch failed:', err));
      } else {
        setAiReport(null);
      }
    } catch (err) {
      console.error('Failed to load wrong questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (questions.length === 0) return;
    setAnalyzingSummary(true);
    try {
      const rep = await wrongQuestionsService.analyzeWrongQuestionsSummary(questions, true);
      setAiReport(rep);
      setIsAnalysisExpanded(true);
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAnalyzingSummary(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [studentId]);

  // Repetition Warnings calculation (3+ in last 30 days for same subject + topic)
  const repetitionWarnings = useMemo(() => {
    return wrongQuestionsService.getRepetitionWarnings(questions);
  }, [questions]);

  // Distinct subjects for filter dropdown
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set).sort();
  }, [questions]);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Exam type filter
      if (selectedExamType !== 'all') {
        const qExamType = q.exam_type || (q.subject.includes('AYT') ? 'AYT' : 'TYT');
        if (qExamType !== selectedExamType) {
          return false;
        }
      }

      // Subject filter
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) {
        return false;
      }

      // Error type filter
      if (selectedErrorType !== 'all' && q.error_type !== selectedErrorType) {
        return false;
      }

      // Date range filter
      if (dateRange !== 'all') {
        const itemTime = new Date(q.created_at).getTime();
        const now = Date.now();
        if (dateRange === '7days' && now - itemTime > 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
        if (dateRange === '30days' && now - itemTime > 30 * 24 * 60 * 60 * 1000) {
          return false;
        }
        if (dateRange === '90days' && now - itemTime > 90 * 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTopic = (q.topic || '').toLowerCase().includes(query);
        const matchSubtopic = (q.subtopic || '').toLowerCase().includes(query);
        const matchSubject = (q.subject || '').toLowerCase().includes(query);
        const matchText = (q.raw_text || '').toLowerCase().includes(query);
        const matchNote = (q.student_note || '').toLowerCase().includes(query);
        const matchAi = (q.ai_explanation || '').toLowerCase().includes(query);
        return matchTopic || matchSubtopic || matchSubject || matchText || matchNote || matchAi;
      }

      return true;
    });
  }, [questions, selectedExamType, selectedSubject, selectedErrorType, dateRange, searchQuery]);

  const handleDeleteQuestion = async (id: string) => {
    await wrongQuestionsService.deleteQuestion(id);
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    if (updated.length > 0) {
      wrongQuestionsService
        .analyzeWrongQuestionsSummary(updated, true)
        .then((rep) => setAiReport(rep))
        .catch(() => {});
    } else {
      setAiReport(null);
    }
  };

  const handleOpenDetail = (q: WrongQuestion) => {
    setSelectedQuestion(q);
    setIsDetailModalOpen(true);
  };

  const handleFilterToWarning = (subject: string, topic: string) => {
    setSelectedSubject(subject);
    setSearchQuery(topic);
  };

  const resetFilters = () => {
    setSelectedExamType('all');
    setSelectedSubject('all');
    setSelectedErrorType('all');
    setDateRange('all');
    setSearchQuery('');
  };

  return (
    <div id="wrong-questions-page" className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#DFD9CC] rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#1B2A4A] text-white">
              HATA KASASI
            </span>
            <span className="font-caveat text-lg text-[#D97736] font-bold">
              • Soru Sınıflandırma & AI Teşhis
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>{wrongQuestionsService.isSupabaseActive() ? 'Supabase Doğrudan Veritabanı Aktif' : 'Güvenli Depolama (IndexedDB)'}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1B2A4A] tracking-tight mt-1">
            Hata Kasası & Soru Kütüphanesi
          </h1>
          <p className="text-xs text-[#4A5B78] mt-1">
            Yanlış yaptığın soruları TYT/AYT, ders, konu ve hata tipiyle kaydet; yapay zeka en çok yanlış çıkan konularını tespit edip çalışma reçeteni çıkarsın.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-run-ai-summary"
            onClick={handleRunAiAnalysis}
            disabled={analyzingSummary || questions.length === 0}
            className="py-3 px-4 bg-[#D97736]/10 hover:bg-[#D97736]/20 text-[#D97736] border border-[#D97736]/30 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Yapay zekanın tüm yanlış sorularını analiz etmesini sağlar"
          >
            <Sparkles className={`w-4 h-4 ${analyzingSummary ? 'animate-spin' : ''}`} />
            <span>{analyzingSummary ? 'AI Analiz Ediyor...' : 'AI Zayıf Konu Teşhisi'}</span>
          </button>

          <button
            onClick={loadQuestions}
            title="Yenile"
            className="p-3 bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] rounded-2xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-open-new-question"
            onClick={() => setIsNewModalOpen(true)}
            className="py-3 px-5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#D97736]" />
            <span>Yeni Soru Ekle</span>
          </button>
        </div>
      </div>

      {/* AI WEAK TOPICS & ROOT CAUSE ANALYSIS PANEL */}
      {aiReport && (
        <div className="bg-white border border-[#DFD9CC] rounded-3xl p-5 shadow-xs overflow-hidden transition-all">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#D97736]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-[#1B2A4A]">
                    Yapay Zeka Zayıf Konu & Hata Kök Neden Teşhisi
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/30">
                    {aiReport.total_questions_analyzed} Soru İncelendi
                  </span>
                </div>
                <p className="text-[11px] text-[#4A5B78] mt-0.5">
                  Öncelikli Odak: <strong className="text-[#D97736] font-bold">{aiReport.recommended_focus_area}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#7E8D9F]">
              <span>{isAnalysisExpanded ? 'Gizle' : 'Genişlet'}</span>
              {isAnalysisExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {isAnalysisExpanded && (
            <div className="mt-5 pt-4 border-t border-[#DFD9CC] space-y-5">
              {/* Strategic Insights Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aiReport.strategic_insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs text-[#1B2A4A] flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-lg bg-[#D97736]/15 text-[#D97736] flex items-center justify-center font-black flex-shrink-0 mt-0.5 text-[10px]">
                      {idx + 1}
                    </div>
                    <p className="leading-relaxed font-medium">{insight}</p>
                  </div>
                ))}
              </div>

              {/* Weak Topics Ranked List & Error Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Ranked Weak Topics (2 Cols) */}
                <div className="lg:col-span-2 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A] flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#C0392B]" />
                      En Çok Yanlış Yapılan Konular (Sıralı Teşhis)
                    </h3>
                    <span className="text-[11px] text-[#7E8D9F]">Tıklayarak sorulara filtreleyin</span>
                  </div>

                  <div className="space-y-2">
                    {aiReport.weak_topics.map((item, idx) => {
                      const errConf = ERROR_TYPE_CONFIG[item.primary_error_type] || ERROR_TYPE_CONFIG.bilgi_eksikligi;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleFilterToWarning(item.subject, item.topic)}
                          className="p-3.5 rounded-2xl bg-[#F7F4EE]/60 hover:bg-[#F7F4EE] border border-[#DFD9CC] cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                item.severity === 'kritik'
                                  ? 'bg-[#C0392B] text-white'
                                  : item.severity === 'orta'
                                  ? 'bg-[#D97736] text-white'
                                  : 'bg-[#1B2A4A] text-white'
                              }`}
                            >
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.exam_type && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#1B2A4A] text-white">
                                    {item.exam_type}
                                  </span>
                                )}
                                <span className="text-xs font-bold text-[#4A5B78]">
                                  {item.subject}
                                </span>
                                <span className="text-xs font-black text-[#1B2A4A]">
                                  {item.topic}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${errConf.bg} ${errConf.text} ${errConf.border}`}
                                >
                                  {errConf.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4A5B78] mt-1 italic flex items-center gap-1">
                                <Lightbulb className="w-3 h-3 text-[#D97736] flex-shrink-0" />
                                <span>{item.study_action}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-white border border-[#DFD9CC] text-[#1B2A4A] whitespace-nowrap shadow-2xs">
                              {item.count} Yanlış
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Error Type Distribution Bar & Percentages (1 Col) */}
                <div className="bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A] flex items-center gap-1.5 mb-3">
                      <TrendingUp className="w-3.5 h-3.5 text-[#2E6B4F]" />
                      Hata Tipi Dağılımı
                    </h3>

                    <div className="space-y-2.5">
                      {aiReport.error_type_distribution.map((errDist, idx) => {
                        const errConf = ERROR_TYPE_CONFIG[errDist.error_type] || ERROR_TYPE_CONFIG.bilgi_eksikligi;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#1B2A4A] flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${errConf.dot}`} />
                                {errDist.label}
                              </span>
                              <span className="font-mono font-bold text-[#4A5B78]">
                                %{errDist.percentage} ({errDist.count})
                              </span>
                            </div>
                            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#DFD9CC]">
                              <div
                                className={`h-full ${errConf.dot} rounded-full transition-all`}
                                style={{ width: `${errDist.percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#DFD9CC]/80 text-[11px] text-[#7E8D9F] text-center">
                    💡 İpucu: Dikkatsizlik oranınızı düşürmek için soru köklerini altını çizerek okuyun.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REPETITION WARNING BANNER (Tekrar Uyarısı) */}
      {repetitionWarnings.length > 0 && (
        <div className="space-y-2">
          {repetitionWarnings.map((warn, idx) => (
            <div
              key={idx}
              id={`repetition-warning-${idx}`}
              className="p-4 rounded-2xl bg-[#C0392B]/10 border-2 border-[#C0392B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C0392B] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-[#C0392B] text-sm flex items-center gap-1.5">
                    <span>Tekrar Hatası Uyarısı</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#C0392B] text-white font-bold">
                      {warn.count} Kez Yanlış
                    </span>
                  </div>
                  <p className="text-[#1B2A4A] font-semibold mt-0.5">
                    Bu konudan son 30 günde <strong className="text-[#C0392B] font-bold">{warn.count} kez</strong> yanlış yaptın:{' '}
                    <span className="bg-white/80 px-2 py-0.5 rounded border border-[#C0392B]/20 font-bold text-[#1B2A4A]">
                      {warn.subject} — {warn.topic}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleFilterToWarning(warn.subject, warn.topic)}
                className="self-start sm:self-auto py-2 px-3.5 bg-white hover:bg-[#F7F4EE] border border-[#C0392B]/30 text-[#C0392B] font-bold rounded-xl transition-all shadow-2xs whitespace-nowrap"
              >
                Bu Soruları İncele ({warn.count})
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border border-[#DFD9CC] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Exam Type Filter (TYT / AYT) */}
          <div className="flex items-center gap-1 p-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl self-start lg:self-auto">
            {(['all', 'TYT', 'AYT'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedExamType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedExamType === type
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                }`}
              >
                {type === 'all' ? 'Tüm Sınavlar' : type}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7E8D9F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Konu, alt konu veya soru metni ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] placeholder:text-[#7E8D9F] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8D9F] hover:text-[#1B2A4A]"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="min-w-[140px]">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
            >
              <option value="all">Tüm Dersler</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Error Type Filter */}
          <div className="min-w-[180px]">
            <select
              value={selectedErrorType}
              onChange={(e) => setSelectedErrorType(e.target.value)}
              className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
            >
              <option value="all">Tüm Hata Tipleri</option>
              <option value="bilgi_eksikligi">🔴 Bilgi Eksikliği</option>
              <option value="dikkatsizlik">🟠 Dikkatsizlik / İşlem</option>
              <option value="kavram_yanilgisi">🟣 Kavram Yanılgısı</option>
              <option value="zaman_yetersizligi">🔵 Zaman Yetersizliği</option>
              <option value="soru_tipi_yanlis_anlama">🟢 Soru Tipi Yanlış Anlama</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="min-w-[130px]">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="7days">Son 7 Gün</option>
              <option value="30days">Son 30 Gün</option>
              <option value="90days">Son 3 Ay</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedExamType !== 'all' ||
            selectedSubject !== 'all' ||
            selectedErrorType !== 'all' ||
            dateRange !== 'all' ||
            searchQuery) && (
            <button
              onClick={resetFilters}
              className="py-2.5 px-3.5 bg-[#EFEBE0] hover:bg-[#DFD9CC] text-[#1B2A4A] text-xs font-bold rounded-2xl transition-colors whitespace-nowrap"
            >
              Sıfırla
            </button>
          )}
        </div>

        {/* Results Counter & Active Filter Pills */}
        <div className="flex items-center justify-between text-xs text-[#7E8D9F] pt-2 border-t border-[#DFD9CC]/60">
          <span>
            Toplam <strong>{filteredQuestions.length}</strong> soru listeleniyor
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#4A5B78]">
              {questions.length} kayıtlı soru
            </span>
          </div>
        </div>
      </div>

      {/* QUESTIONS BENTO GRID */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-[#DFD9CC] rounded-3xl">
          <div className="w-8 h-8 rounded-full border-2 border-[#1B2A4A] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#4A5B78]">Sorular yükleniyor...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#DFD9CC] rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] flex items-center justify-center mx-auto text-[#7E8D9F]">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-[#1B2A4A]">Eşleşen Soru Bulunamadı</h3>
          <p className="text-xs text-[#7E8D9F] max-w-md mx-auto">
            Filtrelerinize uygun soru bulunmuyor veya henüz soru eklemediniz. Yeni soru ekleyerek hata kütüğünüzü oluşturmaya başlayın.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            + İlk Sorunu Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredQuestions.map((q) => {
            const errConfig = ERROR_TYPE_CONFIG[q.error_type] || ERROR_TYPE_CONFIG.bilgi_eksikligi;
            const dateStr = new Date(q.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
            });

            const displayExamType = q.exam_type || (q.subject.includes('AYT') ? 'AYT' : 'TYT');

            return (
              <div
                key={q.id}
                id={`question-card-${q.id}`}
                className="bento-card p-5 bg-white flex flex-col justify-between relative group hover:shadow-md transition-all border-[#DFD9CC] overflow-hidden"
              >
                {/* Small Red X Stamp Motif in top corner (Kırmızı Çarpı Damga Motifi) */}
                <div
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#C0392B]/10 border border-[#C0392B]/30 flex items-center justify-center text-[#C0392B] font-black text-sm select-none shadow-2xs"
                  title="Yanlış Soru Damgası"
                >
                  ✕
                </div>

                <div>
                  {/* Card Top Badges */}
                  <div className="flex items-center gap-2 pr-8 flex-wrap mb-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#1B2A4A] text-white">
                      {displayExamType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F7F4EE] border border-[#DFD9CC] text-[#1B2A4A]">
                      {q.subject}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${errConfig.bg} ${errConfig.text} ${errConfig.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${errConfig.dot}`} />
                      {errConfig.label}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-[#7E8D9F]">
                      {dateStr}
                    </span>
                  </div>

                  {/* Topic Title */}
                  <h3 className="text-sm font-extrabold text-[#1B2A4A] tracking-tight leading-snug">
                    {q.topic}
                  </h3>
                  {q.subtopic && (
                    <p className="text-[11px] text-[#4A5B78] font-medium mt-0.5">
                      {q.subtopic}
                    </p>
                  )}

                  {/* Thumbnail / Text Snippet */}
                  {q.image_url ? (
                    <div
                      onClick={() => handleOpenDetail(q)}
                      className="mt-3 relative rounded-xl overflow-hidden bg-[#F7F4EE] border border-[#DFD9CC] cursor-pointer group/img max-h-36 flex items-center justify-center p-1"
                    >
                      <img
                        src={q.image_url}
                        alt={q.topic}
                        className="max-h-32 w-auto object-contain rounded-lg group-hover/img:scale-102 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 rounded-xl">
                        <Eye className="w-4 h-4" /> Büyüt
                      </div>
                    </div>
                  ) : q.raw_text ? (
                    <div
                      onClick={() => handleOpenDetail(q)}
                      className="mt-3 p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] cursor-pointer hover:bg-[#EFEBE0] transition-colors"
                    >
                      <p className="text-xs text-[#1B2A4A] line-clamp-3 font-mono leading-relaxed">
                        {q.raw_text}
                      </p>
                    </div>
                  ) : null}

                  {/* Student Note Snippet */}
                  {q.student_note && (
                    <div className="mt-2.5 p-2 rounded-xl bg-[#D97736]/5 border border-[#D97736]/15 text-[11px] text-[#4A5B78] flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#D97736] flex-shrink-0 mt-0.5" />
                      <p className="italic line-clamp-2">"{q.student_note}"</p>
                    </div>
                  )}

                  {/* AI Explanation Snippet */}
                  {q.ai_explanation && (
                    <div className="mt-2.5 p-2 rounded-xl bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 text-[11px] text-[#1B2A4A] flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D97736] flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-2 font-medium">{q.ai_explanation}</p>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[#DFD9CC] flex items-center justify-between">
                  <div className="text-[10px] font-bold text-[#7E8D9F] uppercase tracking-wider capitalize">
                    {q.difficulty} Seviye
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (window.confirm('Bu soruyu silmek istiyor musunuz?')) {
                          handleDeleteQuestion(q.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-[#7E8D9F] hover:text-[#C0392B] hover:bg-[#C0392B]/10 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDetail(q)}
                      className="py-1 px-2.5 rounded-lg bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>İncele</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW QUESTION MODAL */}
      <NewQuestionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => {
          loadQuestions();
        }}
        studentId={studentId}
      />

      {/* QUESTION DETAIL MODAL */}
      <QuestionDetailModal
        question={selectedQuestion}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedQuestion(null);
        }}
        onDelete={handleDeleteQuestion}
      />
    </div>
  );
};
