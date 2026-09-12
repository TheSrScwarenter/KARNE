import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  HelpCircle,
  Clock,
  BarChart3,
  CalendarDays,
  Menu,
  Users,
  MessageSquare,
  ShieldCheck,
  Settings,
  Flame,
  HardDrive,
} from 'lucide-react';
import { usersService } from '../lib/usersService';

export const BottomNav: React.FC = () => {
  const { user, currentPath, navigate, toggleMobileMenu, isMobileMenuOpen } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const checkPending = async () => {
      try {
        const all = await usersService.getAllUsers();
        setPendingCount(all.filter((u) => u.status === 'pending').length);
      } catch {}
    };

    checkPending();
    const handleUpdate = () => checkPending();
    window.addEventListener('karne-users-updated', handleUpdate);
    window.addEventListener('karne-cloud-sync', handleUpdate);

    return () => {
      window.removeEventListener('karne-users-updated', handleUpdate);
      window.removeEventListener('karne-cloud-sync', handleUpdate);
    };
  }, [user]);

  if (!user) return null;

  const isStudent = user.role === 'student';
  const isCoach = user.role === 'coach';
  const isAdmin = user.role === 'admin';

  const studentItems = [
    { id: 'bnav-student-dashboard', label: 'Özet', path: '/dashboard', icon: LayoutDashboard },
    { id: 'bnav-student-focus', label: 'Odak', path: '/focus', icon: Flame },
    { id: 'bnav-student-questions', label: 'Sorular', path: '/wrong-questions', icon: HelpCircle },
    { id: 'bnav-student-study-log', label: 'Log', path: '/study-log', icon: Clock },
    { id: 'bnav-student-exams', label: 'Deneme', path: '/exams', icon: BarChart3 },
  ];

  const coachItems = [
    { id: 'bnav-coach-dashboard', label: 'Panel', path: '/dashboard', icon: LayoutDashboard },
    { id: 'bnav-coach-students', label: 'Öğrenciler', path: '/students', icon: Users },
    { id: 'bnav-coach-program', label: 'Program', path: '/program-advisor', icon: CalendarDays },
    { id: 'bnav-coach-coaching', label: 'Mesajlar', path: '/coaching', icon: MessageSquare },
  ];

  const adminItems = [
    { id: 'bnav-admin-dashboard', label: 'Onay Masası', path: '/admin', icon: ShieldCheck, badge: pendingCount },
    { id: 'bnav-admin-storage', label: 'Depolama', path: '/admin/storage', icon: HardDrive },
    { id: 'bnav-admin-settings', label: 'Ayarlar', path: '/settings', icon: Settings },
  ];

  const items = isAdmin ? adminItems : isCoach ? coachItems : studentItems;

  return (
    <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] left-2 right-2 z-40 pointer-events-none">
      <nav
        id="mobile-bottom-nav"
        aria-label="Mobil Alt Navigasyon"
        className="pointer-events-auto bg-white/95 border border-black/[0.08] backdrop-blur-2xl px-1 py-1 flex items-center justify-around shadow-lg shadow-black/5 rounded-full max-w-lg mx-auto"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          const badgeVal = (item as any).badge;

          return (
            <button
              key={item.id}
              id={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] py-1 px-1 rounded-2xl transition-all active:scale-95 cursor-pointer touch-manipulation ${
                isActive
                  ? 'text-[#0071E3] font-bold bg-[#0071E3]/10'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-[#0071E3] scale-110 stroke-[2.25]' : 'text-[#86868B]'}`} />
                {badgeVal > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-[#D97736] text-white text-[8px] font-black leading-tight animate-pulse pointer-events-none z-10">
                    {badgeVal}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] mt-0.5 font-medium tracking-tight truncate max-w-full text-center leading-tight select-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu / Drawer Toggle */}
        <button
          type="button"
          id="bnav-mobile-menu-toggle"
          aria-label="Tüm Menüyü Aç"
          onClick={toggleMobileMenu}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] py-1 px-1 rounded-2xl transition-all active:scale-95 cursor-pointer touch-manipulation ${
            isMobileMenuOpen
              ? 'text-[#0071E3] font-bold bg-[#0071E3]/10'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <Menu className={`w-4 h-4 shrink-0 transition-transform ${isMobileMenuOpen ? 'text-[#0071E3] scale-110 stroke-[2.25]' : 'text-[#86868B]'}`} />
          <span className="text-[9.5px] mt-0.5 font-medium tracking-tight select-none whitespace-nowrap">Menü</span>
        </button>
      </nav>
    </div>
  );
};
