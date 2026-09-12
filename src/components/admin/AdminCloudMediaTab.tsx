import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw,
  Eye,
  Filter,
  Search,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Image as ImageIcon,
  FileX,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { storageService, CloudImageItem, StorageUsageStats } from '../../lib/storageService';
import { formatBytes } from '../../lib/imageOptimizer';

interface AdminCloudMediaTabProps {
  storageStats: StorageUsageStats | null;
  onRefreshStats: () => void;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}

export const AdminCloudMediaTab: React.FC<AdminCloudMediaTabProps> = ({
  storageStats,
  onRefreshStats,
  showSuccess,
  showError,
}) => {
  const [images, setImages] = useState<CloudImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [onlyLargeFiles, setOnlyLargeFiles] = useState(false);
  const [previewImage, setPreviewImage] = useState<CloudImageItem | null>(null);

  // Deletion processing states
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [isPurgingAll, setIsPurgingAll] = useState(false);
  const [showPurgeConfirmModal, setShowPurgeConfirmModal] = useState(false);
  const [purgeInputConfirmation, setPurgeInputConfirmation] = useState('');
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);

  const loadImages = async () => {
    setLoading(true);
    try {
      const list = await storageService.getCloudImages();
      setImages(list);
    } catch (e: any) {
      showError('Bulut görselleri yüklenirken hata oluştu: ' + (e.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();

    const handlePurged = () => {
      loadImages();
      onRefreshStats();
    };

    window.addEventListener('karne-images-purged', handlePurged);
    window.addEventListener('karne-cloud-sync', handlePurged);

    return () => {
      window.removeEventListener('karne-images-purged', handlePurged);
      window.removeEventListener('karne-cloud-sync', handlePurged);
    };
  }, []);

  // Filter images
  const filteredImages = images.filter((img) => {
    const matchesSearch =
      (img.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (img.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (img.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (img.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesSubject = subjectFilter === 'all' || img.subject === subjectFilter;
    const matchesLarge = !onlyLargeFiles || img.size > 100 * 1024; // >100 KB

    return matchesSearch && matchesSubject && matchesLarge;
  });

  const subjects = Array.from(new Set(images.map((i) => i.subject).filter(Boolean))) as string[];

  // Selection toggle
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map((i) => i.id)));
    }
  };

  // Delete selected images
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeletingSelected(true);
    setShowDeleteSelectedModal(false);

    try {
      const itemsToDelete = images.filter((i) => selectedIds.has(i.id));
      const res = await storageService.deleteCloudImages(itemsToDelete);
      showSuccess(
        `Başarılı: ${res.deletedCount} adet görsel buluttan silindi ve yaklaşık ${formatBytes(res.freedBytes)} alan boşaltıldı.`
      );
      setSelectedIds(new Set());
      await loadImages();
      onRefreshStats();
    } catch (e: any) {
      showError('Görseller silinirken hata oluştu: ' + (e.message || 'Bilinmeyen hata'));
    } finally {
      setIsDeletingSelected(false);
    }
  };

  // Purge ALL images
  const handlePurgeAll = async () => {
    if (purgeInputConfirmation !== 'TEMİZLE') {
      showError('Onaylamak için lütfen kutucuğa TEMİZLE yazınız.');
      return;
    }

    setIsPurgingAll(true);
    setShowPurgeConfirmModal(false);
    setPurgeInputConfirmation('');

    try {
      const res = await storageService.purgeAllCloudImages();
      showSuccess(
        `Tüm bulut görselleri temizlendi! Toplam ${res.deletedCount} görsel silindi ve yaklaşık ${formatBytes(res.freedBytes)} alan boşaltıldı.`
      );
      setSelectedIds(new Set());
      await loadImages();
      onRefreshStats();
    } catch (e: any) {
      showError('Görseller temizlenirken hata oluştu: ' + (e.message || 'Bilinmeyen hata'));
    } finally {
      setIsPurgingAll(false);
    }
  };

  const totalCalculatedBytes = images.reduce((sum, img) => sum + img.size, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Action & Metrics Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-[#1B2A4A]">
                  Bulut Medya & Görsel Depolama Yöneticisi
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
                  {images.length} Kayıtlı Görsel
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20">
                  Tahmini Boyut: {formatBytes(totalCalculatedBytes || (storageStats?.usedStorageBytes ?? 0))}
                </span>
              </div>
              <p className="text-xs text-[#4A5B78] mt-1">
                Öğrencilerin sorulara eklediği görselleri listeleyin, dilediklerinizi seçerek silin veya tek komutla tüm bulut görsellerini temizleyerek kotanızı sıfırlayın.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-refresh-cloud-images"
              onClick={() => {
                loadImages();
                onRefreshStats();
              }}
              disabled={loading}
              className="py-2.5 px-3.5 bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] text-xs font-bold rounded-xl border border-[#DFD9CC] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>

            {/* Delete Selected Button */}
            <button
              type="button"
              id="btn-delete-selected-images"
              disabled={selectedIds.size === 0 || isDeletingSelected}
              onClick={() => setShowDeleteSelectedModal(true)}
              className="py-2.5 px-4 bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Seçilenleri Sil ({selectedIds.size})</span>
            </button>

            {/* Purge All Button */}
            <button
              type="button"
              id="btn-purge-all-cloud-images"
              disabled={images.length === 0 || isPurgingAll}
              onClick={() => setShowPurgeConfirmModal(true)}
              className="py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#0F172A] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-[#DFD9CC]"
            >
              <FileX className="w-3.5 h-3.5 text-[#D97736]" />
              <span>Tüm Görselleri Temizle</span>
            </button>
          </div>
        </div>

        {/* Capacity Bar */}
        {storageStats && (
          <div className="pt-3 border-t border-[#DFD9CC]/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#1B2A4A]">
                Kullanılan: {formatBytes(storageStats.usedStorageBytes)} / 1 GB (%{storageStats.usedPercentage})
              </span>
              <span className="text-[#2E6B4F] font-bold">
                Kalan Alan: {formatBytes(storageStats.remainingBytes)}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#EFEBE0] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  storageStats.usedPercentage > 85
                    ? 'bg-[#C0392B]'
                    : storageStats.usedPercentage > 60
                    ? 'bg-[#D97736]'
                    : 'bg-[#2E6B4F]'
                }`}
                style={{ width: `${Math.max(2, storageStats.usedPercentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter and Selection Controls */}
      <div className="bg-white p-4 rounded-3xl border border-[#DFD9CC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSelectAll}
            className="py-2 px-3 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-xs font-bold text-[#1B2A4A] border border-[#DFD9CC] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {selectedIds.size === filteredImages.length && filteredImages.length > 0 ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-[#2E6B4F]" />
                <span>Tümünün Seçimini Kaldır</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-[#7E8D9F]" />
                <span>Tümünü Seç ({filteredImages.length})</span>
              </>
            )}
          </button>

          {selectedIds.size > 0 && (
            <span className="text-xs font-bold text-[#D97736] bg-[#D97736]/10 px-2.5 py-1 rounded-lg">
              {selectedIds.size} görsel seçildi
            </span>
          )}

          {/* Large files filter toggle */}
          <button
            type="button"
            onClick={() => setOnlyLargeFiles(!onlyLargeFiles)}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors border cursor-pointer flex items-center gap-1.5 ${
              onlyLargeFiles
                ? 'bg-[#D97736] text-white border-[#D97736]'
                : 'bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border-[#DFD9CC]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Büyük Dosyalar (&gt;100 KB)</span>
          </button>
        </div>

        {/* Search & Subject dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {subjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A] focus:outline-none"
            >
              <option value="all">Tüm Dersler</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          )}

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Görsel / soru / öğrenci ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-medium text-[#1B2A4A] focus:outline-none placeholder-[#7E8D9F]"
            />
          </div>
        </div>
      </div>

      {/* Image Gallery Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#DFD9CC]">
          <RefreshCw className="w-8 h-8 text-[#D97736] animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-[#1B2A4A]">Buluttaki görseller taranıyor...</p>
          <p className="text-xs text-[#7E8D9F] mt-1">Supabase Storage ve soru kayıtları taranıyor</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#DFD9CC] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#2E6B4F] flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-black text-[#1B2A4A]">Bulutta Görsel Bulunmuyor</h4>
          <p className="text-xs text-[#4A5B78] max-w-sm mx-auto">
            {searchTerm || subjectFilter !== 'all' || onlyLargeFiles
              ? 'Filtreleme kriterlerinize uygun görsel bulunamadı.'
              : 'Bulut depolama alanında hiç soru fotoğrafı yok. Alanınız %100 temiz ve boş.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredImages.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`group relative bg-white rounded-2xl border transition-all overflow-hidden flex flex-col cursor-pointer ${
                  isSelected
                    ? 'border-[#2E6B4F] ring-2 ring-[#2E6B4F]/30 shadow-md'
                    : 'border-[#DFD9CC] hover:border-[#1B2A4A]/40 shadow-2xs'
                }`}
              >
                {/* Selection Checkbox Pill */}
                <div className="absolute top-2 left-2 z-10">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-xs transition-colors ${
                      isSelected
                        ? 'bg-[#2E6B4F] text-white'
                        : 'bg-white/90 backdrop-blur-xs text-[#7E8D9F] border border-black/10 group-hover:text-[#1B2A4A]'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </div>
                </div>

                {/* Quick Preview Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage(item);
                  }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Tam Boy Önizle"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                {/* Thumbnail */}
                <div className="aspect-square bg-[#F7F4EE] w-full relative overflow-hidden flex items-center justify-center">
                  <img
                    src={item.url}
                    alt={item.fileName || 'Soru Görseli'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-white">
                    {formatBytes(item.size)}
                  </span>
                </div>

                {/* Metadata details */}
                <div className="p-2.5 flex-1 flex flex-col justify-between text-left space-y-1">
                  <div>
                    <p className="text-[10px] font-bold text-[#1B2A4A] truncate" title={item.fileName}>
                      {item.fileName}
                    </p>
                    {item.subject && (
                      <p className="text-[9px] font-semibold text-[#D97736] truncate">
                        {item.subject} {item.topic ? `• ${item.topic}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#DFD9CC]/40 flex items-center justify-between text-[9px] text-[#7E8D9F]">
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await storageService.deleteCloudImages([item]);
                          showSuccess(`1 adet görsel buluttan silindi (${formatBytes(item.size)}).`);
                          await loadImages();
                          onRefreshStats();
                        } catch (err: any) {
                          showError('Silme hatası: ' + (err.message || 'Bilinmeyen'));
                        }
                      }}
                      className="text-[#C0392B] hover:underline font-bold p-0.5 cursor-pointer"
                      title="Sadece bu görseli sil"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Selected Confirmation Modal */}
      {showDeleteSelectedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#C0392B]/10 text-[#C0392B] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-[#1B2A4A]">Seçilen Görselleri Sil</h3>
              <p className="text-xs text-[#4A5B78] leading-relaxed">
                İşaretlediğiniz <strong>{selectedIds.size} adet görsel</strong> bulut depolamasından kalıcı olarak silinecek. Soruların metin ve konu kayıtları korunacaktır.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DFD9CC]">
              <button
                type="button"
                onClick={() => setShowDeleteSelectedModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#4A5B78] hover:bg-[#F7F4EE] cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="py-2.5 px-5 bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Evet, {selectedIds.size} Görseli Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge ALL Images Modal (Double Confirmation) */}
      {showPurgeConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#C0392B] flex items-center justify-center mx-auto border border-red-200">
              <ShieldAlert className="w-7 h-7 animate-bounce" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-[#1B2A4A]">TÜM Bulut Görsellerini Temizle</h3>
              <p className="text-xs text-[#C0392B] font-bold">
                ⚠️ DİKKAT: Bu işlem geri alınamaz!
              </p>
              <p className="text-xs text-[#4A5B78] leading-relaxed">
                Bulut depolamadaki <strong>tüm {images.length} fotoğraf</strong> kalıcı olarak silinecektir. Soru metinleri, konuları ve analizleri korunacak, sadece resim dosyaları silinerek depolama kotanız %100 boşaltılacaktır.
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-bold text-[#1B2A4A]">
                Onaylamak için büyük harflerle <strong>TEMİZLE</strong> yazınız:
              </label>
              <input
                type="text"
                value={purgeInputConfirmation}
                onChange={(e) => setPurgeInputConfirmation(e.target.value)}
                placeholder="TEMİZLE"
                className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-center text-sm font-black tracking-widest text-[#C0392B] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DFD9CC]">
              <button
                type="button"
                onClick={() => {
                  setShowPurgeConfirmModal(false);
                  setPurgeInputConfirmation('');
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#4A5B78] hover:bg-[#F7F4EE] cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={purgeInputConfirmation !== 'TEMİZLE' || isPurgingAll}
                onClick={handlePurgeAll}
                className="py-2.5 px-5 bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPurgingAll ? 'Temizleniyor...' : 'Tümünü Kalıcı Olarak Temizle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-[#DFD9CC] shadow-2xl max-w-2xl w-full overflow-hidden p-4 space-y-3 cursor-default animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#DFD9CC]">
              <div>
                <h4 className="text-sm font-black text-[#1B2A4A]">{previewImage.fileName}</h4>
                <p className="text-xs text-[#7E8D9F]">
                  {previewImage.subject} {previewImage.topic ? `• ${previewImage.topic}` : ''} ({formatBytes(previewImage.size)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="py-1 px-3 bg-[#F7F4EE] hover:bg-[#EFEBE0] text-xs font-bold rounded-lg text-[#1B2A4A]"
              >
                Kapat
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto flex items-center justify-center bg-[#F7F4EE] rounded-2xl p-2">
              <img
                src={previewImage.url}
                alt={previewImage.fileName}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#255A8A] hover:underline flex items-center gap-1"
              >
                <span>Yeni Sekmede Aç</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={async () => {
                  await storageService.deleteCloudImages([previewImage]);
                  showSuccess(`Görsel silindi (${formatBytes(previewImage.size)}).`);
                  setPreviewImage(null);
                  await loadImages();
                  onRefreshStats();
                }}
                className="py-2 px-3 bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bu Görseli Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
