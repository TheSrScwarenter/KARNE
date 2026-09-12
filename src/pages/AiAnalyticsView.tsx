import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiAnalyticsService } from '../lib/aiAnalyticsService';
import { coachService, CoachStudent } from '../lib/coachService';
import { PredictedRankBand, WeakTopicDiagnosis } from '../types';
import { TopicMasteryMatrix } from '../components/TopicMasteryMatrix';
import { RankTargetSimulator } from '../components/RankTargetSimulator';
import {
  Sparkles,
  TrendingUp,
  Target,
  AlertTriangle,
  Award,
  Zap,
  BarChart3,
  BookOpen,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  RefreshCw,
  Info,
  Users,
  Grid,
  Calculator,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';

export const AiAnalyticsView: React.FC = () => {
  const { user, navigate } = useAuth();
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  // Active Main Sub-Tab
  const [activeTab, setActiveTab] = useState<'simulator' | 'heatmap' | 'radar'>('simulator');

  // For coach, load strictly authorized assigned students
  const [coachStudents, setCoachStudents] = useState<CoachStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    if (isCoach && user) {
      coachService.getStudents(user.id, user.coach_code, user.role === 'admin').then((list) => {
        setCoachStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      });
    }
  }, [isCoach, user]);

  const currentStudentId = isCoach
    ? selectedStudentId
    : (user?.id || '');

  const selectedStudentObj = coachStudents.find((s) => s.id === currentStudentId);
  const rawField = isCoach ? selectedStudentObj?.field : user?.field;
  const studentField: 'SAY' | 'EA' | 'SOZ' | 'DIL' =
    rawField === 'SÖZ' || rawField === 'SOZ'
      ? 'SOZ'
      : rawField === 'DİL' || rawField === 'DIL'
      ? 'DIL'
      : rawField === 'EA'
      ? 'EA'
      : 'SAY';

  const [rankBand, setRankBand] = useState<PredictedRankBand | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopicDiagnosis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<'SAY' | 'EA' | 'SOZ' | 'DIL'>('SAY');

  useEffect(() => {
    if (studentField) {
      setSelectedFieldFilter(studentField);
    }
  }, [studentField]);

  const loadAnalytics = async () => {
    if (!currentStudentId) {
      setRankBand(null);
      setWeakTopics([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fetchedRank, fetchedWeak] = await Promise.all([
        aiAnalyticsService.calculatePredictedRank(currentStudentId, selectedFieldFilter),
        aiAnalyticsService.diagnoseWeakTopics(currentStudentId),
      ]);
      setRankBand(fetchedRank);
      setWeakTopics(fetchedWeak);
    } catch (err) {
      console.error('Failed to load AI analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [currentStudentId, selectedFieldFilter]);

  const copyCoachCode = () => {
    if (user?.coach_code) {
      navigator.clipboard.writeText(user.coach_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Top 3 critical urgent topics
  const top3Urgent = weakTopics.slice(0, 3);

  // If coach has zero assigned students
  if (isCoach && coachStudents.length === 0) {
    return (
      <div id="ai-analytics-view" className="space-y-6 max-w-4xl mx-auto apple-animate-in pb-12">
        <div className="bg-white p-8 rounded-3xl border border-[#DFD9CC] shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-[#1B2A4A]">
              Henüz Davet Kodunuzla Kayıt Olan Öğrenci Yok
            </h2>
            <p className="text-xs text-[#7E8D9F] max-w-md mx-auto leading-relaxed">
              Yapay Zeka ve Akıllı Analiz Destekleri, yalnızca yetkili öğrencilerinizin sisteme girdiği gerçek deneme, soru bankası ve yanlış soru verileri üzerinden çalışır. Hiçbir yapay demo veri gösterilmez.
            </p>
          </div>

          <div className="p-4 bg-[#F5F5F7] rounded-2xl border border-black/[0.04] max-w-sm mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#1D1D1F] block">
              Öğrencilerinizle Paylaşacağınız Koçluk Kodunuz:
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1.5 bg-white rounded-xl font-mono text-xs font-bold text-[#0071E3] border border-black/[0.06]">
                {user?.coach_code || 'SELIN-KOC'}
              </span>
              <button
                type="button"
                onClick={copyCoachCode}
                className="apple-btn-secondary py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="ai-analytics-view" className="space-y-6 max-w-6xl mx-auto apple-animate-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DFD9CC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-7 h-7 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#1B2A4A] tracking-tight">
                Yapay Zeka & Akıllı Analiz Destekleri
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Gerçek Veri Analiz Motoru</span>
              </span>
            </div>
            <p className="text-xs text-[#4A5B78] mt-1">
              ÖSYM geçmiş yıllar yığılma matrisi, tahmini Türkiye sıralaması simülatörü, konu ısı haritası ve eksik konu radarı.
            </p>
          </div>
        </div>

        {/* Coach Controls */}
        {isCoach && coachStudents.length > 0 && (
          <div className="flex items-center gap-2 bg-[#F7F4EE] border border-[#DFD9CC] px-3.5 py-2 rounded-2xl self-start md:self-auto">
            <Users className="w-4 h-4 text-[#255A8A]" />
            <span className="text-xs font-bold text-[#7E8D9F]">İncelenen Öğrenci:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-[#1B2A4A] focus:outline-hidden cursor-pointer"
            >
              {coachStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.field})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Apple-Style Segmented Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-[#DFD9CC] shadow-2xs flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:text-[#1B2A4A] hover:bg-[#FAF8F5]'
          }`}
        >
          <Calculator className="w-4 h-4 text-[#D97736]" />
          <span>Sıralama & Hedef Simülatörü</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('heatmap')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'heatmap'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:text-[#1B2A4A] hover:bg-[#FAF8F5]'
          }`}
        >
          <Grid className="w-4 h-4 text-[#255A8A]" />
          <span>TYT & AYT Konu Isı Haritası</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'radar'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:text-[#1B2A4A] hover:bg-[#FAF8F5]'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-[#C0392B]" />
          <span>Eksik Konu Radarı ({weakTopics.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT RENDERING */}

      {/* TAB 1: RANK TARGET SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-in fade-in">
          <RankTargetSimulator studentId={currentStudentId} />
        </div>
      )}

      {/* TAB 2: TOPIC MASTERY HEATMAP MATRIX */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6 animate-in fade-in">
          <TopicMasteryMatrix studentId={currentStudentId} isCoachView={isCoach} />
        </div>
      )}

      {/* TAB 3: ACİL EKSİK KONU RADARI */}
      {activeTab === 'radar' && (
        <div className="space-y-6 animate-in fade-in">
          {/* SECTION: YKS NET TAHMİN MOTORU & SIRALAMA SİMÜLATÖRÜ */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DFD9CC] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#1B2A4A] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#255A8A]" />
                  <span>Kayıtlı Denemelerden Sıralama Analizi</span>
                </h2>
                <p className="text-xs text-[#7E8D9F] mt-0.5">
                  Kayıtlı son deneme netleri ({rankBand?.exam_count_analyzed || 0} deneme) ve tahmini OBP baz alınarak hesaplanmıştır.
                </p>
              </div>

              {rankBand && rankBand.exam_count_analyzed > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold bg-[#F7F4EE] px-3 py-1.5 rounded-xl border border-[#DFD9CC] text-[#1B2A4A]">
                  <span>Model Güvenilirliği:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-extrabold ${
                      rankBand.confidence_level === 'high'
                        ? 'bg-[#2E6B4F] text-white'
                        : rankBand.confidence_level === 'medium'
                        ? 'bg-[#D97736] text-white'
                        : 'bg-[#7E8D9F] text-white'
                    }`}
                  >
                    {rankBand.confidence_level === 'high' ? 'Yüksek' : rankBand.confidence_level === 'medium' ? 'Orta' : 'Düşük'}
                  </span>
                </div>
              )}
            </div>

            {/* 3-Col Main Metric Cards or Empty State */}
            {(!rankBand || rankBand.exam_count_analyzed === 0) ? (
              <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-dashed border-[#DFD9CC] text-center space-y-3">
                <BarChart3 className="w-10 h-10 text-[#7E8D9F] mx-auto opacity-60" />
                <h3 className="text-sm font-extrabold text-[#1B2A4A]">Henüz Kayıtlı Deneme Sınavı Yok</h3>
                <p className="text-xs text-[#7E8D9F] max-w-md mx-auto">
                  Tahmini Türkiye sıralamanızı ve yerleştirme puanınızı gerçek veriler üzerinden hesaplayabilmemiz için sisteme en az bir TYT veya AYT denemesi kaydedin.
                </p>
                {!isCoach && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/exams')}
                      className="py-2.5 px-5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs hover:bg-[#1B2A4A]/90 cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4 text-[#D97736]" />
                      <span>İlk Denemeni Ekle</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Best Rank */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FAF4EB] to-[#F1E4D3] border border-[#D9BE9B]/60 text-[#6E421F]">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                    <span>En İyimser Sıralama</span>
                    <Award className="w-4 h-4 text-[#D97736]" />
                  </div>
                  <p className="text-3xl font-black text-[#1B2A4A] mt-3">
                    ~{rankBand.best_rank.toLocaleString('tr-TR')}
                  </p>
                  <p className="text-[11px] text-[#7E8D9F] mt-1 font-semibold">
                    Sınav zorluk katsayısı yüksek olduğunda
                  </p>
                </div>

                {/* Likely / Predicted Rank (Hero) */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white shadow-md md:-translate-y-1 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
                    <Target className="w-36 h-36 text-white" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#D97736]">
                    <span>Tahmini Türkiye Sıralaması</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-4xl font-black text-white mt-3 tracking-tight">
                    ~{rankBand.likely_rank.toLocaleString('tr-TR')}.
                  </p>
                  <p className="text-xs text-gray-200 mt-1 font-medium">
                    Ortalama Netler: <strong>{rankBand.average_tyt_net} TYT</strong> / <strong>{rankBand.average_ayt_net} AYT</strong>
                  </p>
                  <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-gray-300">
                    <span>Tahmini Yerleştirme Puanı:</span>
                    <span className="font-extrabold text-white">{rankBand.estimated_placement_score} Puan</span>
                  </div>
                </div>

                {/* Worst Rank */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#F5F7FA] to-[#E4E7EB] border border-[#CBD2D9]/60 text-[#334E68]">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                    <span>En Kötü Senaryo Bandı</span>
                    <AlertTriangle className="w-4 h-4 text-[#7E8D9F]" />
                  </div>
                  <p className="text-3xl font-black text-[#1B2A4A] mt-3">
                    ~{rankBand.worst_rank.toLocaleString('tr-TR')}
                  </p>
                  <p className="text-[11px] text-[#7E8D9F] mt-1 font-semibold">
                    Sınav kolay olup yığılma arttığında
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: ACİL TEKRAR EDİLMESİ GEREKEN KONU RADARI */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DFD9CC] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-black text-[#1B2A4A]">
                    Acil Tekrar Edilmesi Gereken Konu Radarı
                  </h2>
                </div>
                <p className="text-xs text-[#7E8D9F] mt-1">
                  Yanlış soru havuzu ve soru bankası ilerleme durumları çapraz taranarak tespit edilen yüksek riskli konular.
                </p>
              </div>

              {weakTopics.length > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/20 self-start sm:self-auto">
                  {Math.min(3, weakTopics.length)} Kritik Hedef
                </span>
              )}
            </div>

            {/* 3 Top Urgency Action Cards or Empty State */}
            {weakTopics.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-dashed border-[#DFD9CC] text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#2E6B4F] mx-auto opacity-70" />
                <h3 className="text-sm font-extrabold text-[#1B2A4A]">
                  Henüz Tespit Edilmiş Kritik Konu Eksikliği Yok
                </h3>
                <p className="text-xs text-[#7E8D9F] max-w-md mx-auto">
                  Yanlış Soru Bankası'na çözemediğiniz soruları kaydedip kaynaklarınızı ekledikçe, AI zayıf olduğunuz konuları gerçek kayıtlarınızdan tespit edip burada listeleyecektir.
                </p>
                {!isCoach && (
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/wrong-questions')}
                      className="py-2.5 px-5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs hover:bg-[#1B2A4A]/90 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-[#D97736]" />
                      <span>Yanlış Soru Ekle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/books')}
                      className="py-2.5 px-5 bg-white text-[#1B2A4A] border border-[#DFD9CC] text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs hover:bg-gray-50 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-[#255A8A]" />
                      <span>Kaynak Ekle</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top3Urgent.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl border border-[#DFD9CC] bg-[#FAF8F5] flex flex-col justify-between hover:border-[#1B2A4A] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#C0392B] text-white">
                          #{idx + 1} Acil Müdahale
                        </span>
                        <span className="text-xs font-black text-[#2E6B4F] bg-[#2E6B4F]/10 px-2 py-0.5 rounded-lg">
                          +{item.estimated_net_gain} Net Kazancı
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-extrabold text-[#7E8D9F] uppercase tracking-wider">
                          {item.subject} • {item.exam_type}
                        </span>
                        <h3 className="text-base font-extrabold text-[#1B2A4A] mt-0.5">
                          {item.topic_name}
                        </h3>
                      </div>

                      <div className="p-3 rounded-2xl bg-white border border-[#DFD9CC] space-y-1 text-xs">
                        <p className="text-[11px] font-bold text-[#C0392B] flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Ana Teşhis: {item.primary_error_reason}</span>
                        </p>
                        <p className="text-[11px] text-[#4A5B78] leading-relaxed">
                          <strong>AI Tavsiyesi:</strong> {item.recommended_action}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#DFD9CC] flex items-center justify-between text-xs">
                      <span className="text-[#7E8D9F] font-semibold text-[11px]">
                        {item.wrong_questions_count} Yanlış Soru Kaydı
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/wrong-questions')}
                        className="font-bold text-[#1B2A4A] hover:text-[#D97736] flex items-center gap-1 cursor-pointer"
                      >
                        <span>Soruları İncele</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Weak Topics List Table */}
            {weakTopics.length > 3 && (
              <div className="mt-6 pt-4 border-t border-[#DFD9CC]">
                <h3 className="text-xs font-extrabold text-[#7E8D9F] uppercase tracking-wider mb-3">
                  Diğer İyileştirme Fırsatları ({weakTopics.length - 3} Konu)
                </h3>

                <div className="space-y-2">
                  {weakTopics.slice(3).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 px-4 rounded-2xl bg-white border border-[#DFD9CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                          {item.subject}
                        </span>
                        <span className="font-extrabold text-[#1B2A4A]">{item.topic_name}</span>
                        <span className="text-[#7E8D9F] text-[11px] hidden sm:inline">
                          ({item.primary_error_reason})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-[#2E6B4F] font-bold text-[11px]">
                          +{item.estimated_net_gain} Net
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate('/books')}
                          className="py-1 px-2.5 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] font-bold text-[11px] border border-[#DFD9CC] cursor-pointer"
                        >
                          Kitapta Çalış
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
