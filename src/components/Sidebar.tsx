import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  HelpCircle,
  Clock,
  BarChart3,
  CalendarDays,
  Settings,
  Users,
  FileText,
  LogOut,
  GraduationCap,
  ShieldCheck,
  X,
  BookOpen,
  UserCheck,
  Flame,
  Trophy,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  HardDrive,
} from 'lucide-react';
import { SystemHealthIndicator } from './SystemHealthIndicator';
import { StudiiLogo } from './StudiiLogo';

export const Sidebar: React.FC = () => {
  const {
    user,
    currentPath,
    navigate,
    signOut,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useAuth();

  if (!user) return null;

  const isStudent = user.role === 'student';
  const isCoach = user.role === 'coach';
  const isAdmin = user.role === 'admin';

  const studentNavItems = [
    { id: 'nav-student-dashboard', label: 'Genel Bakış', path: '/dashboard', icon: LayoutDashboard },
    { id: 'nav-student-profile', label: 'Profil & Başarı Rozetleri', path: '/profile', icon: Trophy },
    { id: 'nav-student-ai-analytics', label: 'YKS Sıralama & AI Radarı', path: '/ai-analytics', icon: Sparkles },
    { id: 'nav-student-coaching', label: 'Koçluk & Soru Mesajları', path: '/coaching', icon: MessageSquare },
    { id: 'nav-student-focus', label: 'Odak Kronometresi', path: '/focus', icon: Flame },
    { id: 'nav-student-books', label: 'Kitap & Kaynaklarım', path: '/books', icon: BookOpen },
    { id: 'nav-student-wrong-questions', label: 'Yanlış Soru Bankası', path: '/wrong-questions', icon: HelpCircle },
    { id: 'nav-student-study-log', label: 'Çalışma Günlüğü & Analiz', path: '/study-log', icon: Clock },
    { id: 'nav-student-exams', label: 'Deneme Analizleri', path: '/exams', icon: BarChart3 },
    { id: 'nav-student-program', label: 'Haftalık Program', path: '/program', icon: CalendarDays },
    { id: 'nav-student-settings', label: 'Hesap & Ayarlar', path: '/settings', icon: Settings },
  ];

  const coachNavItems = [
    { id: 'nav-coach-dashboard', label: 'Koç Kontrol Paneli', path: '/dashboard', icon: LayoutDashboard },
    { id: 'nav-coach-coaching', label: 'Öğrenci Soru & Canlı Mesajlaşma', path: '/coaching', icon: MessageSquare },
    { id: 'nav-coach-ai-analytics', label: 'YKS AI Analiz Motoru', path: '/ai-analytics', icon: Sparkles },
    { id: 'nav-coach-students', label: 'Kayıtlı Öğrencilerim', path: '/students', icon: Users },
    { id: 'nav-coach-program', label: 'Haftalık Program Hazırlayıcı', path: '/program-advisor', icon: CalendarDays },
    { id: 'nav-coach-settings', label: 'Hesap & Ayarlar', path: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { id: 'nav-admin-dashboard', label: 'Hesap & Onay Masası', path: '/admin', icon: ShieldCheck },
    { id: 'nav-admin-storage', label: 'Bulut Depolama & Kota', path: '/admin/storage', icon: HardDrive },
    { id: 'nav-admin-settings', label: 'Hesap & Ayarlar', path: '/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : isCoach ? coachNavItems : studentNavItems;

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex flex-col justify-between h-full overflow-y-auto overflow-x-hidden">
      {/* Brand Header */}
      <div>
        <div className={`p-4 border-b border-black/[0.06] transition-all duration-300 ${isCollapsed ? 'px-3 text-center' : 'sm:p-5'}`}>
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-1.5 mb-3.5 px-0.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-xs inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-xs inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-xs inline-block" />
          </div>

          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-1.5' : 'gap-2.5'}`}>
              <StudiiLogo
                size="md"
                collapsed={isCollapsed}
                showBadge={!isCollapsed}
                badgeText="v0.8 BETA"
                onClick={() => isCollapsed && toggleSidebarCollapsed()}
              />
            </div>

            {/* Desktop collapse toggle button */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="hidden lg:flex p-1.5 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
                title="Menüyü Daralt"
                aria-label="Menüyü Daralt"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
              aria-label="Menüyü Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Collapsed expand button on desktop */}
          {isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="hidden lg:flex w-full mt-2 py-1 items-center justify-center rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors cursor-pointer"
              title="Menüyü Genişlet"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          {/* Active User Apple ID Card */}
          <div className={`mt-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] transition-all ${isCollapsed ? 'p-2' : 'p-2.5'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 bg-gradient-to-br from-[#0071E3] to-[#5856D6] shadow-xs"
                title={user.full_name || 'Kullanıcı'}
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1D1D1F] truncate">{user.full_name || 'Kullanıcı'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isAdmin
                          ? 'bg-[#AF52DE]/10 text-[#AF52DE]'
                          : isCoach
                          ? 'bg-[#34C759]/10 text-[#34C759]'
                          : 'bg-[#0071E3]/10 text-[#0071E3]'
                      }`}
                    >
                      {isAdmin ? (
                        <ShieldCheck className="w-2.5 h-2.5" />
                      ) : isCoach ? (
                        <UserCheck className="w-2.5 h-2.5" />
                      ) : (
                        <GraduationCap className="w-2.5 h-2.5" />
                      )}
                      {isAdmin ? 'Yönetici' : isCoach ? 'YKS Koçu' : 'Öğrenci'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={`p-2 space-y-0.5 ${isCollapsed ? 'px-2' : 'p-2.5'}`}>
          {!isCollapsed && (
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
              {isAdmin ? 'Yönetici Masası' : isCoach ? 'Koç Masası' : 'Ana Menü'}
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                id={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-medium transition-all min-h-[38px] cursor-pointer ${
                  isCollapsed ? 'justify-center px-0 py-2' : 'justify-between px-3 py-2 text-left'
                } ${
                  isActive
                    ? 'bg-[#0071E3] text-white shadow-xs font-semibold'
                    : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'text-[#86868B]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </nav>

        {/* System Health Indicator (Supabase & Latency) for Admin */}
        {isAdmin && (
          <SystemHealthIndicator isCollapsed={isCollapsed} />
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`border-t border-black/[0.06] space-y-1.5 ${isCollapsed ? 'p-2' : 'p-2.5'}`}>
        {/* Collapse / Expand quick button at bottom */}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className="hidden lg:flex w-full items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors cursor-pointer"
          title={isCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Kenar Çubuğunu Daralt</span>
            </>
          )}
        </button>

        {/* Sign Out Button */}
        <button
          id="btn-sign-out"
          type="button"
          onClick={() => {
            signOut();
            setIsMobileMenuOpen(false);
          }}
          title={isCollapsed ? 'Oturumu Kapat' : undefined}
          className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl transition-colors min-h-[38px] cursor-pointer ${
            isCollapsed ? 'px-0' : 'px-3'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Oturumu Kapat</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Visible on lg and above) */}
      <aside
        id="desktop-sidebar"
        className={`hidden lg:flex flex-shrink-0 bg-white/90 backdrop-blur-2xl border-r border-black/[0.08] flex-col h-screen sticky top-0 transition-all duration-300 shadow-xs ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>

      {/* Mobile Drawer (Visible when isMobileMenuOpen is true) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sliding Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white backdrop-blur-2xl shadow-2xl border-r border-black/[0.08] z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
};
