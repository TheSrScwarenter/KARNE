import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { usersService, UserAccount } from '../lib/usersService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  currentPath: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  navigate: (path: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null; user?: UserProfile }>;
  signUp: (data: {
    email: string;
    password?: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    field?: 'SAY' | 'EA' | 'SÖZ' | 'DİL';
    target_university?: string;
    target_department?: string;
    coaching_specialty?: string;
    autoActivate?: boolean;
  }) => Promise<{ error: string | null; requiresApproval?: boolean; user?: UserProfile }>;
  signOut: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_STORAGE_KEY = 'karne_v2_active_session';
const SIDEBAR_COLLAPSED_KEY = 'karne_sidebar_collapsed';
const DEMO_CLEANED_KEY = 'karne_cleaned_demo_data_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge any old seeded demo data once to allow clean manual input
  useEffect(() => {
    if (!localStorage.getItem(DEMO_CLEANED_KEY)) {
      const keysToClean = [
        'karne_exams_cache',
        'karne_ai_exam_analysis_cache',
        'karne_study_programs_cache_v2',
        'karne_program_constraints_cache_v2',
        'karne_wrong_questions_cache',
        'karne_wrong_questions_analysis_cache',
        'karne_student_books_cache',
        'karne_study_sessions_cache',
        'karne_time_logs_cache',
      ];
      keysToClean.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(DEMO_CLEANED_KEY, 'true');
    }
  }, []);

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === '/' ? (user ? '/dashboard' : '/login') : window.location.pathname;
  });

  // Handle browser popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setIsMobileMenuOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  // Sync user status on mount
  useEffect(() => {
    async function initAuth() {
      const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            const freshUser = await usersService.getUserById(parsed.id);
            if (freshUser && freshUser.status === 'active') {
              const profile: UserProfile = {
                id: freshUser.id,
                role: freshUser.role,
                status: freshUser.status,
                full_name: freshUser.full_name,
                email: freshUser.email,
                phone: freshUser.phone,
                field: freshUser.field,
                target_university: freshUser.target_university,
                target_department: freshUser.target_department,
                target_rank: freshUser.target_rank,
                coaching_specialty: freshUser.coaching_specialty,
                assigned_coach_id: freshUser.assigned_coach_id,
                created_at: freshUser.created_at,
              };
              setUser(profile);
              localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(profile));
            } else {
              // User is no longer active or deleted
              setUser(null);
              localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
            }
          }
        } catch {
          setUser(null);
          localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  // Route protection
  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login', '/signup'];
    const isPublic = publicPaths.includes(currentPath);

    if (!user && !isPublic) {
      navigate('/login');
    } else if (user && isPublic) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, currentPath, loading]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null; user?: UserProfile }> => {
    const foundUser = await usersService.getUserByEmail(email);

    if (!foundUser) {
      return { error: 'Girdiğiniz e-posta adresiyle eşleşen bir hesap bulunamadı.' };
    }

    // Check password
    if (foundUser.password && foundUser.password !== password) {
      return { error: 'Hatalı şifre girdiniz. Lütfen kontrol edip tekrar deneyiniz.' };
    }

    // Check account status
    if (foundUser.status === 'pending') {
      return {
        error:
          'Hesabınız başarıyla oluşturuldu fakat şu an Yönetici (Admin) onayı bekliyor. Yönetici onayından sonra giriş yapabilirsiniz.',
      };
    }

    if (foundUser.status === 'rejected') {
      return {
        error: `Hesap başvurunuz onaylanmadı. Gerekçe: ${foundUser.notes_by_admin || 'Yönetici tarafından reddedildi.'}`,
      };
    }

    if (foundUser.status === 'suspended') {
      return { error: 'Hesabınız yönetici tarafından geçici olarak askıya alınmıştır.' };
    }

    const profile: UserProfile = {
      id: foundUser.id,
      role: foundUser.role,
      status: foundUser.status,
      full_name: foundUser.full_name,
      email: foundUser.email,
      phone: foundUser.phone,
      field: foundUser.field,
      target_university: foundUser.target_university,
      target_department: foundUser.target_department,
      target_rank: foundUser.target_rank,
      coaching_specialty: foundUser.coaching_specialty,
      assigned_coach_id: foundUser.assigned_coach_id,
      created_at: foundUser.created_at,
    };

    setUser(profile);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(profile));

    if (profile.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }

    return { error: null, user: profile };
  };

  const signUp = async (data: {
    email: string;
    password?: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    field?: 'SAY' | 'EA' | 'SÖZ' | 'DİL';
    target_university?: string;
    target_department?: string;
    coaching_specialty?: string;
    autoActivate?: boolean;
  }): Promise<{ error: string | null; requiresApproval?: boolean; user?: UserProfile }> => {
    try {
      const newUser = await usersService.registerUser(data);
      const isAutoActive = data.autoActivate !== false;

      if (isAutoActive) {
        // Log in immediately
        const profile: UserProfile = {
          id: newUser.id,
          role: newUser.role,
          status: newUser.status,
          full_name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone,
          field: newUser.field,
          target_university: newUser.target_university,
          target_department: newUser.target_department,
          target_rank: newUser.target_rank,
          coaching_specialty: newUser.coaching_specialty,
          assigned_coach_id: newUser.assigned_coach_id,
          created_at: newUser.created_at,
        };
        setUser(profile);
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(profile));
        
        if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }

        return { error: null, requiresApproval: false, user: profile };
      }

      return { error: null, requiresApproval: true };
    } catch (err: any) {
      return { error: err.message || 'Kayıt sırasında bir hata oluştu.' };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    navigate('/login');
  };

  const refreshCurrentUser = async () => {
    if (!user) return;
    const fresh = await usersService.getUserById(user.id);
    if (fresh) {
      const profile: UserProfile = {
        id: fresh.id,
        role: fresh.role,
        status: fresh.status,
        full_name: fresh.full_name,
        email: fresh.email,
        phone: fresh.phone,
        field: fresh.field,
        target_university: fresh.target_university,
        target_department: fresh.target_department,
        target_rank: fresh.target_rank,
        coaching_specialty: fresh.coaching_specialty,
        assigned_coach_id: fresh.assigned_coach_id,
        created_at: fresh.created_at,
      };
      setUser(profile);
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(profile));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: true,
        currentPath,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapsed,
        navigate,
        signIn,
        signUp,
        signOut,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
