import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
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
  BookOpen,
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

    const { error, requiresApproval } = await signUp({
      email,
      password,
      full_name: fullName,
      role,
      phone,
      field: role === 'student' ? field : undefined,
      target_university: role === 'student' ? targetUniv : undefined,
      target_department: role === 'student' ? targetDept : undefined,
      coaching_specialty: role === 'coach' ? specialty : undefined,
      autoActivate: true,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else if (requiresApproval) {
      setIsSuccessSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-md mb-3 border-2 border-[#1B2A4A] bg-white">
            <img
              src="/logo.jpg"
              alt="Karne Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-black text-[#1B2A4A] tracking-tight">
            Karne'ye Kayıt Ol
          </h1>
          <p className="text-xs text-[#4A5B78] mt-1 font-medium">
            YKS 2026 Hazırlık & Koçluk Ekosistemine Katılın
          </p>
        </div>

        {/* Signup Card */}
        <div className="bento-card p-6 sm:p-8 bg-white shadow-xs">
          {isSuccessSubmitted ? (
            /* Success State */
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-[#2E6B4F]/15 text-[#2E6B4F] flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E6B4F]/15 text-[#2E6B4F] text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kayıt Başarıyla Tamamlandı</span>
              </div>

              <h2 className="text-xl font-extrabold text-[#1B2A4A]">
                Hoş Geldiniz, {fullName}!
              </h2>

              <p className="text-xs text-[#4A5B78] max-w-md mx-auto leading-relaxed">
                Hesabınız başarıyla oluşturuldu. Şimdi <strong>{email}</strong> adresinizle sisteme giriş yapabilirsiniz.
              </p>

              <div className="p-3.5 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] text-left text-xs space-y-1.5 mt-4">
                <p className="text-[#1B2A4A] font-bold">Kayıt Bilgileriniz:</p>
                <p className="text-[#7E8D9F]">• <strong>Ad Soyad:</strong> {fullName}</p>
                <p className="text-[#7E8D9F]">• <strong>Rol:</strong> {role === 'student' ? 'Öğrenci' : 'YKS Koçu'}</p>
                <p className="text-[#7E8D9F]">• <strong>E-Posta:</strong> {email}</p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Giriş Ekranına Dön</span>
                </button>
              </div>
            </div>
          ) : (
            /* Signup Form */
            <>
              <div className="flex items-center justify-between border-b border-[#DFD9CC] pb-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-[#1B2A4A]">Hesap Oluştur</h2>
                  <p className="text-xs text-[#7E8D9F] mt-0.5">
                    Bilgilerinizi girerek Karne ekosistemine katılın.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold text-[#255A8A] hover:underline"
                >
                  Giriş Yap
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Kayıt Formu */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                    Kayıt Rolünüz
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`cursor-pointer p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        role === 'student'
                          ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                          : 'bg-[#F7F4EE] text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#EFEBE0]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <GraduationCap className={`w-5 h-5 ${role === 'student' ? 'text-[#D97736]' : 'text-[#255A8A]'}`} />
                        <input
                          type="radio"
                          name="reg-role"
                          checked={role === 'student'}
                          onChange={() => setRole('student')}
                          className="sr-only"
                        />
                        {role === 'student' && <CheckCircle2 className="w-4 h-4 text-[#D97736]" />}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-black">Öğrenci</p>
                        <p className={`text-[10px] ${role === 'student' ? 'text-gray-300' : 'text-[#7E8D9F]'}`}>
                          YKS'ye hazırlanıyorum
                        </p>
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        role === 'coach'
                          ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                          : 'bg-[#F7F4EE] text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#EFEBE0]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <ShieldCheck className={`w-5 h-5 ${role === 'coach' ? 'text-[#2E6B4F]' : 'text-[#2E6B4F]'}`} />
                        <input
                          type="radio"
                          name="reg-role"
                          checked={role === 'coach'}
                          onChange={() => setRole('coach')}
                          className="sr-only"
                        />
                        {role === 'coach' && <CheckCircle2 className="w-4 h-4 text-[#2E6B4F]" />}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-black">YKS Koçu</p>
                        <p className={`text-[10px] ${role === 'coach' ? 'text-gray-300' : 'text-[#7E8D9F]'}`}>
                          Öğrenci takip edeceğim
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                      Ad Soyad *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        id="signup-fullname"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ad Soyad"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                      Telefon Numarası
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        id="signup-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05XX XXX XX XX"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                    E-Posta Adresi *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      id="signup-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@karne.app"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                    />
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                      Şifre (En az 6 karakter) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        id="signup-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                      Şifre Tekrarı *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        id="signup-password-confirm"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Fields: Student / Coach */}
                {role === 'student' ? (
                  <div className="p-3.5 bg-[#F7F4EE] rounded-2xl border border-[#DFD9CC] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B2A4A]">
                      <Target className="w-3.5 h-3.5 text-[#D97736]" />
                      <span>YKS Hedef Bilgileri</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#1B2A4A] mb-1">
                        Sınav Alanı
                      </label>
                      <select
                        value={field}
                        onChange={(e) => setField(e.target.value as any)}
                        className="w-full py-2 px-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
                      >
                        <option value="SAY">Sayısal (SAY - MF)</option>
                        <option value="EA">Eşit Ağırlık (EA - TM)</option>
                        <option value="SÖZ">Sözel (SÖZ - TS)</option>
                        <option value="DİL">Yabancı Dil (DİL)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#1B2A4A] mb-1">
                          Hedef Üniversite
                        </label>
                        <input
                          type="text"
                          value={targetUniv}
                          onChange={(e) => setTargetUniv(e.target.value)}
                          placeholder="Örn: Boğaziçi / ODTÜ"
                          className="w-full py-2 px-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#1B2A4A] mb-1">
                          Hedef Bölüm
                        </label>
                        <input
                          type="text"
                          value={targetDept}
                          onChange={(e) => setTargetDept(e.target.value)}
                          placeholder="Örn: Bilgisayar Müh."
                          className="w-full py-2 px-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#F7F4EE] rounded-2xl border border-[#DFD9CC]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B2A4A] mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#2E6B4F]" />
                      <span>Koçluk Alanı</span>
                    </div>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Örn: YKS Sayısal Derece Koçluğu & Zaman Yönetimi"
                      className="w-full py-2 px-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-signup-submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-3"
                >
                  {loading ? (
                    <span>Hesap Oluşturuluyor...</span>
                  ) : (
                    <>
                      <span>Kaydı Tamamla</span>
                      <ArrowRight className="w-4 h-4 text-[#D97736]" />
                    </>
                  )}
                </button>
              </form>

              {/* Login Redirect */}
              <div className="mt-5 text-center pt-4 border-t border-[#DFD9CC]">
                <p className="text-xs text-[#4A5B78]">
                  Zaten hesabınız var mı?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-bold text-[#1B2A4A] hover:text-[#D97736] underline underline-offset-2 transition-colors"
                  >
                    Giriş Yap
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
