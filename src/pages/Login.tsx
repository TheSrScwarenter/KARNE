import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, navigate } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl overflow-hidden shadow-lg mb-4 border border-black/[0.08] bg-white">
            <img
              src="/logo.jpg"
              alt="Karne Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">
            Karne
          </h1>
          <p className="text-sm text-[#86868B] mt-1 font-normal">
            YKS 2026 Çalışma Takip ve Koçluk Masası
          </p>
        </div>

        {/* Login Bento Card */}
        <div className="bento-card p-7 sm:p-9 bg-white shadow-sm border border-black/[0.06] rounded-[24px]">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[#1D1D1F]">Giriş Yap</h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Hesabınızla hemen oturum açın.
              </p>
            </div>
            <button
              type="button"
              id="btn-login-to-signup"
              onClick={() => navigate('/signup')}
              className="text-xs font-semibold text-[#0071E3] hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Kayıt Ol</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* E-Posta / Şifre Formu */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                E-Posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="login-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@karne.app"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-[#86868B]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#1D1D1F]">
                  Şifre
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="login-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-[#86868B]"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading}
              className="apple-btn-primary w-full py-3 px-4 text-xs font-medium rounded-full flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? (
                <span>Doğrulanıyor...</span>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Signup Link CTA */}
          <div className="mt-6 text-center pt-5 border-t border-black/[0.06]">
            <p className="text-xs text-[#86868B]">
              Hesabınız yok mu?{' '}
              <button
                type="button"
                id="btn-go-to-signup"
                onClick={() => navigate('/signup')}
                className="font-semibold text-[#0071E3] hover:underline transition-colors"
              >
                Yeni Hesap Oluştur
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
