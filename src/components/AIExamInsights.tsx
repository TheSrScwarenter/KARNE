import React from 'react';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  BookOpen,
  GitBranch,
  RefreshCw,
  Loader2,
  CheckCircle,
  Plus,
  BarChart2,
  FileText,
} from 'lucide-react';
import { AIExamAnalysis } from '../lib/examsService';

interface AIExamInsightsProps {
  analysis: AIExamAnalysis | null;
  loading: boolean;
  onRefresh: () => void;
  examCount: number;
  onOpenAddModal?: () => void;
}

export const AIExamInsights: React.FC<AIExamInsightsProps> = ({
  analysis,
  loading,
  onRefresh,
  examCount,
  onOpenAddModal,
}) => {
  const getTrendBadge = (trend: 'düşüş' | 'sabit' | 'yükseliş') => {
    switch (trend) {
      case 'yükseliş':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#34C759]/10 text-[#34C759]">
            <TrendingUp className="w-3 h-3" />
            <span>Yükseliş Trendi</span>
          </span>
        );
      case 'düşüş':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF3B30]/10 text-[#FF3B30]">
            <TrendingDown className="w-3 h-3" />
            <span>Düşüş Uyarısı</span>
          </span>
        );
      case 'sabit':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/[0.05] text-[#86868B]">
            <Minus className="w-3 h-3" />
            <span>Sabit / Plato</span>
          </span>
        );
    }
  };

  return (
    <div
      id="ai-exam-insights-section"
      className="bento-card p-6 sm:p-7 bg-white space-y-5 transition-all"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-black/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#1D1D1F]">
                AI Deneme Analizi & Çapraz İçgörüler
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3] uppercase tracking-wide">
                Gemini 3.7
              </span>
            </div>
            <p className="text-xs text-[#86868B] mt-0.5">
              Son 90 günün deneme ders/konu sonuçları ve Yanlış Soru Bankası korelasyonu
            </p>
          </div>
        </div>

        {/* Action Button */}
        {examCount > 0 && (
          <button
            type="button"
            id="btn-trigger-ai-analysis"
            onClick={onRefresh}
            disabled={loading}
            className="apple-btn-primary py-2.5 px-5 text-xs font-semibold rounded-full flex items-center gap-2 disabled:opacity-40 self-start sm:self-auto cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analiz Yapılıyor...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>AI Analizini Yenile</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 1. STATE: NO EXAMS LOGGED AT ALL */}
      {examCount === 0 && (
        <div className="py-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] text-[#86868B] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-[#1D1D1F]">
              Henüz Kayıtlı Deneme Sınavı Bulunmuyor
            </h4>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Yapay zeka analiz motorunun ders bazlı net değişimlerini, zayıf konuları ve Yanlış Soru Bankası hatalarınızla korelasyonunu hesaplayabilmesi için en az bir deneme sonucu girmeniz gerekmektedir.
            </p>
          </div>
          {onOpenAddModal && (
            <div className="pt-2">
              <button
                type="button"
                id="btn-add-first-exam-cta"
                onClick={onOpenAddModal}
                className="apple-btn-primary py-2.5 px-6 text-xs font-semibold rounded-full inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Denemeni Kaydet</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. STATE: LOADING */}
      {examCount > 0 && loading && (
        <div className="py-12 text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] animate-pulse">
            <Sparkles className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-[#1D1D1F]">
            YKS deneme sonuçlarınız ve soru bankası hatalarınız taranıyor...
          </p>
          <p className="text-[11px] text-[#86868B]">
            Trend çizgileri, zayıf konular ve çapraz korelasyonlar hesaplanıyor.
          </p>
        </div>
      )}

      {/* 3. STATE: EXAMS EXIST BUT NO ANALYSIS TRIGGERED YET */}
      {examCount > 0 && !loading && !analysis && (
        <div className="py-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center mx-auto">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1D1D1F]">
              AI Analizi Henüz Çalıştırılmadı
            </h4>
            <p className="text-xs text-[#86868B]">
              Kayıtlı {examCount} deneme sınavınız üzerinden ders performansları, kritik konu açıkları ve soru bankası kesişimlerini incelemek için analizi başlatın.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-run-initial-ai"
              onClick={onRefresh}
              className="apple-btn-primary py-2.5 px-6 text-xs font-semibold rounded-full inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yapay Zeka Analizini Başlat</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. STATE: ANALYSIS READY WITH REAL DATA */}
      {examCount > 0 && !loading && analysis && (
        <div className="pt-2 space-y-6">
          {/* Section 1: Zayıf Dersler & Trend Yorumu */}
          {analysis.weak_subjects && analysis.weak_subjects.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-[#FF9500]" />
                <span>Ders Performansı & Trend Yorumları</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {analysis.weak_subjects.map((ws, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1D1D1F]">{ws.subject}</span>
                      {getTrendBadge(ws.trend)}
                    </div>
                    <p className="text-xs text-[#86868B] leading-relaxed">
                      {ws.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Zayıf Konular (exam_topic_results) */}
          {analysis.weak_topics && analysis.weak_topics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#0071E3]" />
                <span>Kritik Zayıf Konular (Deneme Hata Dağılımı)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {analysis.weak_topics.map((wt, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-block text-[10px] font-semibold uppercase text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-full mb-1">
                        {wt.subject}
                      </span>
                      <h5 className="text-xs font-semibold text-[#1D1D1F] truncate">
                        {wt.topic}
                      </h5>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-bold text-[#FF3B30] font-mono">
                        {wt.wrong_count}
                      </span>
                      <span className="block text-[9px] text-[#86868B] font-medium">yanlış</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Çapraz İçgörüler (Yanlış Soru Bankası ile Örtüşen Konular) */}
          {analysis.cross_insights && analysis.cross_insights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-[#34C759]" />
                <span>Çapraz İçgörüler (Denemeler & Yanlış Soru Bankası Kesişimi)</span>
              </h4>

              <div className="space-y-2.5">
                {analysis.cross_insights.map((insight, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-[#34C759]/5 border border-[#34C759]/15 flex items-start gap-3 text-xs text-[#1D1D1F]"
                  >
                    <CheckCircle className="w-4 h-4 text-[#34C759] flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Analyzed Timestamp */}
          {analysis.analyzed_at && (
            <div className="pt-2 text-right">
              <span className="text-[10px] text-[#86868B]">
                Son Güncelleme: {new Date(analysis.analyzed_at).toLocaleDateString('tr-TR')} {new Date(analysis.analyzed_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
