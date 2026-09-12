import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Zap,
  HelpCircle,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  FileImage,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  BookmarkPlus,
  Save,
} from 'lucide-react';
import { storageService, StorageUsageStats } from '../lib/storageService';
import { formatBytes } from '../lib/imageOptimizer';
import { questionLimitService } from '../lib/questionLimitService';

export const AdminStorageQuota: React.FC = () => {
  const [stats, setStats] = useState<StorageUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [globalLimit, setGlobalLimit] = useState<number>(() => questionLimitService.getGlobalLimit());
  const [editingLimit, setEditingLimit] = useState<string>(() => String(questionLimitService.getGlobalLimit()));
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [limitSavedFeedback, setLimitSavedFeedback] = useState<string | null>(null);

  const handleSaveLimit = async (newVal: number) => {
    if (isNaN(newVal) || newVal < 10) return;
    setIsSavingLimit(true);
    try {
      const saved = await questionLimitService.setGlobalLimit(newVal);
      setGlobalLimit(saved);
      setEditingLimit(String(saved));
      setLimitSavedFeedback(`Öğrenci kotası ${saved} soru olarak güncellendi.`);
      setTimeout(() => setLimitSavedFeedback(null), 4000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSavingLimit(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await storageService.getStorageStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch storage stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-[#1B2A4A] animate-spin" />
        <p className="text-sm font-semibold text-[#4A5B78]">Depolama ve kota verileri taranıyor...</p>
      </div>
    );
  }

  const isWarning = stats.usedPercentage >= 70 && stats.usedPercentage < 85;
  const isCritical = stats.usedPercentage >= 85;
  const statusColor = isCritical ? 'text-[#C0392B]' : isWarning ? 'text-[#D97736]' : 'text-emerald-700';
  const progressBg = isCritical ? 'bg-[#C0392B]' : isWarning ? 'bg-[#D97736]' : 'bg-emerald-600';

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-black/[0.06] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-[#1B2A4A]/5 text-[#1B2A4A] border border-[#1B2A4A]/10">
              <HardDrive className="w-3.5 h-3.5 text-[#255A8A]" />
              Supabase Depolama & Kota Analizi
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {stats.isLiveSupabase ? 'Canlı Bulut Bağlantısı' : 'Yerel + Tahmini Senkron'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1B2A4A] tracking-tight">
            Depolama Durumu & Soru Kapasitesi
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B78] mt-1">
            Mevcut depolama kullanımınızı, kalan boş alanı ve optimize motorumuzla kaç soru daha eklenebileceğini takip edin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] text-xs font-bold border border-[#DFD9CC] transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Hesaplanıyor...' : 'Şimdi Yenile'}
        </button>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Toplam Kapasite */}
        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7E8D9F] uppercase tracking-wider">Toplam Depolama</span>
            <div className="w-8 h-8 rounded-xl bg-[#1B2A4A]/5 flex items-center justify-center text-[#1B2A4A]">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1B2A4A]">
            {formatBytes(stats.totalCapacityBytes)}
          </div>
          <p className="text-[11px] text-[#4A5B78] mt-1 flex items-center gap-1">
            <span>Supabase Free Tier storage</span>
          </p>
        </div>

        {/* 2. Kullanılan Alan */}
        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7E8D9F] uppercase tracking-wider">Kullanılan Alan</span>
            <div className="w-8 h-8 rounded-xl bg-[#255A8A]/10 flex items-center justify-center text-[#255A8A]">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1B2A4A]">
            {formatBytes(stats.usedStorageBytes)}
          </div>
          <p className="text-[11px] text-[#4A5B78] mt-1">
            Toplam kotanın <span className="font-bold text-[#1B2A4A]">%{stats.usedPercentage}</span>'i dolu
          </p>
        </div>

        {/* 3. Kalan Boş Alan */}
        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7E8D9F] uppercase tracking-wider">Kalan Boş Alan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {formatBytes(stats.remainingBytes)}
          </div>
          <p className="text-[11px] text-[#4A5B78] mt-1">
            %{(100 - stats.usedPercentage).toFixed(1)} kullanılabilir boş alan
          </p>
        </div>

        {/* 4. Eklenebilecek Tahmini Kalan Soru */}
        <div className="bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/75 uppercase tracking-wider">Kalan Soru Kapasitesi</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Zap className="w-4 h-4 fill-amber-300" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ~{stats.estimatedRemainingQuestions.toLocaleString('tr-TR')} Soru
          </div>
          <p className="text-[11px] text-white/80 mt-1 flex items-center gap-1">
            <span>⚡ Akıllı WebP sıkıştırma sayesinde</span>
          </p>
        </div>
      </div>

      {/* Storage Progress Bar Card */}
      <div className="bg-white p-6 rounded-3xl border border-black/[0.06] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-[#1B2A4A] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#255A8A]" />
              Canlı Depolama Doluluk Oranı
            </h3>
            <p className="text-xs text-[#7E8D9F] mt-0.5">
              1 GB (1.024 MB) standart Supabase paket sınırına göre hesaplanmaktadır.
            </p>
          </div>
          <div className="text-right">
            <span className={`text-base font-black ${statusColor}`}>
              %{stats.usedPercentage} Dolu
            </span>
            <p className="text-[11px] text-[#7E8D9F]">
              {formatBytes(stats.usedStorageBytes)} / {formatBytes(stats.totalCapacityBytes)}
            </p>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="w-full h-4 bg-[#F7F4EE] rounded-full overflow-hidden p-0.5 border border-[#DFD9CC]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressBg}`}
            style={{ width: `${Math.max(stats.usedPercentage, 0.8)}%` }}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2 text-[#4A5B78]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Kullanılan: <strong>{formatBytes(stats.usedStorageBytes)}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[#4A5B78]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DFD9CC]" />
            <span>Kalan Boş: <strong>{formatBytes(stats.remainingBytes)}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[#4A5B78]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#255A8A]" />
            <span>Ort. Soru Boyutu: <strong>~{formatBytes(stats.averageImageSizeBytes)}</strong></span>
          </div>
        </div>
      </div>

      {/* Question Bank Limit Configuration Card */}
      <div className="bg-white p-6 rounded-3xl border border-black/[0.06] shadow-2xs space-y-4">
        {limitSavedFeedback && (
          <div className="p-3 rounded-xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/20 text-[#2E6B4F] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{limitSavedFeedback}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center flex-shrink-0">
              <BookmarkPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-[#1B2A4A]">
                  Öğrenci Başına Soru Bankası Kapasitesi
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
                  Varsayılan: 400 Soru
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Aktif Sınır: {globalLimit} Soru / Öğrenci
                </span>
              </div>
              <p className="text-xs text-[#4A5B78] mt-1">
                Öğrencilerin soru bankasına ekleyebileceği maksimum soru sayısını belirleyin. Varsayılan olarak her öğrenci 400 soru ekleyebilir.
              </p>
            </div>
          </div>

          {/* Input & Save */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl p-1.5 px-3">
              <span className="text-[11px] font-bold text-[#7E8D9F]">Maks:</span>
              <input
                type="number"
                min={10}
                max={50000}
                value={editingLimit}
                onChange={(e) => setEditingLimit(e.target.value)}
                className="w-20 bg-transparent text-sm font-black text-[#1B2A4A] focus:outline-none text-center"
              />
              <span className="text-[11px] font-semibold text-[#4A5B78]">Soru</span>
            </div>

            <button
              type="button"
              id="btn-save-storage-limit"
              disabled={isSavingLimit || Number(editingLimit) === globalLimit || Number(editingLimit) < 10}
              onClick={() => handleSaveLimit(Number(editingLimit))}
              className="py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSavingLimit ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-[#D97736]" />
                  <span>Limiti Güncelle</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#DFD9CC]/60">
          <span className="text-[11px] font-bold text-[#7E8D9F] mr-1">Hızlı Seçenekler:</span>
          {[250, 400, 500, 750, 1000, 2000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setEditingLimit(String(preset));
                handleSaveLimit(preset);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                globalLimit === preset
                  ? 'bg-[#2E6B4F] text-white border-[#2E6B4F] shadow-2xs'
                  : 'bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border-[#DFD9CC]'
              }`}
            >
              {preset} Soru {preset === 400 && '⭐ (Varsayılan)'}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison: Why Optimization Matters */}
      <div className="bg-gradient-to-r from-[#F7F4EE] to-[#EFEBE0] p-6 rounded-3xl border border-[#DFD9CC] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#1B2A4A]">
              Yeni Görsel Sıkıştırma Motorunun Sağladığı Avantaj
            </h3>
            <p className="text-xs text-[#4A5B78]">
              Telefon kamerasından çekilen 5-10 MB'lık fotoğraflar depolama kotanızı tüketmesin diye geliştirildi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Unoptimized */}
          <div className="bg-white/80 p-4 rounded-2xl border border-[#DFD9CC]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#C0392B] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Optimizasyonsuz (Ham Kamera)
              </span>
              <span className="text-[11px] font-bold text-[#7E8D9F]">Ort. 4.5 MB / Soru</span>
            </div>
            <div className="text-xl font-black text-[#1B2A4A] mb-1">
              ~{stats.estimatedRemainingWithoutOptimization.toLocaleString('tr-TR')} Soru
            </div>
            <p className="text-xs text-[#7E8D9F] leading-relaxed">
              Fotoğraflar sıkıştırılmasaydı 1 GB depolamaya sadece <strong>~220 soru</strong> sığabilirdi ve kota çok hızlı dolardı.
            </p>
          </div>

          {/* Optimized */}
          <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/50 shadow-xs relative">
            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-600 text-white tracking-wider">
              Aktif Sistem
            </span>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                Akıllı WebP / JPEG Sıkıştırma
              </span>
              <span className="text-[11px] font-bold text-emerald-700">Ort. ~85 KB / Soru</span>
            </div>
            <div className="text-xl font-black text-emerald-700 mb-1">
              ~{stats.estimatedRemainingQuestions.toLocaleString('tr-TR')} Soru
            </div>
            <p className="text-xs text-[#4A5B78] leading-relaxed">
              Her görsel %95-98 küçültülerek <strong>{stats.storageSavingsMultiplier} kat daha fazla soru</strong> depolama imkânı sağlanıyor!
            </p>
          </div>
        </div>
      </div>

      {/* Recent Files Table / List */}
      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-[#255A8A]" />
            <h3 className="text-sm font-black text-[#1B2A4A]">
              Buluttaki Soru Görselleri ({stats.totalImageFiles} Dosya)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#7E8D9F]">
            Son Güncelleme: {stats.lastCalculatedAt}
          </span>
        </div>

        {stats.recentFiles.length === 0 ? (
          <div className="p-8 text-center">
            <FileImage className="w-10 h-10 text-[#DFD9CC] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#1B2A4A]">Henüz soru görseli yüklenmemiş</p>
            <p className="text-[11px] text-[#7E8D9F] mt-0.5 max-w-sm mx-auto">
              Öğrenciler Hata Kasası'na soru fotoğrafı ekledikçe burada listelenecek ve anlık boyut bilgisi gösterilecektir.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {stats.recentFiles.map((file, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-[#F7F4EE]/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1B2A4A] truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-[#7E8D9F]">
                      {new Date(file.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1B2A4A]/5 text-[#1B2A4A]">
                    {formatBytes(file.size)}
                  </span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-[#F7F4EE] transition-colors"
                    title="Görseli Aç"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
