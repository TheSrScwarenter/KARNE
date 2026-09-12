import React, { useState, useEffect } from 'react';
import {
  Bell,
  Shield,
  Download,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
  Database,
  RefreshCw,
  HardDrive,
  Users,
  Layers,
  History,
  Trash2,
  Zap,
  Flame,
  Award,
  Sliders,
  RotateCcw,
  Check,
  AlertOctagon,
  Eye,
} from 'lucide-react';
import { adminSystemService, SystemAnnouncement, AdminAuditLog } from '../../lib/adminSystemService';
import { xpSettingsService, XPSettings } from '../../lib/xpSettingsService';
import { isSupabaseConfigured } from '../../../lib/supabase/client';
import { UserAccount } from '../../lib/usersService';
import { StorageUsageStats } from '../../lib/storageService';

interface AdminSystemTabProps {
  users: UserAccount[];
  storageStats: StorageUsageStats | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}

export const AdminSystemTab: React.FC<AdminSystemTabProps> = ({
  users,
  storageStats,
  showSuccess,
  showError,
}) => {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement>(() => adminSystemService.getAnnouncement() || {
    id: 'ann-' + Date.now(),
    title: '',
    message: '',
    type: 'info',
    isActive: false,
    createdAt: new Date().toISOString(),
  });

  const [xpSettings, setXpSettings] = useState<XPSettings>(() => xpSettingsService.getXPSettings());
  const [isSavingXP, setIsSavingXP] = useState(false);
  const [selectedStudentForReset, setSelectedStudentForReset] = useState<string>('ALL');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResettingXP, setIsResettingXP] = useState(false);

  const [requiresApproval, setRequiresApproval] = useState<boolean>(() => adminSystemService.getRequiresApproval());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => adminSystemService.getAuditLogs());
  const [isSavingAnn, setIsSavingAnn] = useState(false);

  useEffect(() => {
    adminSystemService.fetchAnnouncement().then((ann) => {
      if (ann) setAnnouncement(ann);
    });
    xpSettingsService.fetchXPSettings().then((settings) => {
      if (settings) setXpSettings(settings);
    });
  }, []);

  const handleSaveAnnouncement = async () => {
    setIsSavingAnn(true);
    try {
      await adminSystemService.saveAnnouncement(announcement);
      adminSystemService.addAuditLog('Duyuru Güncellendi', undefined, announcement.title || 'Duyuru');
      setAuditLogs(adminSystemService.getAuditLogs());
      showSuccess('Sistem genel duyurusu başarıyla kaydedildi ve tüm kullanıcılara yayımlandı!');
    } catch (e: any) {
      showError('Duyuru kaydedilemedi: ' + (e.message || 'Bilinmeyen'));
    } finally {
      setIsSavingAnn(false);
    }
  };

  const handleClearAnnouncement = async () => {
    try {
      setAnnouncement({ ...announcement, isActive: false, title: '', message: '' });
      await adminSystemService.clearAnnouncement();
      adminSystemService.addAuditLog('Duyuru Yayından Kaldırıldı', undefined, 'Duyuru paneli temizlendi');
      setAuditLogs(adminSystemService.getAuditLogs());
      showSuccess('Duyuru yayından kaldırıldı ve temizlendi.');
    } catch (e: any) {
      showError('Duyuru temizlenemedi: ' + (e.message || 'Bilinmeyen'));
    }
  };

  const handleSaveXPSettings = async () => {
    setIsSavingXP(true);
    try {
      const updated = await xpSettingsService.updateXPSettings(xpSettings);
      setXpSettings(updated);
      adminSystemService.addAuditLog(
        'XP Ayarları Güncellendi',
        undefined,
        `Dakika Başı: ${updated.xpPerStudyMinute} XP, Seri: ${updated.xpPerStreakDay} XP`
      );
      setAuditLogs(adminSystemService.getAuditLogs());
      showSuccess('XP ve oyunlaştırma katsayıları başarıyla kaydedildi!');
    } catch (e: any) {
      showError('XP ayarları kaydedilemedi: ' + (e.message || 'Bilinmeyen'));
    } finally {
      setIsSavingXP(false);
    }
  };

  const handleExecuteResetXP = async () => {
    setIsResettingXP(true);
    try {
      const studentAccounts = users.filter((u) => u.role === 'student');
      if (selectedStudentForReset === 'ALL') {
        const ids = studentAccounts.map((u) => u.id);
        await xpSettingsService.resetAllStudentsXP(ids);
        adminSystemService.addAuditLog('Tüm Öğrenci XP Sıfırlandı', undefined, `${ids.length} öğrencinin XP puanı sıfırlandı`);
        showSuccess(`Tüm öğrencilerin (${ids.length} hesap) XP puanları başarıyla sıfırlandı.`);
      } else {
        const student = users.find((u) => u.id === selectedStudentForReset);
        await xpSettingsService.resetStudentXP(selectedStudentForReset);
        adminSystemService.addAuditLog(
          'Öğrenci XP Sıfırlandı',
          student?.full_name || selectedStudentForReset,
          `${student?.email} XP puanı sıfırlandı`
        );
        showSuccess(`${student?.full_name || selectedStudentForReset} isimli öğrencinin XP puanı sıfırlandı.`);
      }
      setAuditLogs(adminSystemService.getAuditLogs());
      setShowResetConfirmModal(false);
    } catch (e: any) {
      showError('XP sıfırlama işlemi başarısız: ' + (e.message || 'Bilinmeyen'));
    } finally {
      setIsResettingXP(false);
    }
  };

  const handleTogglePolicy = (newVal: boolean) => {
    setRequiresApproval(newVal);
    adminSystemService.setRequiresApproval(newVal);
    adminSystemService.addAuditLog(
      'Kayıt Politikası Değiştirildi',
      undefined,
      newVal ? 'Yönetici Onayı Zorunlu kılındı' : 'Otomatik Onay aktif edildi'
    );
    setAuditLogs(adminSystemService.getAuditLogs());
    showSuccess(
      newVal
        ? 'Yeni kayıtlar için Yönetici Onayı ZORUNLU kılındı.'
        : 'Yeni kayıtlar için Otomatik Onay aktif edildi.'
    );
  };

  const handleExportSystemBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        system: 'studii YKS Platform v0.8 BETA',
        usersCount: users.length,
        users,
        storageStats,
        announcement,
        auditLogs,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studii_system_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      adminSystemService.addAuditLog('Sistem Yedeği İndirildi', undefined, `${users.length} kullanıcı verisi`);
      setAuditLogs(adminSystemService.getAuditLogs());
      showSuccess('Sistem tam yedek dosyası JSON formatında indirildi.');
    } catch (e: any) {
      showError('Yedek indirilirken hata oluştu: ' + (e.message || 'Bilinmeyen'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Global Announcement Console */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#1B2A4A]">Genel Sistem Duyuru Masası</h3>
            <p className="text-xs text-[#4A5B78]">
              Tüm öğrencilerin ve koçların çalışma panellerinin en üstünde yayınlanacak ortak duyuru mesajı belirleyin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Duyuru Başlığı</label>
              <input
                type="text"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                placeholder="Örn: 2026 TYT 3. Genel Deneme Sınavı Tarihleri Açıklandı"
                className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A] placeholder-[#7E8D9F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Duyuru Detayı / Mesajı</label>
              <textarea
                rows={3}
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                placeholder="Öğrencilere iletmek istediğiniz motivasyon, takvim veya sistem bildirisini yazın..."
                className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-medium text-[#1B2A4A] placeholder-[#7E8D9F] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Duyuru Tipi</label>
              <select
                value={announcement.type}
                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A]"
              >
                <option value="info">Bilgilendirme (Mavi)</option>
                <option value="warning">Uyarı / Hatırlatma (Turuncu)</option>
                <option value="success">Başarı & Tebrik (Yeşil)</option>
                <option value="alert">Kritik Duyuru (Kırmızı)</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcement.isActive}
                  onChange={(e) => setAnnouncement({ ...announcement, isActive: e.target.checked })}
                  className="rounded text-[#255A8A] focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-bold text-[#1B2A4A]">Duyuru Yayında Olsun</span>
              </label>
              <p className="text-[10px] text-[#7E8D9F]">
                İşaretlendiğinde tüm kullanıcıların ana sayfasında görünür.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveAnnouncement}
                disabled={isSavingAnn}
                className="flex-1 py-2.5 px-4 bg-[#255A8A] hover:bg-[#1E486E] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSavingAnn ? 'Kaydediliyor...' : 'Yayımla & Kaydet'}</span>
              </button>
              {(announcement.isActive || announcement.title) && (
                <button
                  type="button"
                  onClick={handleClearAnnouncement}
                  className="py-2.5 px-3 bg-[#F7F4EE] hover:bg-red-50 text-[#C0392B] text-xs font-bold rounded-xl border border-[#DFD9CC] transition-colors cursor-pointer"
                  title="Duyuruyu Tamamen Kaldır"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Announcement Preview */}
        {(announcement.title || announcement.message) && (
          <div className="pt-2 border-t border-[#DFD9CC]/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Öğrenci & Koç Ekranı Canlı Önizleme:</span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${announcement.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {announcement.isActive ? '● YAYINDA GÖRÜNECEK' : '○ TASLAK / PASİF'}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                announcement.type === 'warning'
                  ? 'bg-[#D97736]/10 border-[#D97736]/30 text-[#D97736]'
                  : announcement.type === 'success'
                  ? 'bg-[#2E6B4F]/10 border-[#2E6B4F]/30 text-[#2E6B4F]'
                  : announcement.type === 'alert'
                  ? 'bg-[#D9534F]/10 border-[#D9534F]/30 text-[#D9534F]'
                  : 'bg-[#0071E3]/10 border-[#0071E3]/30 text-[#0071E3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-xs">
                  {announcement.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  {announcement.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {announcement.type === 'alert' && <AlertOctagon className="w-4 h-4" />}
                  {announcement.type === 'info' && <Bell className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-gray-800 shadow-xs">
                      {announcement.type.toUpperCase()}
                    </span>
                    <h5 className="text-xs font-black text-[#1B2A4A]">{announcement.title || 'Başlıksız Duyuru'}</h5>
                  </div>
                  <p className="text-xs text-[#4A5B78] mt-0.5 font-medium">{announcement.message || 'Duyuru metni buraya gelecek...'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. XP & Gamification Management Console */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1B2A4A]">XP & Oyunlaştırma Yönetim Masası</h3>
              <p className="text-xs text-[#4A5B78]">
                Çalışma dakikası katsayıları, seri bonusları ve öğrenci bazlı XP sıfırlama işlemlerini yönetin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              className="py-2 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>XP Sıfırlama Aracı</span>
            </button>

            <button
              type="button"
              onClick={handleSaveXPSettings}
              disabled={isSavingXP}
              className="py-2 px-4 rounded-xl bg-[#1B2A4A] hover:bg-[#0F172A] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-[#D97736]" />
              <span>{isSavingXP ? 'Kaydediliyor...' : 'XP Kurallarını Kaydet'}</span>
            </button>
          </div>
        </div>

        {/* XP Multipliers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Minute Rate */}
          <div className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1B2A4A] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#D97736]" />
                Dakika Başı XP
              </span>
              <span className="font-mono font-black text-[#D97736]">{xpSettings.xpPerStudyMinute} XP/dk</span>
            </div>
            <input
              type="number"
              min="1"
              max="20"
              value={xpSettings.xpPerStudyMinute}
              onChange={(e) =>
                setXpSettings({ ...xpSettings, xpPerStudyMinute: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-full p-2 rounded-xl bg-white border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A] focus:outline-none"
            />
            <p className="text-[10px] text-[#7E8D9F]">
              Örn: 60 dk çalışma = {60 * xpSettings.xpPerStudyMinute} XP kazandırır.
            </p>
          </div>

          {/* Streak Day Rate */}
          <div className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1B2A4A] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#D97736]" />
                Seri Gün Bonusu
              </span>
              <span className="font-mono font-black text-[#D97736]">{xpSettings.xpPerStreakDay} XP/gün</span>
            </div>
            <input
              type="number"
              min="0"
              max="200"
              value={xpSettings.xpPerStreakDay}
              onChange={(e) =>
                setXpSettings({ ...xpSettings, xpPerStreakDay: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full p-2 rounded-xl bg-white border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A] focus:outline-none"
            />
            <p className="text-[10px] text-[#7E8D9F]">
              Örn: 7 günlük seride = {7 * xpSettings.xpPerStreakDay} XP eklenir.
            </p>
          </div>

          {/* Session Complete Bonus */}
          <div className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1B2A4A] flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#2E6B4F]" />
                Oturum Tamamlama
              </span>
              <span className="font-mono font-black text-[#2E6B4F]">+{xpSettings.sessionCompletionBonus} XP</span>
            </div>
            <input
              type="number"
              min="0"
              max="500"
              value={xpSettings.sessionCompletionBonus}
              onChange={(e) =>
                setXpSettings({ ...xpSettings, sessionCompletionBonus: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full p-2 rounded-xl bg-white border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A] focus:outline-none"
            />
            <p className="text-[10px] text-[#7E8D9F]">
              Odak sayacını başarıyla tamamlayanlara verilir.
            </p>
          </div>

          {/* Goal Complete Bonus */}
          <div className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1B2A4A] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0071E3]" />
                Hedef Tamamlama
              </span>
              <span className="font-mono font-black text-[#0071E3]">+{xpSettings.goalCompletionBonus} XP</span>
            </div>
            <input
              type="number"
              min="0"
              max="1000"
              value={xpSettings.goalCompletionBonus}
              onChange={(e) =>
                setXpSettings({ ...xpSettings, goalCompletionBonus: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full p-2 rounded-xl bg-white border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A] focus:outline-none"
            />
            <p className="text-[10px] text-[#7E8D9F]">
              Hedefini başarıyla tamamlayan öğrenciye eklenir.
            </p>
          </div>
        </div>

        {/* Rules Description Editor */}
        <div className="pt-1">
          <label className="block text-xs font-bold text-[#1B2A4A] mb-1">
            Öğrencilere Gösterilen XP & Derece Kuralları Açıklaması
          </label>
          <textarea
            rows={2}
            value={xpSettings.rulesDescription}
            onChange={(e) => setXpSettings({ ...xpSettings, rulesDescription: e.target.value })}
            placeholder="XP kazanma mantığını özetleyen metin..."
            className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-medium text-[#1B2A4A] placeholder-[#7E8D9F] focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Registration Policy & Diagnostic Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registration Approval Policy */}
        <div className="bg-white p-5 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#1B2A4A]">Kayıt & Onay Politikası</h4>
              <p className="text-xs text-[#7E8D9F]">Yeni öğrenci ve koç kayıtlarının sisteme giriş kuralı.</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div
              onClick={() => handleTogglePolicy(true)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                requiresApproval
                  ? 'bg-emerald-50/50 border-[#2E6B4F] shadow-xs'
                  : 'bg-[#F7F4EE] border-[#DFD9CC] opacity-70'
              }`}
            >
              <input
                type="radio"
                name="reg-policy"
                checked={requiresApproval}
                onChange={() => handleTogglePolicy(true)}
                className="mt-0.5 text-[#2E6B4F]"
              />
              <div>
                <span className="text-xs font-bold text-[#1B2A4A]">
                  Yönetici Onayı Zorunlu (Varsayılan ve Güvenli)
                </span>
                <p className="text-[11px] text-[#4A5B78] mt-0.5">
                  Öğrenciler ve koçlar kayıt olduktan sonra Admin Onay Masasına düşer. Siz onaylamadan sisteme giriş yapamazlar.
                </p>
              </div>
            </div>

            <div
              onClick={() => handleTogglePolicy(false)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                !requiresApproval
                  ? 'bg-amber-50/50 border-[#D97736] shadow-xs'
                  : 'bg-[#F7F4EE] border-[#DFD9CC] opacity-70'
              }`}
            >
              <input
                type="radio"
                name="reg-policy"
                checked={!requiresApproval}
                onChange={() => handleTogglePolicy(false)}
                className="mt-0.5 text-[#D97736]"
              />
              <div>
                <span className="text-xs font-bold text-[#1B2A4A]">Otomatik Onay (Açık Kayıt)</span>
                <p className="text-[11px] text-[#4A5B78] mt-0.5">
                  Kayıt olan kullanıcılar beklemeksizin doğrudan aktif edilir ve hemen oturum açabilir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Diagnostics Health */}
        <div className="bg-white p-5 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#255A8A]/10 text-[#255A8A] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#1B2A4A]">Sistem & Altyapı Teşhisi</h4>
              <p className="text-xs text-[#7E8D9F]">Bulut servisleri ve yerel önbellek sağlık durumu.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC]">
              <span className="text-[10px] font-bold text-[#7E8D9F] uppercase">Supabase Veritabanı</span>
              <p className="font-bold text-[#2E6B4F] flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSupabaseConfigured() ? 'Bağlantı Aktif' : 'Demo / Mock'}</span>
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC]">
              <span className="text-[10px] font-bold text-[#7E8D9F] uppercase">Önbellek & IDB</span>
              <p className="font-bold text-[#2E6B4F] flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Çevrimdışı Hazır</span>
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC]">
              <span className="text-[10px] font-bold text-[#7E8D9F] uppercase">Toplam Hesap</span>
              <p className="font-bold text-[#1B2A4A] mt-0.5">{users.length} Kayıtlı Kullanıcı</p>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC]">
              <span className="text-[10px] font-bold text-[#7E8D9F] uppercase">Bulut Depolama</span>
              <p className="font-bold text-[#1B2A4A] mt-0.5">
                {storageStats ? `%${storageStats.usedPercentage} Dolu` : '1 GB Boş'}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleExportSystemBackup}
              className="w-full py-2.5 px-3 rounded-xl bg-[#1B2A4A] hover:bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#D97736]" />
              <span>Sistem Verilerini JSON Olarak Dışa Aktar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Admin Audit Log */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A]/10 text-[#1B2A4A] flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#1B2A4A]">Yönetici Hareket & Denetim Günlüğü</h4>
            <p className="text-xs text-[#7E8D9F]">
              Kullanıcı onayları, kota güncellemeleri ve görsel temizleme işlemleri kayıt altındadır.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1 max-h-56 overflow-auto">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC]/70 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-[#1B2A4A]">{log.action}</span>
                {log.details && (
                  <span className="text-[#4A5B78] ml-2 font-normal">• {log.details}</span>
                )}
              </div>
              <div className="text-right font-mono text-[10px] text-[#7E8D9F] shrink-0 ml-2">
                {new Date(log.timestamp).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* XP Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#DFD9CC] shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-[#1B2A4A]">XP Sıfırlama Aracı</h4>
                <p className="text-xs text-[#7E8D9F]">
                  Seçili öğrenci veya tüm öğrencilerin XP puanını sıfırlayın.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1">
                  Sıfırlanacak Hedef:
                </label>
                <select
                  value={selectedStudentForReset}
                  onChange={(e) => setSelectedStudentForReset(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A]"
                >
                  <option value="ALL">⚡ TÜM ÖĞRENCİLER ({users.filter((u) => u.role === 'student').length} Öğrenci)</option>
                  {users
                    .filter((u) => u.role === 'student')
                    .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} ({st.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Dönüşü Olmayan İşlem</span>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  {selectedStudentForReset === 'ALL'
                    ? 'Tüm öğrencilerin odak seans bonusları, kazanılan rozet XP katsayıları ve geçmiş çalışma dakikası XP puanları sıfırlanacaktır.'
                    : 'Seçilen öğrencinin birikmiş XP puanı sıfırlanacak ve sıralama puanı yeniden başlatılacaktır.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F4EE] hover:bg-[#EAE5D9] text-[#1B2A4A] text-xs font-bold transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecuteResetXP}
                disabled={isResettingXP}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResettingXP ? 'Sıfırlanıyor...' : 'Evet, Sıfırla'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
