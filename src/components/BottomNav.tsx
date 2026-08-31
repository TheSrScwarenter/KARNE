import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  HelpCircle,
  Clock,
  BarChart3,
  CalendarDays,
  Menu,
  Users,
  FileText,
  ShieldCheck,
  Settings,
  Flame,
  Sparkles,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user, currentPath, navigate, toggleMobileMenu, isMobileMenuOpen } = useAuth();

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
    { id: 'bnav-coach-notes', label: 'Notlar', path: '/coach-notes', icon: FileText },
  ];

  const adminItems = [
    { id: 'bnav-admin-dashboard', label: 'Onay Masası', path: '/admin', icon: ShieldCheck },
    { id: 'bnav-admin-settings', label: 'Ayarlar', path: '/settings', icon: Settings },
  ];

  const items = isAdmin ? adminItems : isCoach ? coachItems : studentItems;

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 pb-safe pointer-events-none">
      <nav
        id="mobile-bottom-nav"
        className="pointer-events-auto bg-white/85 border border-black/[0.08] backdrop-blur-2xl px-2 py-1.5 flex items-center justify-around shadow-lg rounded-full max-w-md mx-auto"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-2 rounded-full transition-all active:scale-95 ${
                isActive
                  ? 'text-[#0071E3] font-semibold bg-[#0071E3]/10'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#0071E3]' : 'text-[#86868B]'}`} />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Menu / Drawer Toggle */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[42px] py-1 px-2 rounded-full transition-all active:scale-95 ${
            isMobileMenuOpen
              ? 'text-[#0071E3] font-semibold bg-[#0071E3]/10'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Menü</span>
        </button>
      </nav>
    </div>
  );
};

