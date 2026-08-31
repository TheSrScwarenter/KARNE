import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../lib/usersService';
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Phone,
  Lock,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Building,
  Target,
  Sparkles,
  Trophy,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, refreshCurrentUser, navigate } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [field, setField] = useState<'SAY' | 'EA' | 'SÖZ' | 'DİL'>((user?.field as any) || 'SAY');
  const [targetUniv, setTargetUniv] = useState(user?.target_university || '');
  const [targetDept, setTargetDept] = useState(user?.target_department || '');
  const [targetRank, setTargetRank] = useState(user?.target_rank || '');
  const [specialty, setSpecialty] = useState(user?.coaching_specialty || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updates: any = {
        full_name: fullName,
        phone,
      };

      if (user.role === 'student') {
        updates.field = field;
        updates.target_university = targetUniv;
        updates.target_department = targetDept;
        updates.target_rank = targetRank;
      } else if (user.role === 'coach') {
        updates.coaching_specialty = specialty;
      }

      if (newPassword) {
        if (newPassword.length < 6) {
          throw new Error('Yeni şifre en az 6 karakter olmalıdır.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Şifreler birbiriyle eşleşmiyor.');
        }
        updates.password = newPassword;
      }

      await usersService.updateUserProfile(user.id, updates);
      await refreshCurrentUser();

      setSuccessMsg('Profil ve hesap bilgileriniz başarıyla güncellendi.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Güncelleme yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="settings-page" className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bento-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold">
            <SettingsIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
              Hesap & Profil Ayarları
            </h1>
            <p className="text-xs text-[#86868B] mt-1">
              Kişisel bilgilerinizi, hedef tercihlerinizi ve şifrenizi güncelleyin.
            </p>
          </div>
        </div>

        {/* Role Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F5F5F7] border border-black/[0.06] text-[#1D1D1F] self-start sm:self-auto">
          {user.role === 'admin' ? (
            <ShieldCheck className="w-4 h-4 text-[#FF9500]" />
          ) : user.role === 'coach' ? (
            <ShieldCheck className="w-4 h-4 text-[#34C759]" />
          ) : (
            <GraduationCap className="w-4 h-4 text-[#0071E3]" />
          )}
          <span>
            {user.role === 'admin'
              ? 'Sistem Yöneticisi'
              : user.role === 'coach'
              ? 'YKS Koçu / Danışman'
              : 'Öğrenci Hesabı'}
          </span>
        </div>
      </div>

      {/* Student Badges & Profile CTA Banner */}
      {user.role === 'student' && (
        <div className="bento-card p-5.5 bg-[#1D1D1F] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FF9500] text-white flex items-center justify-center shadow-xs shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <span>Başarı Rozetleri & Günlük Seri Sayfası</span>
                <Flame className="w-4 h-4 text-[#FF9500]" />
              </h3>
              <p className="text-xs text-white/70 mt-0.5">
                Kazanılan rozetlerinizi, çalışma serilerini ve seviye puanlarınızı inceleyin.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-goto-profile-badges"
            onClick={() => navigate('/profile')}
            className="py-2 px-4 rounded-full bg-white text-[#1D1D1F] hover:bg-white/90 text-xs font-medium transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Rozetleri Görüntüle</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0071E3]" />
          </button>
        </div>
      )}

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 text-[#34C759] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bento-card p-6 sm:p-8 bg-white space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2 border-b border-black/[0.06] pb-3">
            <User className="w-4 h-4 text-[#0071E3]" />
            <span>Kişisel Bilgiler</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Ad Soyad
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                E-Posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#F5F5F7]/50 border border-black/[0.04] rounded-xl text-xs text-[#86868B] cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-[#86868B] mt-1">E-posta adresi değiştirilemez.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {user.role === 'coach' && (
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Koçluk Uzmanlık Alanı
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Örn: YKS Derece & Sayısal Rehberlik"
                  className="w-full py-2.5 px-3.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] focus:bg-white transition-colors"
                />
              </div>
            )}
          </div>

          {/* Student Specific Fields */}
          {user.role === 'student' && (
            <div className="pt-4 border-t border-black/[0.06] space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>YKS Hazırlık & Hedef Tercihleri</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Alan
                  </label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value as any)}
                    className="w-full py-2 px-3 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
                  >
                    <option value="SAY">Sayısal (SAY)</option>
                    <option value="EA">Eşit Ağırlık (EA)</option>
                    <option value="SÖZ">Sözel (SÖZ)</option>
                    <option value="DİL">Yabancı Dil (DİL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Hedef Üniversite
                  </label>
                  <input
                    type="text"
                    value={targetUniv}
                    onChange={(e) => setTargetUniv(e.target.value)}
                    placeholder="Örn: Boğaziçi Üniversitesi"
                    className="w-full py-2 px-3 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Hedef Bölüm
                  </label>
                  <input
                    type="text"
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value)}
                    placeholder="Örn: Bilgisayar Mühendisliği"
                    className="w-full py-2 px-3 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Hedef Sıralama
                  </label>
                  <input
                    type="text"
                    value={targetRank}
                    onChange={(e) => setTargetRank(e.target.value)}
                    placeholder="Örn: İlk 1.000"
                    className="w-full py-2 px-3 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Password Update Card */}
        <div className="bento-card p-6 sm:p-8 bg-white space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2 border-b border-black/[0.06] pb-3">
            <Lock className="w-4 h-4 text-[#0071E3]" />
            <span>Şifre Değiştir</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Yeni Şifre
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Boş bırakırsanız değişmez"
                className="w-full py-2.5 px-3.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Yeni Şifre Tekrar
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifreyi tekrar yazın"
                className="w-full py-2.5 px-3.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
              />
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            id="btn-save-settings"
            disabled={loading}
            className="apple-btn-primary py-3 px-7 text-xs font-semibold rounded-full inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
