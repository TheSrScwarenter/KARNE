import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { topicMasteryService } from '../lib/topicMasteryService';
import { TopicMasteryItem, SubjectMasterySummary, MasteryLevel } from '../types';
import {
  Grid,
  Search,
  Filter,
  Flame,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

interface TopicMasteryMatrixProps {
  studentId?: string;
  isCoachView?: boolean;
}

export const TopicMasteryMatrix: React.FC<TopicMasteryMatrixProps> = ({
  studentId,
  isCoachView = false,
}) => {
  const { user, navigate } = useAuth();
  const currentStudentId = studentId || user?.id || '';

  const [items, setItems] = useState<TopicMasteryItem[]>([]);
  const [summaries, setSummaries] = useState<SubjectMasterySummary[]>([]);
  const [overallPercentage, setOverallPercentage] = useState<number>(0);
  const [hasRealActivity, setHasRealActivity] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [examTypeTab, setExamTypeTab] = useState<'ALL' | 'TYT' | 'AYT'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<MasteryLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTopicInspect, setActiveTopicInspect] = useState<TopicMasteryItem | null>(null);

  const loadData = async () => {
    if (!currentStudentId) {
      setItems([]);
      setSummaries([]);
      setOverallPercentage(0);
      setHasRealActivity(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await topicMasteryService.getMasteryMatrix(currentStudentId, examTypeTab);
      setItems(data.items);
      setSummaries(data.summaries);
      setOverallPercentage(data.overallMasteryPercentage);
      setHasRealActivity(data.hasRealActivity);
    } catch (err) {
      console.error('Failed to load topic mastery matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentStudentId, examTypeTab]);

  // Unique subjects for subject filter pills
  const availableSubjects = Array.from(new Set(items.map((i) => i.subject)));

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;
    const matchesLevel = selectedLevelFilter === 'all' || item.mastery_level === selectedLevelFilter;
    const matchesSearch =
      !searchQuery ||
      item.topic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSubject && matchesLevel && matchesSearch;
  });

  const criticalCount = items.filter((i) => i.mastery_level === 'critical').length;
  const learningCount = items.filter((i) => i.mastery_level === 'learning').length;
  const competentCount = items.filter((i) => i.mastery_level === 'competent').length;
  const masteredCount = items.filter((i) => i.mastery_level === 'mastered').length;

  // Level color & tag helper
  const getLevelBadge = (level: MasteryLevel, percentage: number) => {
    switch (level) {
      case 'mastered':
        return {
          bg: 'bg-[#2E6B4F]/10 text-[#2E6B4F] border-[#2E6B4F]/25',
          cellBg: 'bg-[#2E6B4F] text-white',
          label: 'Tam Hakimiyet',
          barColor: 'bg-[#2E6B4F]',
        };
      case 'competent':
        return {
          bg: 'bg-[#255A8A]/10 text-[#255A8A] border-[#255A8A]/25',
          cellBg: 'bg-[#255A8A] text-white',
          label: 'İyi Düzeyde',
          barColor: 'bg-[#255A8A]',
        };
      case 'learning':
        return {
          bg: 'bg-[#D97736]/10 text-[#D97736] border-[#D97736]/25',
          cellBg: 'bg-[#D97736] text-white',
          label: 'Geliştirilmeli',
          barColor: 'bg-[#D97736]',
        };
      case 'critical':
      default:
        return {
          bg: 'bg-[#C0392B]/10 text-[#C0392B] border-[#C0392B]/25',
          cellBg: 'bg-[#C0392B] text-white',
          label: 'Kritik Eksik',
          barColor: 'bg-[#C0392B]',
        };
    }
  };

  return (
    <div id="topic-mastery-matrix" className="space-y-6 animate-in fade-in">
      {/* 1. Header & Quick Analytics Strip */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-[#D97736] flex items-center justify-center font-bold shadow-xs">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#1B2A4A] tracking-tight">
                  TYT & AYT Konu / Kazanım Isı Haritası
                </h2>
                <p className="text-xs text-[#7E8D9F] mt-0.5">
                  Soru bankası ilerlemeleri ve yanlış soru havuzundan hesaplanan canlı müfredat hakimiyet matrisi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Exam Type Tabs */}
            <div className="flex items-center p-1 bg-[#F7F4EE] rounded-2xl border border-[#DFD9CC]">
              <button
                type="button"
                onClick={() => setExamTypeTab('ALL')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  examTypeTab === 'ALL'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setExamTypeTab('TYT')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  examTypeTab === 'TYT'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                }`}
              >
                TYT
              </button>
              <button
                type="button"
                onClick={() => setExamTypeTab('AYT')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  examTypeTab === 'AYT'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                }`}
              >
                AYT
              </button>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] transition-colors"
              title="Isı Haritasını Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D97736]' : 'text-[#7E8D9F]'}`} />
            </button>
          </div>
        </div>

        {/* 4 Overview Mini Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC]">
            <p className="text-[11px] font-extrabold text-[#7E8D9F] uppercase tracking-wider">
              Genel Hakimiyet
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-[#1B2A4A]">%{overallPercentage}</span>
              <span className="text-xs font-bold text-[#2E6B4F]">Müfredat</span>
            </div>
            <div className="w-full h-1.5 bg-[#E2DED4] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#1B2A4A] rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          <div
            onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'critical' ? 'all' : 'critical')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedLevelFilter === 'critical'
                ? 'bg-[#C0392B]/10 border-[#C0392B] ring-2 ring-[#C0392B]/30'
                : 'bg-[#FAF8F5] border-[#DFD9CC] hover:border-[#C0392B]'
            }`}
          >
            <p className="text-[11px] font-extrabold text-[#C0392B] uppercase tracking-wider flex items-center justify-between">
              <span>Kritik Eksik</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-[#C0392B]">{criticalCount}</span>
              <span className="text-xs font-semibold text-[#7E8D9F]">Konu</span>
            </div>
            <p className="text-[10px] text-[#7E8D9F] mt-1.5">Acil tekrar & test gerekli</p>
          </div>

          <div
            onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'learning' ? 'all' : 'learning')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedLevelFilter === 'learning'
                ? 'bg-[#D97736]/10 border-[#D97736] ring-2 ring-[#D97736]/30'
                : 'bg-[#FAF8F5] border-[#DFD9CC] hover:border-[#D97736]'
            }`}
          >
            <p className="text-[11px] font-extrabold text-[#D97736] uppercase tracking-wider flex items-center justify-between">
              <span>Geliştirilmeli</span>
              <Flame className="w-3.5 h-3.5" />
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-[#D97736]">{learningCount}</span>
              <span className="text-xs font-semibold text-[#7E8D9F]">Konu</span>
            </div>
            <p className="text-[10px] text-[#7E8D9F] mt-1.5">Soru bankasından tarama</p>
          </div>

          <div
            onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'mastered' ? 'all' : 'mastered')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedLevelFilter === 'mastered'
                ? 'bg-[#2E6B4F]/10 border-[#2E6B4F] ring-2 ring-[#2E6B4F]/30'
                : 'bg-[#FAF8F5] border-[#DFD9CC] hover:border-[#2E6B4F]'
            }`}
          >
            <p className="text-[11px] font-extrabold text-[#2E6B4F] uppercase tracking-wider flex items-center justify-between">
              <span>Master / Hakim</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-[#2E6B4F]">{masteredCount}</span>
              <span className="text-xs font-semibold text-[#7E8D9F]">Konu</span>
            </div>
            <p className="text-[10px] text-[#7E8D9F] mt-1.5">%85+ Başarı oranı</p>
          </div>
        </div>

        {/* Real Activity Notice Banner */}
        {!hasRealActivity && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">Henüz Soru Bankası veya Yanlış Soru Kaydınız Yok</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Konu ısı haritası ve hakimiyet yüzdeleri, Soru Bankaları sayfasından eklediğiniz kitaplardaki test tamamlama durumunuz ve Yanlış Soru Bankası'na kaydettiğiniz sorular analiz edilerek anlık hesaplanır.
            </p>
            {!isCoachView && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/books')}
                  className="py-1.5 px-3 bg-amber-600 text-white font-bold rounded-lg text-[11px] hover:bg-amber-700 cursor-pointer"
                >
                  Kaynak Ekle
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/wrong-questions')}
                  className="py-1.5 px-3 bg-white text-amber-900 border border-amber-300 font-bold rounded-lg text-[11px] hover:bg-amber-100 cursor-pointer"
                >
                  Yanlış Soru Ekle
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Filter Bar (Search + Subject Pills + Mastery Statuses) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7E8D9F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Konu veya ders ara (Örn: Türev, Paragraf, Optik)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] placeholder:text-[#7E8D9F] focus:outline-hidden"
            />
          </div>

          {/* Level Filter Dropdown / Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-[#7E8D9F] mr-1 hidden sm:inline">Durum:</span>
            {[
              { id: 'all', label: 'Tüm Seviyeler' },
              { id: 'critical', label: '🔴 Kritik' },
              { id: 'learning', label: '🟡 Geliştirilmeli' },
              { id: 'competent', label: '🔵 İyi' },
              { id: 'mastered', label: '🟢 Hakim' },
            ].map((lvl) => {
              const active = selectedLevelFilter === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevelFilter(lvl.id as any)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    active
                      ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                      : 'bg-[#F7F4EE] text-[#4A5B78] border-[#DFD9CC] hover:bg-[#EFEBE0]'
                  }`}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-[#DFD9CC]">
          <button
            type="button"
            onClick={() => setSelectedSubject('all')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
              selectedSubject === 'all'
                ? 'bg-[#D97736] text-white border-[#D97736] shadow-xs'
                : 'bg-[#FAF8F5] text-[#4A5B78] border-[#DFD9CC] hover:bg-[#EFEBE0]'
            }`}
          >
            Tüm Dersler ({items.length})
          </button>
          {availableSubjects.map((sub) => {
            const count = items.filter((i) => i.subject === sub).length;
            const isSel = selectedSubject === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isSel
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4A5B78] border-[#DFD9CC] hover:bg-[#EFEBE0]'
                }`}
              >
                {sub} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Subject Summary Cards Strip (When 'all' subjects selected) */}
      {selectedSubject === 'all' && summaries.length > 0 && !searchQuery && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {summaries.map((s) => (
            <div
              key={`${s.exam_type}-${s.subject}`}
              onClick={() => setSelectedSubject(s.subject)}
              className="p-4 rounded-2xl bg-white border border-[#DFD9CC] shadow-xs hover:border-[#1B2A4A] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                    {s.exam_type}
                  </span>
                  <span className="text-xs font-black text-[#1B2A4A]">%{s.average_mastery_percentage}</span>
                </div>
                <h4 className="text-xs font-extrabold text-[#1B2A4A] mt-2 truncate">{s.subject}</h4>
                <p className="text-[10px] text-[#7E8D9F] mt-0.5">{s.topics_count} Konu Müfredatı</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#DFD9CC]/60 flex items-center justify-between text-[10px]">
                {s.critical_topics_count > 0 ? (
                  <span className="text-[#C0392B] font-bold">
                    {s.critical_topics_count} Kritik Konu
                  </span>
                ) : (
                  <span className="text-[#2E6B4F] font-bold">Dengeli İlerleme</span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-[#7E8D9F]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Interactive Topic Matrix Heatmap Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredItems.map((item) => {
          const badge = getLevelBadge(item.mastery_level, item.mastery_percentage);

          return (
            <div
              key={item.id}
              onClick={() => setActiveTopicInspect(item)}
              className="p-4 rounded-3xl bg-white border border-[#DFD9CC] shadow-xs hover:border-[#1B2A4A] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between relative group"
            >
              <div>
                {/* Top Badge & Importance */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                      {item.exam_type}
                    </span>
                    <span className="text-[11px] font-extrabold text-[#7E8D9F] truncate">
                      {item.subject}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Topic Title */}
                <h3 className="text-sm font-extrabold text-[#1B2A4A] group-hover:text-[#D97736] transition-colors leading-snug">
                  {item.topic_name}
                </h3>

                {/* AI Study Tip */}
                {item.ai_tip && (
                  <p className="text-[11px] text-[#4A5B78] mt-2 line-clamp-2 leading-relaxed bg-[#FAF8F5] p-2 rounded-xl border border-[#DFD9CC]/60">
                    💡 {item.ai_tip}
                  </p>
                )}
              </div>

              {/* Progress & Quick Stats Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-[#DFD9CC]/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#7E8D9F] text-[11px]">Hakimiyet Derecesi:</span>
                  <span className="text-[#1B2A4A] font-black">%{item.mastery_percentage}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#E2DED4] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${badge.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${item.mastery_percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#7E8D9F] pt-0.5">
                  <span>
                    {item.wrong_questions_count > 0 ? (
                      <strong className="text-[#C0392B]">{item.wrong_questions_count} Yanlış Soru</strong>
                    ) : (
                      'Hata Kaydı Yok'
                    )}
                  </span>
                  <span className="font-semibold text-[#1B2A4A] group-hover:underline flex items-center gap-0.5">
                    İncele <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#DFD9CC] space-y-3">
          <Layers className="w-10 h-10 text-[#7E8D9F] mx-auto opacity-50" />
          <h3 className="text-sm font-extrabold text-[#1B2A4A]">Filtreye Uygun Konu Bulunamadı</h3>
          <p className="text-xs text-[#7E8D9F] max-w-sm mx-auto">
            Arama teriminizi veya seçtiğiniz ders/seviye filtrelerini değiştirerek tekrar deneyin.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSubject('all');
              setSelectedLevelFilter('all');
              setSearchQuery('');
            }}
            className="py-2 px-4 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      )}

      {/* 5. Topic Detail Drill-down Modal */}
      {activeTopicInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#DFD9CC] shadow-xl p-6 sm:p-7 relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                  {activeTopicInspect.exam_type} • {activeTopicInspect.subject}
                </span>
                <h3 className="text-lg font-black text-[#1B2A4A] mt-1.5">
                  {activeTopicInspect.topic_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTopicInspect(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-[#7E8D9F]"
              >
                ✕
              </button>
            </div>

            {/* Diagnostic Score Card */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#7E8D9F]">Mevcut Hakimiyet Skoru</span>
                <span className="text-xl font-black text-[#1B2A4A]">%{activeTopicInspect.mastery_percentage}</span>
              </div>
              <div className="w-full h-2.5 bg-[#E2DED4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D97736] rounded-full"
                  style={{ width: `${activeTopicInspect.mastery_percentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-[#DFD9CC]">
                  <p className="text-[10px] text-[#7E8D9F] font-bold">Hata Havuzu</p>
                  <p className="font-extrabold text-[#C0392B] mt-0.5">
                    {activeTopicInspect.wrong_questions_count} Yanlış Soru
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#DFD9CC]">
                  <p className="text-[10px] text-[#7E8D9F] font-bold">Kitap Durumu</p>
                  <p className="font-extrabold text-[#1B2A4A] mt-0.5">
                    {activeTopicInspect.book_status === 'completed'
                      ? 'Tamamlandı'
                      : activeTopicInspect.book_status === 'in_progress'
                      ? 'Çözülüyor'
                      : 'Başlanmadı'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-1.5 text-xs">
              <p className="font-extrabold text-[#1B2A4A] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
                <span>AI Çalışma Tavsiyesi & ÖSYM İpucu:</span>
              </p>
              <p className="text-[#4A5B78] leading-relaxed">
                {activeTopicInspect.ai_tip || 'Bu konudan son 5 yılda düzenli soru gelmiştir. Kavrama testlerinden sonra deneme taraması yapın.'}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTopicInspect(null);
                  navigate('/wrong-questions');
                }}
                className="py-2.5 px-4 rounded-xl bg-white border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A] hover:bg-gray-50 flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#D97736]" />
                <span>Yanlış Soruları Gör</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTopicInspect(null);
                  navigate('/books');
                }}
                className="py-2.5 px-4 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold hover:bg-[#1B2A4A]/90 flex items-center gap-1.5 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#D97736]" />
                <span>Kitapta Çöz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
