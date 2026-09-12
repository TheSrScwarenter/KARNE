import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from 'lucide-react';
import { YksCountdownWidget } from './YksCountdownWidget';
import { DailyInspirationWidget } from './DailyInspirationWidget';

export const Header: React.FC = () => {
  const { user, currentPath, toggleMobileMenu, isSidebarCollapsed, toggleSidebarCollapsed } = useAuth();
  const [showInspirationModal, setShowInspirationModal] = useState<boolean>(false);

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
        return 'studii YKS';
    }
  };

  return (
    <header
      id="main-header"
      className="bg-white/90 border-b border-black/[0.06] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-2xl transition-colors duration-300 shadow-xs"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Desktop Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className="hidden lg:flex p-1.5 -ml-1 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] active:scale-95 transition-all items-center justify-center cursor-pointer"
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
          className="lg:hidden p-2 -ml-1.5 rounded-xl text-[#1D1D1F] hover:bg-black/[0.04] active:scale-95 transition-all flex items-center justify-center min-w-[38px] min-h-[38px] cursor-pointer"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5 text-[#1D1D1F]" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-[#1D1D1F] tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{getPageTitle(currentPath)}</span>
            <span className="hidden sm:inline text-xs font-medium px-2.5 py-0.5 rounded-full bg-black/[0.04] text-[#86868B] flex-shrink-0">
              {user?.role === 'admin'
                ? 'Yönetici'
                : user?.role === 'coach'
                ? 'Koç'
                : 'Öğrenci'}
            </span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Daily Inspiration / Proverbs Trigger Button */}
        <button
          type="button"
          onClick={() => setShowInspirationModal(true)}
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#FF9500]/10 text-[#FF9500] hover:bg-[#FF9500]/20 border border-[#FF9500]/20 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Günün İlhamı, Atasözleri ve Motivasyon"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline whitespace-nowrap">Günün Sözü</span>
        </button>

        {/* System Active Badge - Apple Style (Hidden on mobile to save space and prevent overlap) */}
        <div
          id="cloud-storage-status-badge"
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 shrink-0"
          title="Veritabanı ve Senkronizasyon Aktif"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
          <span className="hidden md:inline whitespace-nowrap">Canlı Bağlantı</span>
          <span className="md:hidden">Canlı</span>
        </div>

        {/* Target Year Live Dynamic Countdown Widget */}
        <YksCountdownWidget compact />
      </div>

      {/* Daily Inspiration Modal */}
      {showInspirationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs apple-animate-in">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setShowInspirationModal(false)}
              className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white text-[#1D1D1F] border border-black/10 shadow-md flex items-center justify-center hover:bg-[#F5F5F7] transition-all cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
            <DailyInspirationWidget
              className="shadow-2xl"
              onQuoteChange={() => {}}
            />
          </div>
        </div>
      )}
    </header>
  );
};
