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
import { StudiiLogo } from '../components/StudiiLogo';

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
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative apple-mesh-gradient transition-colors duration-300">
      <div className="w-full max-w-md apple-animate-in">
        {/* Studii Typographic Logo & Hero */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-3">
            <StudiiLogo size="xl" showBadge={false} />
          </div>
          <p className="text-sm text-[#7E8D9F] mt-1 font-medium max-w-xs mx-auto">
            Yeni Nesil YKS Hazırlık & Yönetim Masası
          </p>
        </div>

        {/* Login Bento Card */}
        <div className="bento-card p-6 sm:p-8 bg-white dark:bg-[#161617] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px]">
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">Giriş Yap</h2>
              <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] mt-0.5">
                Hesabınızla hemen oturum açın.
              </p>
            </div>
            <button
              type="button"
              id="btn-login-to-signup"
              onClick={() => navigate('/signup')}
              className="text-xs font-semibold text-[#0071E3] hover:underline flex items-center gap-1 cursor-pointer"
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
              <label className="block text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5">
                E-Posta Adresi
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] absolute left-3.5 pointer-events-none shrink-0 z-10" />
                <input
                  type="email"
                  id="login-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@karne.app"
                  className="apple-input apple-input-with-icon w-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Şifre
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] absolute left-3.5 pointer-events-none shrink-0 z-10" />
                <input
                  type="password"
                  id="login-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="apple-input apple-input-with-icon w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading}
              className="apple-btn-primary w-full py-3.5 px-4 text-xs font-semibold rounded-full flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
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
          <div className="mt-6 text-center pt-5 border-t border-black/[0.06] dark:border-white/[0.08]">
            <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
              Hesabınız yok mu?{' '}
              <button
                type="button"
                id="btn-go-to-signup"
                onClick={() => navigate('/signup')}
                className="font-semibold text-[#0071E3] hover:underline transition-colors cursor-pointer"
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
