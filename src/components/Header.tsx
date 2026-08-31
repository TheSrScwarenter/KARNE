import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, Menu, Sparkles, ShieldCheck, PanelLeftClose, PanelLeftOpen, CheckCircle2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, currentPath, toggleMobileMenu, isSidebarCollapsed, toggleSidebarCollapsed } = useAuth();

  const getPageTitle = (path: string) => {
    if (user?.role === 'admin') {
      switch (path) {
        case '/admin':
        case '/dashboard':
          return 'Yönetici & Onay Masası';
        case '/settings':
          return 'Sistem & Profil Ayarları';
        default:
          return 'Yönetici Paneli';
      }
    }

    switch (path) {
      case '/dashboard':
        return user?.role === 'coach' ? 'Koç Kontrol Paneli' : 'Öğrenci Çalışma Paneli';
      case '/wrong-questions':
        return 'Yanlış Soru Bankası';
      case '/study-log':
        return 'Çalışma Günlüğü & Süre Takibi';
      case '/exams':
        return 'Deneme Sınavları & Net Analizi';
      case '/books':
      case '/resources':
        return 'Kitap & Kaynak Takibi';
      case '/program':
        return 'Haftalık Çalışma Programı';
      case '/program/history':
        return 'Program Arşivi & Uyum';
      case '/students':
        return 'Kayıtlı Öğrencilerim';
      case '/program-advisor':
        return 'Haftalık Program Hazırlayıcı';
      case '/coach-notes':
        return 'Koç Notları & Değerlendirmeler';
      case '/coaching':
      case '/messages':
      case '/appointments':
      case '/tasks':
        return 'Koçluk & Öğrenci İletişim Merkezi';
      case '/ai-analytics':
      case '/rank-predictor':
      case '/weak-topics':
        return 'YKS Sıralama Simülatörü & AI Radarı';
      case '/profile':
      case '/badges':
        return 'Öğrenci Profili & Başarı Rozetleri';
      case '/settings':
        return 'Hesap ve Profil Ayarları';
      default:
        return 'Karne YKS';
    }
  };

  return (
    <header
      id="main-header"
      className="bg-white/80 border-b border-black/[0.06] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-2xl transition-all"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Desktop Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className="hidden lg:flex p-1.5 -ml-1 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] active:scale-95 transition-all items-center justify-center"
          title={isSidebarCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
          aria-label={isSidebarCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-[#1D1D1F]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-[#1D1D1F]" />
          )}
        </button>

        {/* Mobile Hamburger Menu button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 -ml-1.5 rounded-xl text-[#1D1D1F] hover:bg-black/[0.04] active:scale-95 transition-all flex items-center justify-center min-w-[38px] min-h-[38px]"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5 text-[#1D1D1F]" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-[#1D1D1F] tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{getPageTitle(currentPath)}</span>
            <span className="hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full bg-black/[0.04] text-[#86868B] flex-shrink-0">
              {user?.role === 'admin'
                ? 'Yönetici'
                : user?.role === 'coach'
                ? 'Koç'
                : 'Öğrenci'}
            </span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* System Active Badge - Apple Style */}
        <div
          id="cloud-storage-status-badge"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          title="Veritabanı ve Senkronizasyon Aktif"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Canlı Bağlantı</span>
          <span className="sm:hidden">Canlı</span>
        </div>

        {/* Target Year Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
          <Sparkles className="w-3 h-3 text-[#0071E3]" />
          <span>YKS 2026</span>
        </div>
      </div>
    </header>
  );
};

