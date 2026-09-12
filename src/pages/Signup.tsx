import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { StudiiLogo } from '../components/StudiiLogo';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  Target,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Clock,
} from 'lucide-react';

export const Signup: React.FC = () => {
  const { signUp, navigate } = useAuth();

  // Registration mode
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Student specific
  const [field, setField] = useState<'SAY' | 'EA' | 'SÖZ' | 'DİL'>('SAY');
  const [targetUniv, setTargetUniv] = useState('');
  const [targetDept, setTargetDept] = useState('');
  const [coachCode, setCoachCode] = useState('');

  // Coach specific
  const [specialty, setSpecialty] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMsg('Lütfen ad soyad, e-posta ve şifre alanlarını eksiksiz doldurunuz.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { error } = await signUp({
      email,
      password,
      full_name: fullName,
      role,
      phone,
      field: role === 'student' ? field : undefined,
      target_university: role === 'student' ? targetUniv : undefined,
      target_department: role === 'student' ? targetDept : undefined,
      coaching_specialty: role === 'coach' ? specialty : undefined,
      coach_code: role === 'student' && coachCode.trim() ? coachCode.trim() : undefined,
      autoActivate: false, // Sent directly to Admin Approval Desk as pending application!
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setIsSuccessSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative apple-mesh-gradient">
      <div className="w-full max-w-lg apple-animate-in">
        {/* Studii Typographic Logo & Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="mb-2">
            <StudiiLogo size="lg" showBadge={true} badgeText="Kayıt" />
          </div>
          <p className="text-xs text-[#7E8D9F] mt-1 font-medium max-w-xs mx-auto">
            YKS 2026 Hazırlık & Koçluk Ekosistemi
          </p>
        </div>

        {/* Signup Bento Card */}
        <div className="bento-card p-6 sm:p-8 bg-white border border-black/[0.06] rounded-[24px] shadow-xs">
          {isSuccessSubmitted ? (
            /* Success State - Pending Approval */
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-[#D97736]/10 text-[#D97736] flex items-center justify-center mx-auto mb-2 border border-[#D97736]/20 shadow-xs">
                <Clock className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D97736]/15 text-[#D97736] text-xs font-semibold border border-[#D97736]/25">
                <Clock className="w-3.5 h-3.5" />
                <span>Yönetici Onayı Bekleniyor</span>
              </div>

              <h2 className="text-xl font-bold text-[#1D1D1F]">
                Başvurunuz Alındı, {fullName}!
              </h2>

              <p className="text-xs text-[#86868B] max-w-md mx-auto leading-relaxed">
                Hesap kayıt başvurunuz başarıyla oluşturuldu ve <strong>Yönetici & Kullanıcı Onay Masası</strong>'na iletildi. Yöneticimiz başvurunuzu onayladığı anda <strong>{email}</strong> adresinizle sisteme giriş yapabilirsiniz.
              </p>

              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] text-left text-xs space-y-2 mt-4">
                <p className="text-[#1D1D1F] font-bold">Başvuru Özeti:</p>
                <p className="text-[#86868B]">• <strong className="text-[#1D1D1F]">Ad Soyad:</strong> {fullName}</p>
                <p className="text-[#86868B]">• <strong className="text-[#1D1D1F]">Hesap Türü:</strong> {role === 'student' ? 'Öğrenci' : 'YKS Koçu'}</p>
                <p className="text-[#86868B]">• <strong className="text-[#1D1D1F]">E-Posta:</strong> {email}</p>
                <p className="text-[#86868B]">• <strong className="text-[#1D1D1F]">Durum:</strong> <span className="text-[#D97736] font-bold">Onay Masasında Bekliyor</span></p>
                {coachCode && (
                  <p className="text-[#0071E3]">• <strong>Koç Kodu:</strong> {coachCode} (Onaylandığında otomatik bağlanacak)</p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="apple-btn-primary w-full py-3 px-4 text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Giriş Sayfasına Dön</span>
                </button>
              </div>
            </div>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Toggle Selector - Apple Segmented Control */}
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-2">
                  Hesap Türü Seçiniz
                </label>
                <div className="apple-segmented-control w-full p-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      role === 'student'
                        ? 'apple-segmented-item-active'
                        : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-[#0071E3] shrink-0" />
                    <span className="truncate">Öğrenci Hesabı</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('coach')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      role === 'coach'
                        ? 'apple-segmented-item-active'
                        : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0" />
                    <span className="truncate">YKS Koçu / Danışman</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                    Ad Soyad
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#86868B] absolute left-3.5 pointer-events-none shrink-0 z-10" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Adınız ve Soyadınız"
                      className="apple-input apple-input-with-icon w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                    Telefon (İsteğe Bağlı)
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-[#86868B] absolute left-3.5 pointer-events-none shrink-0 z-10" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="apple-input apple-input-with-icon w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                  E-Posta Adresi
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#86868B] absolute left-3.5 pointer-events-none shrink-0 z-10" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@karne.app"
                    className="apple-input apple-input-with-icon w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                    Şifre (Min 6 Karakter)
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 pointer-events-none shrink-0 z-10" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="apple-input apple-input-with-icon w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                    Şifre Tekrarı
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 pointer-events-none shrink-0 z-10" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="apple-input apple-input-with-icon w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Student Specific Fields */}
              {role === 'student' && (
                <div className="pt-2 border-t border-black/[0.06] space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#86868B]">
                    <Target className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>Hedef & Alan Tercihleri</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                        Alan
                      </label>
                      <select
                        value={field}
                        onChange={(e) => setField(e.target.value as any)}
                        className="apple-input w-full font-semibold cursor-pointer"
                      >
                        <option value="SAY">Sayısal (SAY)</option>
                        <option value="EA">Eşit Ağırlık (EA)</option>
                        <option value="SÖZ">Sözel (SÖZ)</option>
                        <option value="DİL">Yabancı Dil (DİL)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                        Hedef Üniversite
                      </label>
                      <input
                        type="text"
                        value={targetUniv}
                        onChange={(e) => setTargetUniv(e.target.value)}
                        placeholder="Örn: İTÜ"
                        className="apple-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                        Hedef Bölüm
                      </label>
                      <input
                        type="text"
                        value={targetDept}
                        onChange={(e) => setTargetDept(e.target.value)}
                        placeholder="Örn: Tıp / Bilgisayar Müh."
                        className="apple-input w-full"
                      />
                    </div>
                  </div>

                  {/* Coach Invite / Registration Code (Optional) */}
                  <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#0071E3]" />
                        <span>Koç Kayıt / Davet Kodu</span>
                      </label>
                      <span className="text-[11px] font-medium text-[#86868B] px-2 py-0.5 rounded-full bg-white border border-black/[0.04]">
                        İsteğe Bağlı
                      </span>
                    </div>
                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                      Eğer koçunuz size özel bir kayıt kodu (örneğin <span className="font-semibold text-[#1D1D1F]">SELIN-KOC</span> veya <span className="font-semibold text-[#1D1D1F]">AHMET-KOC</span>) verdiyse buraya girebilirsiniz.
                    </p>
                    <div className="relative mt-2">
                      <input
                        type="text"
                        id="input-coach-code"
                        value={coachCode}
                        onChange={(e) => setCoachCode(e.target.value)}
                        placeholder="Örn: SELIN-KOC, AHMET-KOC veya KOC-2026"
                        className="apple-input w-full uppercase font-mono tracking-wider text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Coach Specific Fields */}
              {role === 'coach' && (
                <div className="pt-2 border-t border-black/[0.06] space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                      Uzmanlık / Koçluk Alanı
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Örn: YKS Sayısal Derece & Zaman Yönetimi"
                      className="apple-input w-full"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="btn-signup-submit"
                disabled={loading}
                className="apple-btn-primary w-full py-3.5 px-4 text-xs font-semibold rounded-full flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Hesap Oluşturuluyor...</span>
                ) : (
                  <>
                    <span>Kayıt Ol ve Başla</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 text-center pt-4 border-t border-black/[0.06]">
                <p className="text-xs text-[#86868B]">
                  Zaten bir hesabınız var mı?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-semibold text-[#0071E3] hover:underline transition-colors cursor-pointer"
                  >
                    Giriş Yap
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

