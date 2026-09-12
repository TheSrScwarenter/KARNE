import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { examsService } from '../lib/examsService';
import { rankSimulatorService } from '../lib/rankSimulatorService';
import { SimulatedNetValues, SimulatedRankResult } from '../types';
import {
  Calculator,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Info,
  RotateCcw,
  Zap,
  ArrowRight,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

interface RankTargetSimulatorProps {
  studentId?: string;
}

export const RankTargetSimulator: React.FC<RankTargetSimulatorProps> = ({ studentId }) => {
  const { user } = useAuth();
  const activeStudentId = studentId || user?.id || '';
  const studentField = (user?.field as 'SAY' | 'EA' | 'SOZ' | 'DIL') || 'SAY';

  const [selectedField, setSelectedField] = useState<'SAY' | 'EA' | 'SOZ' | 'DIL'>(studentField);
  const [rawObpText, setRawObpText] = useState<string>(() => String(user?.obp || 85));

  const handleObpTextChange = (text: string) => {
    setRawObpText(text);
    const parsed = parseFloat(text.replace(',', '.'));
    if (!isNaN(parsed)) {
      const safeScore = Math.max(50, Math.min(100, parsed));
      setNetValues((prev) => ({
        ...prev,
        obp_score: safeScore,
      }));
    }
  };

  const parsedObp = parseFloat(rawObpText.replace(',', '.'));
  const isObpInvalid =
    rawObpText.trim() !== '' &&
    (isNaN(parsedObp) || parsedObp < 50 || parsedObp > 100);

  const [netValues, setNetValues] = useState<SimulatedNetValues>({
    field: studentField,
    obp_score: user?.obp || 85,
    // TYT
    tyt_turkish: 0,
    tyt_social: 0,
    tyt_math: 0,
    tyt_science: 0,
    // AYT SAY
    ayt_math: 0,
    ayt_physics: 0,
    ayt_chemistry: 0,
    ayt_biology: 0,
    // AYT EA & SOZ
    ayt_literature: 0,
    ayt_history1: 0,
    ayt_geography1: 0,
    ayt_history2: 0,
    ayt_geography2: 0,
    ayt_philosophy: 0,
    ayt_religion: 0,
    ayt_language: 0,
  });

  const [result, setResult] = useState<SimulatedRankResult | null>(null);
  const [loadingExams, setLoadingExams] = useState<boolean>(false);
  const [loadedFromExams, setLoadedFromExams] = useState<boolean>(false);
  const [analyzedExamCount, setAnalyzedExamCount] = useState<number>(0);

  // Sync field changes
  useEffect(() => {
    setNetValues((prev) => ({ ...prev, field: selectedField }));
  }, [selectedField]);

  // Recalculate whenever net values change (OGM Materyal engine)
  useEffect(() => {
    const res = rankSimulatorService.calculateYks(netValues);
    setResult(res);
  }, [netValues]);

  // Load actual exam averages from examsService
  const loadActualExams = async () => {
    if (!activeStudentId) return;
    setLoadingExams(true);
    try {
      const exams = await examsService.getExams(activeStudentId);
      if (exams.length === 0) {
        setLoadedFromExams(false);
        setAnalyzedExamCount(0);
        return;
      }

      const tytList = exams.filter((e) => e.exam_type === 'TYT');
      const aytList = exams.filter((e) => e.exam_type === 'AYT');

      const getSubjectAvg = (list: typeof exams, subjKeywords: string[]) => {
        let total = 0;
        let count = 0;
        list.forEach((ex) => {
          ex.subject_results?.forEach((sr) => {
            if (subjKeywords.some((k) => sr.subject.toLowerCase().includes(k.toLowerCase()))) {
              total += sr.net;
              count++;
            }
          });
        });
        return count > 0 ? Number((total / count).toFixed(2)) : 0;
      };

      const avgTytTurk = getSubjectAvg(tytList, ['türkçe', 'turkce']);
      const avgTytMat = getSubjectAvg(tytList, ['matematik', 'temel mat']);
      const avgTytSos = getSubjectAvg(tytList, ['sosyal', 'tarih']);
      const avgTytFen = getSubjectAvg(tytList, ['fen', 'fizik']);

      const avgAytMat = getSubjectAvg(aytList, ['matematik', 'ayt mat', 'ileri mat']);
      const avgAytFiz = getSubjectAvg(aytList, ['fizik']);
      const avgAytKim = getSubjectAvg(aytList, ['kimya']);
      const avgAytBiy = getSubjectAvg(aytList, ['biyoloji']);
      const avgAytEdeb = getSubjectAvg(aytList, ['edebiyat', 'türk dili']);
      const avgAytTarih = getSubjectAvg(aytList, ['tarih']);
      const avgAytCogr = getSubjectAvg(aytList, ['coğrafya', 'cografya']);

      setNetValues((prev) => ({
        ...prev,
        tyt_turkish: avgTytTurk,
        tyt_math: avgTytMat,
        tyt_social: avgTytSos,
        tyt_science: avgTytFen,
        ayt_math: avgAytMat,
        ayt_physics: avgAytFiz,
        ayt_chemistry: avgAytKim,
        ayt_biology: avgAytBiy,
        ayt_literature: avgAytEdeb,
        ayt_history1: avgAytTarih,
        ayt_geography1: avgAytCogr,
      }));

      setLoadedFromExams(true);
      setAnalyzedExamCount(exams.length);
    } catch (err) {
      console.error('Failed to load exams for simulator:', err);
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    loadActualExams();
  }, [activeStudentId]);

  const resetAllNets = () => {
    setNetValues((prev) => ({
      ...prev,
      tyt_turkish: 0,
      tyt_social: 0,
      tyt_math: 0,
      tyt_science: 0,
      ayt_math: 0,
      ayt_physics: 0,
      ayt_chemistry: 0,
      ayt_biology: 0,
      ayt_literature: 0,
      ayt_history1: 0,
      ayt_geography1: 0,
      ayt_history2: 0,
      ayt_geography2: 0,
      ayt_philosophy: 0,
      ayt_religion: 0,
      ayt_language: 0,
    }));
    setLoadedFromExams(false);
  };

  const updateNet = (key: keyof SimulatedNetValues, val: number, maxVal: number) => {
    const clamped = Math.max(0, Math.min(maxVal, Number(isNaN(val) ? 0 : val)));
    setNetValues((prev) => ({ ...prev, [key]: clamped }));
  };

  const totalTytNet = Number(
    (
      netValues.tyt_turkish +
      netValues.tyt_social +
      netValues.tyt_math +
      netValues.tyt_science
    ).toFixed(2)
  );

  const totalAytNet =
    selectedField === 'SAY'
      ? Number(
          (
            netValues.ayt_math +
            netValues.ayt_physics +
            netValues.ayt_chemistry +
            netValues.ayt_biology
          ).toFixed(2)
        )
      : selectedField === 'EA'
      ? Number(
          (
            netValues.ayt_math +
            netValues.ayt_literature +
            netValues.ayt_history1 +
            netValues.ayt_geography1
          ).toFixed(2)
        )
      : selectedField === 'SOZ'
      ? Number(
          (
            netValues.ayt_literature +
            netValues.ayt_history1 +
            netValues.ayt_geography1 +
            (netValues.ayt_history2 || 0) +
            (netValues.ayt_geography2 || 0) +
            (netValues.ayt_philosophy || 0) +
            (netValues.ayt_religion || 0)
          ).toFixed(2)
        )
      : Number((netValues.ayt_language || 0).toFixed(2));

  // Field display title
  const fieldNameMap = {
    SAY: 'Sayısal (SAY)',
    EA: 'Eşit Ağırlık (EA)',
    SOZ: 'Sözel (SÖZ)',
    DIL: 'Yabancı Dil (DİL)',
  };

  return (
    <div id="rank-target-simulator" className="space-y-6 animate-in fade-in">
      {/* 1. Header & Controls */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFD9CC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Calculator className="w-6 h-6 text-[#D97736]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-[#1B2A4A] tracking-tight">
                YKS Sıralama & Puan Hesaplama Motoru
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20">
                MEB OGM Materyal & ÖSYM Uyumlu
              </span>
            </div>
            <p className="text-xs text-[#7E8D9F] mt-0.5">
              Netlerinizi doğrudan manuel girerek OGM Materyal formülü ve güncel ÖSYM yığılma eğrileriyle anlık tahmini Türkiye sıralamanızı hesaplayın.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Field Switcher */}
          <select
            id="field-selector"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value as any)}
            className="bg-[#F7F4EE] border border-[#DFD9CC] text-[#1B2A4A] font-extrabold text-xs rounded-xl px-3 py-2 focus:outline-hidden cursor-pointer shadow-2xs"
          >
            <option value="SAY">Sayısal (SAY)</option>
            <option value="EA">Eşit Ağırlık (EA)</option>
            <option value="SOZ">Sözel (SÖZ)</option>
            <option value="DIL">Yabancı Dil (DİL)</option>
          </select>

          {/* Quick Load From Real Exams */}
          <button
            type="button"
            id="btn-load-exams"
            onClick={loadActualExams}
            disabled={loadingExams}
            className="py-2 px-3.5 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] text-xs font-bold border border-[#DFD9CC] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Kayıtlı denemelerdeki net ortalamalarınızı doğrudan aktarın"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingExams ? 'animate-spin text-[#D97736]' : 'text-[#255A8A]'}`} />
            <span>{loadedFromExams ? `Sınavlarımdan (${analyzedExamCount})` : 'Denemelerimden Yükle'}</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            id="btn-reset-nets"
            onClick={resetAllNets}
            className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-[#C0392B] text-xs font-bold border border-[#DFD9CC] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Tüm netleri sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Real Data Status Notice Banner */}
      {loadedFromExams ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Kayıtlı Deneme Ortalamalarınız Yüklendi:</strong> Sisteme kayıtlı {analyzedExamCount} adet denemenizin ders bazlı netleri otomatik dolduruldu. Farklı senaryoları simüle etmek için kutucuklara yeni değerler yazabilirsiniz.
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] text-[#4A5B78] text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-[#255A8A] shrink-0" />
          <span>
            <strong>Manuel Net Girişi:</strong> Aşağıdaki ders kutularına doğrudan netlerinizi yazabilirsiniz. Puan ve sıralamanız OGM Materyal motoruyla anlık hesaplanır.
          </span>
        </div>
      )}

      {/* 2. RESULTS HERO DISPLAY (OGM Materyal & ÖSYM 2024-2025 Standard) */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Estimated Rank Card */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#D97736] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Tahmini {fieldNameMap[selectedField]} Sıralaması</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/15 text-white backdrop-blur-xs">
                  ÖSYM Yığılma Modeli
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {totalTytNet === 0 && totalAytNet === 0 ? '—' : `~${result.likely_rank.toLocaleString('tr-TR')}.`}
                </span>
                <span className="text-xs font-bold text-white/80">
                  {totalTytNet === 0 && totalAytNet === 0 ? '(Net giriniz)' : 'Sırada'}
                </span>
              </div>

              <p className="text-xs text-white/85 mt-2">
                Yerleştirme Puanı (Y-{selectedField}):{' '}
                <strong className="text-white font-black text-sm">{result.placement_score} Puan</strong>
              </p>
            </div>

            {/* Range Band Breakdown */}
            <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-white/70 uppercase font-bold block">İyimser Senaryo</span>
                <span className="font-extrabold text-emerald-300">
                  {totalTytNet === 0 && totalAytNet === 0 ? '—' : `~${result.best_rank.toLocaleString('tr-TR')}`}
                </span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-white/70 uppercase font-bold block">Muhtemel Sıralama</span>
                <span className="font-black text-white">
                  {totalTytNet === 0 && totalAytNet === 0 ? '—' : `~${result.likely_rank.toLocaleString('tr-TR')}`}
                </span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <span className="text-[10px] text-white/70 uppercase font-bold block">Kötü Senaryo Bandı</span>
                <span className="font-extrabold text-white/75">
                  {totalTytNet === 0 && totalAytNet === 0 ? '—' : `~${result.worst_rank.toLocaleString('tr-TR')}`}
                </span>
              </div>
            </div>
          </div>

          {/* Ham Puan & OBP Katkısı */}
          <div className="p-6 rounded-3xl bg-white border border-[#DFD9CC] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7E8D9F] block">
                Ham Puan & OBP
              </span>
              <div className="mt-3">
                <span className="text-3xl font-black text-[#1B2A4A]">{result.raw_score}</span>
                <span className="text-xs font-bold text-[#7E8D9F] ml-1">Ham Puan</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-[#4A5B78]">
                <div className="flex justify-between">
                  <span>Ham Taban Puan:</span>
                  <strong className="text-[#1B2A4A]">100 P</strong>
                </div>
                <div className="flex justify-between">
                  <span>OBP Katkısı (+{netValues.obp_score} × 0.6):</span>
                  <strong className="text-[#2E6B4F]">+{ (netValues.obp_score * 0.6).toFixed(1) } P</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DFD9CC] text-[11px] text-[#7E8D9F]">
              OGM Materyal formülüne göre ham puan tavanı 500, yerleştirme tavanı 560 puandır.
            </div>
          </div>

          {/* Toplam Netler */}
          <div className="p-6 rounded-3xl bg-white border border-[#DFD9CC] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7E8D9F] block">
                Toplam Netler
              </span>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-black text-[#1B2A4A]">{totalTytNet} Net</p>
                  <p className="text-[11px] text-[#7E8D9F]">TYT (120 Soru)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#2E6B4F]">{totalAytNet} Net</p>
                  <p className="text-[11px] text-[#7E8D9F]">AYT (80 Soru)</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DFD9CC]">
              <div className="flex items-center justify-between text-xs font-bold text-[#1B2A4A]">
                <span>Genel Toplam:</span>
                <span className="text-sm font-black text-[#D97736]">
                  {(totalTytNet + totalAytNet).toFixed(2)} Net
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MANUEL NET GİRİŞİ (Doğrudan Sayısal Giriş Kutuları) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOL KOLON: TYT NETLERİ */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#DFD9CC] pb-3">
            <h3 className="text-base font-black text-[#1B2A4A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#1B2A4A] text-white flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>TYT Netleri (120 Soru)</span>
            </h3>
            <span className="text-xs font-black text-[#1B2A4A] bg-[#F7F4EE] px-3 py-1 rounded-xl border border-[#DFD9CC]">
              Toplam: {totalTytNet} Net
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Türkçe */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                <span>Türkçe (40 Soru)</span>
                <span className="text-[11px] text-[#7E8D9F]">Katsayı: ~3.3</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.25"
                  value={netValues.tyt_turkish === 0 ? '' : netValues.tyt_turkish}
                  onChange={(e) => updateNet('tyt_turkish', parseFloat(e.target.value), 40)}
                  placeholder="0.00"
                  className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                />
                <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
              </div>
            </div>

            {/* Temel Matematik */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                <span>Temel Matematik (40 Soru)</span>
                <span className="text-[11px] text-[#7E8D9F]">Katsayı: ~3.3</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.25"
                  value={netValues.tyt_math === 0 ? '' : netValues.tyt_math}
                  onChange={(e) => updateNet('tyt_math', parseFloat(e.target.value), 40)}
                  placeholder="0.00"
                  className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                />
                <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
              </div>
            </div>

            {/* Fen Bilimleri */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                <span>Fen Bilimleri (20 Soru)</span>
                <span className="text-[11px] text-[#7E8D9F]">Katsayı: ~3.4</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={netValues.tyt_science === 0 ? '' : netValues.tyt_science}
                  onChange={(e) => updateNet('tyt_science', parseFloat(e.target.value), 20)}
                  placeholder="0.00"
                  className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                />
                <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
              </div>
            </div>

            {/* Sosyal Bilimler */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                <span>Sosyal Bilimler (20 Soru)</span>
                <span className="text-[11px] text-[#7E8D9F]">Katsayı: ~3.4</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={netValues.tyt_social === 0 ? '' : netValues.tyt_social}
                  onChange={(e) => updateNet('tyt_social', parseFloat(e.target.value), 20)}
                  placeholder="0.00"
                  className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                />
                <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
              </div>
            </div>
          </div>

          {/* OBP / Diploma Notu */}
          <div className="pt-2 border-t border-[#DFD9CC]">
            <div className={`p-4 rounded-2xl border transition-all ${
              isObpInvalid ? 'bg-amber-500/10 border-amber-400' : 'bg-[#F7F4EE] border-[#DFD9CC]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label htmlFor="obp-input" className="text-xs font-extrabold text-[#1B2A4A] block">
                    Ortaöğretim Başarı Puanı (Diploma Notu: 50 - 100)
                  </label>
                  <p className="text-[11px] text-[#7E8D9F] mt-0.5">
                    Yerleştirmeye OBP × 0.6 katkı sağlar (+{(netValues.obp_score * 0.6).toFixed(1)} Puan)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="obp-input"
                    type="text"
                    inputMode="decimal"
                    value={rawObpText}
                    onChange={(e) => handleObpTextChange(e.target.value)}
                    placeholder="50 - 100"
                    className={`w-28 py-2 px-3 bg-white border rounded-xl text-base font-black text-center focus:outline-hidden transition-colors ${
                      isObpInvalid
                        ? 'border-red-500 text-red-700 bg-red-50/50 focus:border-red-600'
                        : 'border-[#DFD9CC] text-[#1B2A4A] focus:border-[#1B2A4A]'
                    }`}
                  />
                  <span className="text-xs font-bold text-[#7E8D9F]">Puan</span>
                </div>
              </div>

              {/* Warning Alert if user inputs an invalid value like 200 or 3 */}
              {isObpInvalid && (
                <div className="mt-3 p-2.5 rounded-xl bg-red-100/90 border border-red-300 text-red-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="leading-tight">
                    <span className="font-extrabold">Geçersiz OBP Değeri:</span> Ortaöğretim Başarı Puanı (lise diploma notu) <strong>50 ile 100</strong> arasında olmalıdır! (Girilen değer: <strong>{rawObpText}</strong>)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: AYT NETLERİ (Alana Göre Değişen) */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#DFD9CC] pb-3">
            <h3 className="text-base font-black text-[#1B2A4A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#2E6B4F] text-white flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>AYT Netleri ({fieldNameMap[selectedField]})</span>
            </h3>
            <span className="text-xs font-black text-[#2E6B4F] bg-[#2E6B4F]/10 px-3 py-1 rounded-xl border border-[#2E6B4F]/20">
              Toplam: {totalAytNet} Net
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SAYISAL ALANI */}
            {selectedField === 'SAY' && (
              <>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Matematik (40 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 3.00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="40"
                      step="0.25"
                      value={netValues.ayt_math === 0 ? '' : netValues.ayt_math}
                      onChange={(e) => updateNet('ayt_math', parseFloat(e.target.value), 40)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                    />
                    <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Fizik (14 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 2.85</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="14"
                      step="0.25"
                      value={netValues.ayt_physics === 0 ? '' : netValues.ayt_physics}
                      onChange={(e) => updateNet('ayt_physics', parseFloat(e.target.value), 14)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                    />
                    <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Kimya (13 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 3.07</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="13"
                      step="0.25"
                      value={netValues.ayt_chemistry === 0 ? '' : netValues.ayt_chemistry}
                      onChange={(e) => updateNet('ayt_chemistry', parseFloat(e.target.value), 13)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                    />
                    <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Biyoloji (13 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 3.07</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="13"
                      step="0.25"
                      value={netValues.ayt_biology === 0 ? '' : netValues.ayt_biology}
                      onChange={(e) => updateNet('ayt_biology', parseFloat(e.target.value), 13)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                    />
                    <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                  </div>
                </div>
              </>
            )}

            {/* EŞİT AĞIRLIK ALANI */}
            {selectedField === 'EA' && (
              <>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Matematik (40 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 3.00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="40"
                      step="0.25"
                      value={netValues.ayt_math === 0 ? '' : netValues.ayt_math}
                      onChange={(e) => updateNet('ayt_math', parseFloat(e.target.value), 40)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                    />
                    <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Edebiyat (24 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 3.00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.25"
                      value={netValues.ayt_literature === 0 ? '' : netValues.ayt_literature}
                      onChange={(e) => updateNet('ayt_literature', parseFloat(e.target.value), 24)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                    />
                    <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Tarih-1 (10 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 2.80</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.25"
                      value={netValues.ayt_history1 === 0 ? '' : netValues.ayt_history1}
                      onChange={(e) => updateNet('ayt_history1', parseFloat(e.target.value), 10)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                    />
                    <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Coğrafya-1 (6 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 3.33</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="6"
                      step="0.25"
                      value={netValues.ayt_geography1 === 0 ? '' : netValues.ayt_geography1}
                      onChange={(e) => updateNet('ayt_geography1', parseFloat(e.target.value), 6)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A] focus:outline-hidden focus:border-[#1B2A4A]"
                    />
                    <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                  </div>
                </div>
              </>
            )}

            {/* SÖZEL ALANI */}
            {selectedField === 'SOZ' && (
              <>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Edebiyat (24 Soru)</span>
                    <span className="text-[11px] text-[#7E8D9F]">Katsayı: 3.00</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    value={netValues.ayt_literature === 0 ? '' : netValues.ayt_literature}
                    onChange={(e) => updateNet('ayt_literature', parseFloat(e.target.value), 24)}
                    placeholder="0.00"
                    className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A]"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Tarih-1 & 2 (21 Soru)</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="21"
                    step="0.25"
                    value={(netValues.ayt_history1 || 0) + (netValues.ayt_history2 || 0) || ''}
                    onChange={(e) => updateNet('ayt_history1', parseFloat(e.target.value), 21)}
                    placeholder="0.00"
                    className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A]"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>AYT Coğrafya-1 & 2 (17 Soru)</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="17"
                    step="0.25"
                    value={(netValues.ayt_geography1 || 0) + (netValues.ayt_geography2 || 0) || ''}
                    onChange={(e) => updateNet('ayt_geography1', parseFloat(e.target.value), 17)}
                    placeholder="0.00"
                    className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A]"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                    <span>Felsefe Grubu & Din (18 Soru)</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    step="0.25"
                    value={(netValues.ayt_philosophy || 0) + (netValues.ayt_religion || 0) || ''}
                    onChange={(e) => updateNet('ayt_philosophy', parseFloat(e.target.value), 18)}
                    placeholder="0.00"
                    className="w-full py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-base font-black text-[#1B2A4A]"
                  />
                </div>
              </>
            )}

            {/* DİL ALANI */}
            {selectedField === 'DIL' && (
              <div className="sm:col-span-2 p-4 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#1B2A4A]">
                  <span>Yabancı Dil Testi (YDT: 80 Soru)</span>
                  <span className="text-[11px] text-[#7E8D9F]">Katsayı: 3.00</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="80"
                    step="0.25"
                    value={netValues.ydt_language === 0 ? '' : netValues.ydt_language}
                    onChange={(e) => updateNet('ydt_language', parseFloat(e.target.value), 80)}
                    placeholder="0.00"
                    className="w-full py-2.5 px-3 bg-white border border-[#DFD9CC] rounded-xl text-lg font-black text-[#1B2A4A]"
                  />
                  <span className="text-xs font-bold text-[#7E8D9F]">Net</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. NET GELİŞTİRME VE STRATEJİK TAVSİYELER */}
      {result && result.net_prescriptions.length > 0 && totalTytNet + totalAytNet > 0 && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DFD9CC] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1B2A4A]">
                  Stratejik Net Artış & Sıralama İyileştirme Fırsatları
                </h3>
                <p className="text-xs text-[#7E8D9F] mt-0.5">
                  Mevcut netlerinize göre en yüksek katsayı getiren ve sıralamanızı doğrudan öne çekecek dersler:
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#2E6B4F]/10 text-[#2E6B4F]">
              +{result.net_prescriptions.reduce((acc, p) => acc + p.estimated_points_gain, 0).toFixed(1)} Puan Potansiyeli
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
            {result.net_prescriptions.map((pres, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DFD9CC] space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-[#1B2A4A] text-white">
                      {pres.priority === 'high' ? 'Yüksek Katsayı' : 'Gelişim Fırsatı'}
                    </span>
                    <span className="text-xs font-black text-[#2E6B4F]">
                      +{pres.estimated_points_gain} Puan
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-[#1B2A4A] mt-2">{pres.subject}</h4>
                  <p className="text-xs text-[#7E8D9F] mt-1">
                    Şu An: <strong>{pres.current_net}</strong> → Hedeflenen: <strong>{pres.target_net} Net</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-[#DFD9CC]/60 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#D97736]">+{pres.net_gap} Net ile Sıçrama</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#7E8D9F]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
