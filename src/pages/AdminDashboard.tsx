import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Building,
  Target,
  RefreshCw,
  Eye,
  KeyRound,
  UserCog,
  AlertTriangle,
  HardDrive,
  Zap,
  ChevronRight,
  BookmarkPlus,
  Save,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import { usersService, UserAccount } from '../lib/usersService';
import { storageService, StorageUsageStats } from '../lib/storageService';
import { questionLimitService, DEFAULT_MAX_QUESTIONS_PER_STUDENT } from '../lib/questionLimitService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { formatBytes } from '../lib/imageOptimizer';
import { UserRole, AccountStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { Trophy } from 'lucide-react';
import { AdminCloudMediaTab } from '../components/admin/AdminCloudMediaTab';
import { AdminCoachesTab } from '../components/admin/AdminCoachesTab';
import { AdminSystemTab } from '../components/admin/AdminSystemTab';
import { AdminLeaguesTab } from '../components/admin/AdminLeaguesTab';

export type AdminTab = 'pending' | 'users' | 'quotas' | 'media' | 'coaches' | 'system' | 'leagues';

export const AdminDashboard: React.FC = () => {
  const { user: currentAdmin, navigate } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [storageStats, setStorageStats] = useState<StorageUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');

  // Question limit config state (default 400)
  const [globalQuestionLimit, setGlobalQuestionLimit] = useState<number>(() => questionLimitService.getGlobalLimit());
  const [editingLimitVal, setEditingLimitVal] = useState<string>(() => String(questionLimitService.getGlobalLimit()));
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [editingStudentQuota, setEditingStudentQuota] = useState<{ student: UserAccount; limitVal: string } | null>(null);

  // Modals & Confirmation states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUserForCoachAssign, setSelectedUserForCoachAssign] = useState<UserAccount | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('usr-coach-001');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // In-app Confirmation Modal (Replaces window.confirm/alert for iframe reliability)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'delete' | 'reject' | 'toggle_status';
    userId: string;
    userName: string;
  } | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newPhone, setNewPhone] = useState('');
  const [newField, setNewField] = useState<'SAY' | 'EA' | 'SÖZ' | 'DİL'>('SAY');
  const [newTargetUniv, setNewTargetUniv] = useState('');
  const [newTargetDept, setNewTargetDept] = useState('');
  const [newCoachingSpecialty, setNewCoachingSpecialty] = useState('');
  const [newPendingAlert, setNewPendingAlert] = useState<string | null>(null);
  const prevPendingCountRef = useRef<number | null>(null);

  const loadUsers = async (forceRefresh = true) => {
    try {
      const all = await usersService.getAllUsers(forceRefresh);
      setUsers(all);
      const pendingList = all.filter((u) => u.status === 'pending');
      if (prevPendingCountRef.current !== null && pendingList.length > prevPendingCountRef.current) {
        const newlyAdded = pendingList[0];
        setNewPendingAlert(
          `Yeni Kayıt Başvurusu Geldi: ${newlyAdded.full_name || newlyAdded.email} (${newlyAdded.role === 'coach' ? 'Koç' : 'Öğrenci'}) onay masasında bekliyor!`
        );
      }
      prevPendingCountRef.current = pendingList.length;
    } catch (e: any) {
      setActionErrorMsg('Kullanıcı listesi yüklenemedi: ' + (e.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const loadStorage = async () => {
    try {
      const s = await storageService.getStorageStats();
      setStorageStats(s);
    } catch (err) {
      console.warn('Storage stats load error:', err);
    }
  };

  useEffect(() => {
    loadUsers(true);
    loadStorage();

    const handleSync = () => {
      loadUsers(true);
      loadStorage();
      setGlobalQuestionLimit(questionLimitService.getGlobalLimit());
    };

    const handleLimitUpdate = () => {
      setGlobalQuestionLimit(questionLimitService.getGlobalLimit());
      setEditingLimitVal(String(questionLimitService.getGlobalLimit()));
    };

    window.addEventListener('karne-cloud-sync', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('karne-users-updated', handleSync);
    window.addEventListener('karne-question-limit-updated', handleLimitUpdate);

    // Cross-tab broadcast listener for instant notification without page refresh
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('karne_users_broadcast_channel');
        channel.onmessage = (ev) => {
          if (ev.data?.type === 'USERS_UPDATED') {
            loadUsers(true);
          }
        };
      } catch {}
    }

    // Refresh immediately when tab becomes visible or focused
    const handleVisibility = () => {
      if (!document.hidden) {
        loadUsers(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // Fast auto-poll interval (every 3.5 seconds) so registrations on other devices show up instantly
    const intervalTimer = setInterval(() => {
      loadUsers(true);
    }, 3500);

    // Realtime Supabase listener
    let realtimeChannel: any = null;
    if (isSupabaseConfigured()) {
      try {
        realtimeChannel = supabase
          .channel('admin-users-listener')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'system_users' }, () => {
            loadUsers(true);
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel subscribe note:', err);
      }
    }

    return () => {
      window.removeEventListener('karne-cloud-sync', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('karne-users-updated', handleSync);
      window.removeEventListener('karne-question-limit-updated', handleLimitUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      clearInterval(intervalTimer);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
      if (realtimeChannel) {
        try {
          supabase.removeChannel(realtimeChannel);
        } catch {}
      }
    };
  }, []);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setActionErrorMsg(null);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const showError = (msg: string) => {
    setActionErrorMsg(msg);
    setTimeout(() => setActionErrorMsg(null), 5000);
  };

  // Question Limit Actions
  const handleUpdateGlobalLimit = async (limitNum: number) => {
    if (isNaN(limitNum) || limitNum < 10) {
      showError('Lütfen geçerli bir soru limiti giriniz (en az 10 soru).');
      return;
    }
    setIsSavingLimit(true);
    try {
      const saved = await questionLimitService.setGlobalLimit(limitNum);
      setGlobalQuestionLimit(saved);
      setEditingLimitVal(String(saved));
      showSuccess(`Öğrenci varsayılan soru bankası kapasitesi başarıyla ${saved} soru olarak güncellendi.`);
    } catch (err: any) {
      showError('Limit güncellenirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsSavingLimit(false);
    }
  };

  const handleUpdateStudentCustomLimit = async (studentId: string, limitNum: number | null) => {
    try {
      if (limitNum === null) {
        await questionLimitService.clearCustomLimit(studentId);
        showSuccess(`Öğrencinin kotası genel varsayılana (${globalQuestionLimit} soru) döndürüldü.`);
      } else {
        await questionLimitService.setCustomLimit(studentId, limitNum);
        showSuccess(`Öğrenciye özel soru kotası ${limitNum} soru olarak tanımlandı.`);
      }
      setEditingStudentQuota(null);
      await loadUsers();
    } catch (err: any) {
      showError('Özel kota güncellenemedi: ' + (err.message || 'Bilinmeyen hata'));
    }
  };

  const handleAssignCoach = async (studentId: string, coachId: string) => {
    try {
      await usersService.assignCoachToStudent(studentId, coachId);
      await loadUsers();
    } catch (err: any) {
      showError('Koç ataması güncellenemedi: ' + (err.message || 'Bilinmeyen hata'));
      throw err;
    }
  };

  // Actions
  const handleApprove = async (userId: string, coachId?: string) => {
    try {
      await usersService.approveUser(userId, coachId);
      showSuccess('Kullanıcı hesabı başarıyla ONAYLANDI ve aktif edildi.');
      await loadUsers();
    } catch (err: any) {
      showError(err.message || 'Onaylama işlemi gerçekleştirilemedi.');
    }
  };

  const triggerRejectConfirmation = (user: UserAccount) => {
    setConfirmModal({
      isOpen: true,
      title: 'Kayıt Başvurusunu Reddet',
      description: `"${user.full_name || user.email}" kullanıcısının başvurusunu reddetmek istediğinize emin misiniz? Kullanıcı sisteme giriş yapamayacaktır.`,
      actionType: 'reject',
      userId: user.id,
      userName: user.full_name || user.email,
    });
  };

  const triggerDeleteConfirmation = (user: UserAccount) => {
    if (user.id === currentAdmin?.id) {
      showError('Güvenlik nedeniyle kendi aktif yönetici hesabınızı silemezsiniz.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Kullanıcı Hesabını Tamamen Sil',
      description: `"${user.full_name || user.email}" isimli kullanıcıyı sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      actionType: 'delete',
      userId: user.id,
      userName: user.full_name || user.email,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { actionType, userId, userName } = confirmModal;
    setConfirmModal(null);

    try {
      if (actionType === 'reject') {
        await usersService.rejectUser(userId, 'Yönetici tarafından başvuru reddedildi.');
        showSuccess(`"${userName}" kullanıcısının başvurusu reddedildi.`);
      } else if (actionType === 'delete') {
        await usersService.deleteUser(userId);
        showSuccess(`"${userName}" kullanıcısı başarıyla silindi.`);
      }
      await loadUsers();
    } catch (err: any) {
      showError(err.message || 'İşlem sırasında bir hata oluştu.');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: AccountStatus) => {
    const nextStatus: AccountStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await usersService.updateUserStatus(userId, nextStatus);
      showSuccess(`Hesap durumu ${nextStatus === 'active' ? 'Aktif' : 'Askıya Alındı'} olarak güncellendi.`);
      await loadUsers();
    } catch (err: any) {
      showError(err.message || 'Durum güncellenemedi.');
    }
  };

  const handleAssignCoachModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCoachAssign) return;
    try {
      await usersService.assignCoachToStudent(selectedUserForCoachAssign.id, selectedCoachId);
      showSuccess(`"${selectedUserForCoachAssign.full_name}" isimli öğrenciye koç ataması yapıldı.`);
      setSelectedUserForCoachAssign(null);
      await loadUsers();
    } catch (err: any) {
      showError(err.message || 'Koç ataması yapılamadı.');
    }
  };

  const handleCreateDirectUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showError('Lütfen ad soyad ve e-posta alanlarını eksiksiz doldurunuz.');
      return;
    }

    try {
      await usersService.createDirectUser({
        full_name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword || '123456',
        role: newRole,
        status: 'active',
        phone: newPhone.trim(),
        field: newRole === 'student' ? newField : undefined,
        target_university: newRole === 'student' ? newTargetUniv.trim() : undefined,
        target_department: newRole === 'student' ? newTargetDept.trim() : undefined,
        coaching_specialty: newRole === 'coach' ? newCoachingSpecialty.trim() : undefined,
      });

      showSuccess(`Yeni ${newRole === 'student' ? 'öğrenci' : newRole === 'coach' ? 'koç' : 'yönetici'} hesabı oluşturuldu ve doğrudan aktif edildi.`);
      setIsAddUserModalOpen(false);
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPassword('123456');
      setNewPhone('');
      setNewTargetUniv('');
      setNewTargetDept('');
      setNewCoachingSpecialty('');
      await loadUsers();
    } catch (err: any) {
      showError(err.message || 'Kullanıcı oluşturulamadı.');
    }
  };

  // Metrics
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeStudents = users.filter((u) => u.role === 'student' && u.status === 'active');
  const activeCoaches = users.filter((u) => u.role === 'coach' && u.status === 'active');
  const allCoaches = users.filter((u) => u.role === 'coach');

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.target_university || '').toLowerCase().includes(q) ||
      (u.target_department || '').toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    if (activeTab === 'pending') {
      return u.status === 'pending' && matchesSearch;
    }

    if (activeTab === 'quotas') {
      return u.role === 'student' && matchesSearch;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div id="admin-dashboard-page" className="space-y-6">
      {/* Top Welcome & Admin Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DFD9CC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2A4A] text-[#F7F4EE] flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-7 h-7 text-[#D97736]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-[#1B2A4A] tracking-tight">
                Yönetici & Kullanıcı Onay Masası
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D97736]/15 text-[#D97736] border border-[#D97736]/20">
                Sistem Yetkilisi
              </span>
            </div>
            <p className="text-xs text-[#7E8D9F] mt-1">
              Kayıt olan öğrenci ve koç hesaplarını tek tıkla onaylayın, reddedin veya rolleri yönetin.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadUsers}
            title="Listeyi Yenile"
            className="p-2.5 rounded-2xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </button>
          <button
            type="button"
            id="btn-admin-add-user"
            onClick={() => setIsAddUserModalOpen(true)}
            className="py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs font-bold rounded-2xl transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#D97736]" />
            <span>Yeni Kullanıcı Tanımla</span>
          </button>
        </div>
      </div>

      {/* Success / Error Notification Alerts */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/20 text-[#2E6B4F] text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-2xl bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Pending Applications Urgent Alert Banner */}
      {pendingUsers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#D97736]/10 border border-[#D97736]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D97736] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#D97736]">
                  Yönetici & Kullanıcı Onay Masası
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#D97736] text-white text-[10px] font-mono font-black">
                  {pendingUsers.length} Yeni Başvuru
                </span>
              </div>
              <p className="text-xs text-[#1B2A4A] font-medium mt-0.5">
                Kayıt olan {pendingUsers.length} yeni öğrenci/koç hesabı onayınızı bekliyor. Onaylanana kadar sisteme erişemezler.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-inspect-pending-banner"
            onClick={() => setActiveTab('pending')}
            className="self-start sm:self-center py-2.5 px-4 bg-[#D97736] hover:bg-[#D97736]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Başvuruları İncele ({pendingUsers.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Bento Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approvals */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-md scale-[1.01]'
              : 'bg-white text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#F7F4EE]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold ${activeTab === 'pending' ? 'text-gray-300' : 'text-[#7E8D9F]'}`}>
              Onay Bekleyenler
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D97736]/20 text-[#D97736] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{pendingUsers.length}</span>
            {pendingUsers.length > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D97736] text-white">
                İnceleme Bekliyor
              </span>
            ) : (
              <span className={`text-[10px] font-semibold ${activeTab === 'pending' ? 'text-gray-400' : 'text-[#7E8D9F]'}`}>
                Bekleyen yok
              </span>
            )}
          </div>
          <p className={`text-[11px] mt-1.5 ${activeTab === 'pending' ? 'text-gray-300' : 'text-[#4A5B78]'}`}>
            Onaylandığında sisteme erişebilirler
          </p>
        </div>

        {/* Active Students */}
        <div
          onClick={() => {
            setActiveTab('users');
            setRoleFilter('student');
            setStatusFilter('active');
          }}
          className="p-5 rounded-3xl bg-white border border-[#DFD9CC] shadow-xs cursor-pointer hover:bg-[#F7F4EE] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#7E8D9F]">Aktif Öğrenciler</span>
            <div className="w-8 h-8 rounded-xl bg-[#255A8A]/10 text-[#255A8A] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-[#1B2A4A]">{activeStudents.length}</span>
          <p className="text-[11px] text-[#4A5B78] mt-1.5">YKS hazırlık paneli açık öğrenciler</p>
        </div>

        {/* Active Coaches */}
        <div
          onClick={() => {
            setActiveTab('coaches');
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'coaches'
              ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-md scale-[1.01]'
              : 'bg-white text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#F7F4EE]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold ${activeTab === 'coaches' ? 'text-gray-300' : 'text-[#7E8D9F]'}`}>
              Aktif YKS Koçları
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black">{activeCoaches.length}</span>
          <p className={`text-[11px] mt-1.5 ${activeTab === 'coaches' ? 'text-gray-300' : 'text-[#4A5B78]'}`}>
            Öğrenci takip yetkili koçlar
          </p>
        </div>

        {/* Total Users */}
        <div
          onClick={() => {
            setActiveTab('users');
            setRoleFilter('all');
            setStatusFilter('all');
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'users' && roleFilter === 'all' && statusFilter === 'all'
              ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-md scale-[1.01]'
              : 'bg-white text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#F7F4EE]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-bold ${
                activeTab === 'users' && roleFilter === 'all' && statusFilter === 'all'
                  ? 'text-gray-300'
                  : 'text-[#7E8D9F]'
              }`}
            >
              Toplam Kayıtlı Hesap
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-[#1B2A4A] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black">{users.length}</span>
          <p
            className={`text-[11px] mt-1.5 ${
              activeTab === 'users' && roleFilter === 'all' && statusFilter === 'all'
                ? 'text-gray-300'
                : 'text-[#4A5B78]'
            }`}
          >
            Sistemdeki tüm kayıtlı kullanıcılar
          </p>
        </div>
      </div>

      {/* Cloud Storage & Remaining Question Quota Banner */}
      <div
        onClick={() => setActiveTab('media')}
        className="bg-gradient-to-r from-[#F7F4EE] via-white to-[#F7F4EE] p-5 sm:p-6 rounded-3xl border border-[#DFD9CC] shadow-2xs hover:border-[#1B2A4A]/30 transition-all cursor-pointer group"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <HardDrive className="w-6 h-6 text-[#D97736]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#1B2A4A] group-hover:text-[#255A8A] transition-colors">
                  Bulut Depolama & Soru Kapasitesi Durumu
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  <Zap className="w-3 h-3 fill-emerald-600" />
                  WebP Akıllı Sıkıştırma Aktif
                </span>
              </div>
              <p className="text-xs text-[#4A5B78] mt-0.5">
                {storageStats ? (
                  <>
                    Toplam <strong>{formatBytes(storageStats.totalCapacityBytes)}</strong> kotanın{' '}
                    <strong>{formatBytes(storageStats.usedStorageBytes)}</strong> (%{storageStats.usedPercentage}) kullanılıyor.{' '}
                    Kalan boş alan: <strong className="text-emerald-700">{formatBytes(storageStats.remainingBytes)}</strong>
                  </>
                ) : (
                  'Depolama durumu taranıyor...'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#DFD9CC]/60">
            {storageStats && (
              <div className="text-left md:text-right">
                <span className="text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider block">
                  Kalan Soru Kapasitesi
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700">
                  ~{storageStats.estimatedRemainingQuestions.toLocaleString('tr-TR')} Soru
                </span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold group-hover:bg-[#255A8A] transition-colors shadow-xs">
              <span>Kota Yönetimi</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {storageStats && (
          <div className="mt-4 pt-3 border-t border-[#DFD9CC]/50">
            <div className="w-full h-2.5 bg-[#EFEBE0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  storageStats.usedPercentage >= 85 ? 'bg-[#C0392B]' : storageStats.usedPercentage >= 70 ? 'bg-[#D97736]' : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.max(storageStats.usedPercentage, 1)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Real-time New Pending Registrations Notification Alert */}
      {(newPendingAlert || (pendingUsers.length > 0 && activeTab !== 'pending')) && (
        <div className="bg-[#D97736]/10 border border-[#D97736]/30 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97736] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-[#1B2A4A] flex items-center gap-2">
                <span>{newPendingAlert || `Onay Masasında ${pendingUsers.length} Bekleyen Kayıt Başvurusu Var!`}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#D97736] animate-ping" />
              </h4>
              <p className="text-[11px] text-[#4A5B78] mt-0.5">
                Başvuruları onaylayarak öğrencilerin veya koçların anında sisteme erişmesini sağlayabilirsiniz.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {newPendingAlert && (
              <button
                type="button"
                onClick={() => setNewPendingAlert(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-black/[0.04] transition-colors cursor-pointer"
              >
                Kapat
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                setNewPendingAlert(null);
              }}
              className="px-4 py-2 bg-[#D97736] hover:bg-[#C26527] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>Onay Masasına Git ({pendingUsers.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Management Hub Master Navigation Tabs */}
      <div className="bg-white p-2 rounded-3xl border border-[#DFD9CC] shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          id="tab-admin-pending"
          onClick={() => setActiveTab('pending')}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
          }`}
        >
          <Clock className={`w-4 h-4 ${pendingUsers.length > 0 ? 'text-[#D97736] animate-pulse' : ''}`} />
          <span>Onay Masası</span>
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#D97736] text-white font-mono font-black">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-admin-users"
          onClick={() => {
            setActiveTab('users');
            setRoleFilter('all');
            setStatusFilter('all');
          }}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
          }`}
        >
          <Users className="w-4 h-4 text-[#255A8A]" />
          <span>Kullanıcı Yönetimi ({users.length})</span>
        </button>

        <button
          type="button"
          id="tab-admin-quotas"
          onClick={() => setActiveTab('quotas')}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'quotas'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
          }`}
        >
          <BookmarkPlus className="w-4 h-4 text-[#D97736]" />
          <span>Soru Bankası & Kotası</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B2A4A]/10 text-[#1B2A4A] font-mono font-bold">
            {globalQuestionLimit} Soru
          </span>
        </button>

        <button
          type="button"
          id="tab-admin-media"
          onClick={() => setActiveTab('media')}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'media'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
          }`}
        >
          <HardDrive className="w-4 h-4 text-[#C0392B]" />
          <span>Bulut Medya & Görseller</span>
        </button>

        <button
          type="button"
          id="tab-admin-coaches"
          onClick={() => setActiveTab('coaches')}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'coaches'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-[#2E6B4F]" />
          <span>Koçluk Ağı & Atamalar ({activeCoaches.length})</span>
        </button>

        <button
          type="button"
          id="tab-admin-leagues"
          onClick={() => setActiveTab('leagues')}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'leagues'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Ligler & Motivasyon Botları</span>
        </button>

        <button
          type="button"
          id="tab-admin-system"
          onClick={() => setActiveTab('system')}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#1B2A4A]" />
          <span>Sistem, Duyuru & Teşhis</span>
        </button>
      </div>

      {/* Tab: Ligler & Motivasyon Botları */}
      {activeTab === 'leagues' && (
        <AdminLeaguesTab />
      )}

      {/* Tab: Bulut Medya & Görsel Temizliği */}
      {activeTab === 'media' && (
        <AdminCloudMediaTab
          storageStats={storageStats}
          onRefreshStats={loadStorage}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {/* Tab: Koçluk Ağı & Atamalar */}
      {activeTab === 'coaches' && (
        <AdminCoachesTab
          users={users}
          onAssignCoach={handleAssignCoach}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {/* Tab: Sistem, Duyuru & Teşhis */}
      {activeTab === 'system' && (
        <AdminSystemTab
          users={users}
          storageStats={storageStats}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {/* Tab: Soru Bankası & Kotası */}
      {activeTab === 'quotas' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Question Bank Capacity & Limit Configuration Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center flex-shrink-0">
                  <BookmarkPlus className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-[#1B2A4A]">
                      Öğrenci Soru Bankası Maksimum Soru Kotası
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
                      Varsayılan Sınır: 400 Soru
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Aktif Genel Kota: {globalQuestionLimit} Soru / Öğrenci
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5B78] mt-1">
                    Öğrencilerin hata kasasına ekleyebileceği maksimum soru adedini buradan değiştirebilirsiniz. Bu sınıra ulaşan öğrenciler soru ekleyemez (varsayılan: 400 soru).
                  </p>
                </div>
              </div>

              {/* Quick Limit Input & Save */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl p-1.5 px-3">
                  <span className="text-[11px] font-bold text-[#7E8D9F]">Maks:</span>
                  <input
                    type="number"
                    min={10}
                    max={50000}
                    value={editingLimitVal}
                    onChange={(e) => setEditingLimitVal(e.target.value)}
                    className="w-20 bg-transparent text-sm font-black text-[#1B2A4A] focus:outline-none text-center"
                  />
                  <span className="text-[11px] font-semibold text-[#4A5B78]">Soru</span>
                </div>

                <button
                  type="button"
                  id="btn-save-global-limit"
                  disabled={isSavingLimit || Number(editingLimitVal) === globalQuestionLimit || Number(editingLimitVal) < 10}
                  onClick={() => handleUpdateGlobalLimit(Number(editingLimitVal))}
                  className="py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSavingLimit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-[#D97736]" />
                      <span>Limiti Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Limit Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#DFD9CC]/60">
              <span className="text-[11px] font-bold text-[#7E8D9F] mr-1">Hızlı Seçenekler:</span>
              {[250, 400, 500, 750, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setEditingLimitVal(String(preset));
                    handleUpdateGlobalLimit(preset);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    globalQuestionLimit === preset
                      ? 'bg-[#2E6B4F] text-white border-[#2E6B4F] shadow-2xs'
                      : 'bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border-[#DFD9CC]'
                  }`}
                >
                  {preset} Soru {preset === 400 && '⭐ (Varsayılan)'}
                </button>
              ))}
            </div>
          </div>

          {/* Student Quota Roster Card */}
          <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#DFD9CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-[#1B2A4A]">Öğrenci Bazlı Özel Kota Yönetimi</h4>
                <p className="text-xs text-[#7E8D9F]">
                  İstediğiniz öğrenciye genel sınırdan bağımsız VIP veya genişletilmiş soru kapasitesi atayın.
                </p>
              </div>
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Öğrenci ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F4EE] text-[#4A5B78] uppercase text-[10px] font-black tracking-wider border-b border-[#DFD9CC]">
                  <tr>
                    <th className="py-3 px-4">Öğrenci</th>
                    <th className="py-3 px-4">Alan & Hedef</th>
                    <th className="py-3 px-4">Tanımlı Soru Kotası</th>
                    <th className="py-3 px-4">Kota Türü</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFD9CC]">
                  {users.filter((u) => u.role === 'student' && (!searchTerm || (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()))).map((student) => {
                    const studentLimit = questionLimitService.getLimitForStudent(student.id);
                    const isCustom = questionLimitService.hasCustomLimit(student.id);

                    return (
                      <tr key={student.id} className="hover:bg-[#F7F4EE]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#255A8A] text-white flex items-center justify-center font-bold text-xs">
                              {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <p className="font-extrabold text-[#1B2A4A]">{student.full_name || 'İsimsiz'}</p>
                              <p className="text-[11px] text-[#7E8D9F] font-mono">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#255A8A]/10 text-[#255A8A]">
                            {student.field || 'SAY'}
                          </span>
                          <span className="text-[11px] text-[#4A5B78] ml-2">
                            {student.target_university || 'Belirtilmedi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1B2A4A]">
                          {studentLimit} Soru
                        </td>
                        <td className="py-3.5 px-4">
                          {isCustom ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Özel Kota Tanımlı
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F4EE] text-[#7E8D9F] border border-[#DFD9CC]">
                              Genel Varsayılan
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingStudentQuota({ student, limitVal: String(studentLimit) })}
                              className="py-1 px-3 rounded-xl bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              Kotayı Düzenle
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStudentCustomLimit(student.id, null)}
                                className="py-1 px-2.5 rounded-xl bg-[#F7F4EE] hover:bg-red-50 text-[#C0392B] border border-[#DFD9CC] text-[11px] font-bold transition-colors cursor-pointer"
                                title="Genel varsayılana sıfırla"
                              >
                                Sıfırla
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Main Table / Directory Section (for 'pending' and 'users' tabs) */}
      {(activeTab === 'pending' || activeTab === 'users') && (
        <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-xs overflow-hidden">
          {/* Navigation Tabs & Search Controls */}
          <div className="p-4 sm:p-6 border-b border-[#DFD9CC] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="tab-admin-pending"
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Onay Bekleyen Başvurular</span>
                {pendingUsers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#D97736] text-white font-mono font-black">
                    {pendingUsers.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                id="tab-admin-all-users"
                onClick={() => setActiveTab('users')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tüm Kullanıcılar ({users.length})</span>
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="İsim, e-posta, alan veya tel ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none placeholder:text-[#7E8D9F]"
                />
              </div>

              {activeTab === 'users' && (
                <>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
                  >
                    <option value="all">Tüm Roller</option>
                    <option value="student">Öğrenciler</option>
                    <option value="coach">Koçlar</option>
                    <option value="admin">Yöneticiler</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="pending">Onay Bekleyen</option>
                    <option value="rejected">Reddedilen</option>
                    <option value="suspended">Askıya Alınan</option>
                  </select>
                </>
              )}
            </div>
          </div>

        {/* Users List Table */}
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-[#7E8D9F]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1B2A4A]" />
            Kullanıcı listesi yükleniyor...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-[#7E8D9F] mx-auto opacity-50" />
            <p className="text-xs font-bold text-[#1B2A4A]">
              {activeTab === 'pending'
                ? 'Şu anda onay bekleyen yeni bir kayıt başvurusu bulunmamaktadır.'
                : 'Arama kriterlerine uygun kullanıcı bulunamadı.'}
            </p>
            {activeTab === 'pending' && (
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="mt-2 text-xs font-bold text-[#255A8A] hover:underline"
              >
                Tüm Kullanıcıları Görüntüle ({users.length})
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F4EE] text-[#4A5B78] uppercase text-[10px] font-black tracking-wider border-b border-[#DFD9CC]">
                  <tr>
                    <th className="py-3 px-4">Kullanıcı & İletişim</th>
                    <th className="py-3 px-4">Rol & Alan</th>
                    <th className="py-3 px-4">Hedef / Detay</th>
                    <th className="py-3 px-4">Kayıt Durumu</th>
                    <th className="py-3 px-4 text-right">Yönetim & Onay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFD9CC]">
                  {filteredUsers.map((item) => {
                    const isPending = item.status === 'pending';
                    const isActive = item.status === 'active';
                    const isRejected = item.status === 'rejected';
                    const isSuspended = item.status === 'suspended';

                    return (
                      <tr key={item.id} className="hover:bg-[#F7F4EE]/50 transition-colors">
                        {/* Name & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                                item.role === 'admin'
                                  ? 'bg-[#1B2A4A]'
                                  : item.role === 'coach'
                                  ? 'bg-[#2E6B4F]'
                                  : 'bg-[#255A8A]'
                              }`}
                            >
                              {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-extrabold text-[#1B2A4A]">{item.full_name || 'İsimsiz Kullanıcı'}</p>
                                {item.id === currentAdmin?.id && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                                    (Siz)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#7E8D9F] mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#255A8A]" />
                                  {item.email}
                                </span>
                                {item.phone && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-[#2E6B4F]" />
                                      {item.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role & Field */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.role === 'admin'
                                    ? 'bg-[#1B2A4A] text-white'
                                    : item.role === 'coach'
                                    ? 'bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20'
                                    : 'bg-[#255A8A]/10 text-[#255A8A] border border-[#255A8A]/20'
                                }`}
                              >
                                {item.role === 'admin'
                                  ? 'Admin'
                                  : item.role === 'coach'
                                  ? 'YKS Koçu'
                                  : 'Öğrenci'}
                              </span>
                              {item.field && (
                                <span className="text-[10px] font-mono font-bold text-[#1B2A4A] bg-[#F7F4EE] px-1.5 py-0.5 rounded border border-[#DFD9CC]">
                                  {item.field}
                                </span>
                              )}
                            </div>

                            {item.role === 'student' && (
                              <div className="flex items-center gap-1 pt-0.5">
                                <span className="text-[10px] font-mono text-[#4A5B78] bg-[#F7F4EE] px-2 py-0.5 rounded-md border border-[#DFD9CC] flex items-center gap-1">
                                  <BookmarkPlus className="w-2.5 h-2.5 text-[#D97736]" />
                                  Soru Kotası: <strong className="text-[#1B2A4A]">{questionLimitService.getUserLimit(item.id)}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingStudentQuota({
                                      student: item,
                                      limitVal: String(questionLimitService.getUserLimit(item.id)),
                                    })
                                  }
                                  title="Bu öğrencinin soru kotasını düzenle"
                                  className="text-[10px] font-bold text-[#255A8A] hover:underline px-1 cursor-pointer"
                                >
                                  Düzenle
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Target / Specialty */}
                        <td className="py-3.5 px-4">
                          <div className="text-[11px] text-[#4A5B78] max-w-xs">
                            {item.role === 'student' ? (
                              <>
                                {item.target_university || item.target_department ? (
                                  <p className="font-semibold text-[#1B2A4A]">
                                    {item.target_university} - {item.target_department}
                                  </p>
                                ) : (
                                  <span className="text-[#7E8D9F]">Hedef belirtilmedi</span>
                                )}
                                {item.target_rank && (
                                  <p className="text-[10px] text-[#D97736] font-bold mt-0.5">
                                    Hedef Sıralama: {item.target_rank}
                                  </p>
                                )}
                              </>
                            ) : item.role === 'coach' ? (
                              <p className="text-[#2E6B4F] font-medium">
                                {item.coaching_specialty || 'Genel YKS Koçluğu'}
                              </p>
                            ) : (
                              <p className="text-xs font-bold text-[#1B2A4A]">Sistem Yöneticisi</p>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              isActive
                                ? 'bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20'
                                : isPending
                                ? 'bg-[#D97736]/15 text-[#D97736] border border-[#D97736]/30 animate-pulse'
                                : isRejected
                                ? 'bg-[#D9534F]/10 text-[#D9534F] border border-[#D9534F]/20'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {isActive && <CheckCircle2 className="w-3 h-3" />}
                            {isPending && <Clock className="w-3 h-3" />}
                            {isRejected && <XCircle className="w-3 h-3" />}
                            <span>
                              {isActive
                                ? 'Aktif / Onaylı'
                                : isPending
                                ? 'Onay Bekliyor'
                                : isRejected
                                ? 'Reddedildi'
                                : 'Askıya Alındı'}
                            </span>
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  id={`btn-approve-${item.id}`}
                                  onClick={() => handleApprove(item.id)}
                                  className="py-1.5 px-3 rounded-xl bg-[#2E6B4F] hover:bg-[#2E6B4F]/90 text-white font-bold text-xs shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Onayla</span>
                                </button>

                                <button
                                  type="button"
                                  id={`btn-reject-${item.id}`}
                                  onClick={() => triggerRejectConfirmation(item)}
                                  className="py-1.5 px-2.5 rounded-xl bg-white border border-[#D9534F]/30 text-[#D9534F] hover:bg-[#D9534F]/10 font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Reddet
                                </button>
                              </>
                            ) : (
                              <>
                                {item.role === 'student' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedUserForCoachAssign(item)}
                                    className="py-1.5 px-2.5 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] border border-[#DFD9CC] text-[#1B2A4A] font-bold text-[11px] transition-colors"
                                  >
                                    Koç Ata
                                  </button>
                                )}

                                {item.id !== currentAdmin?.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(item.id, item.status || 'active')}
                                    className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-colors ${
                                      isActive
                                        ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                                        : 'bg-white border-[#2E6B4F]/30 text-[#2E6B4F] hover:bg-[#2E6B4F]/10'
                                    }`}
                                  >
                                    {isActive ? 'Dondur' : 'Aktif Et'}
                                  </button>
                                )}

                                {item.id !== currentAdmin?.id && (
                                  <button
                                    type="button"
                                    id={`btn-delete-${item.id}`}
                                    onClick={() => triggerDeleteConfirmation(item)}
                                    title="Kullanıcıyı Sil"
                                    className="p-1.5 rounded-xl text-[#D9534F] hover:bg-[#D9534F]/10 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (Optimized for small screens) */}
            <div className="md:hidden divide-y divide-[#DFD9CC]">
              {filteredUsers.map((item) => {
                const isPending = item.status === 'pending';
                const isActive = item.status === 'active';
                const isRejected = item.status === 'rejected';

                return (
                  <div key={item.id} className="p-4 space-y-3 hover:bg-[#F7F4EE]/40 transition-colors">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-2xs ${
                            item.role === 'admin'
                              ? 'bg-[#1B2A4A]'
                              : item.role === 'coach'
                              ? 'bg-[#2E6B4F]'
                              : 'bg-[#255A8A]'
                          }`}
                        >
                          {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-[#1B2A4A] text-sm truncate">
                            {item.full_name || 'İsimsiz Kullanıcı'}
                            {item.id === currentAdmin?.id && (
                              <span className="ml-1 text-[10px] font-bold text-[#7E8D9F]">(Siz)</span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.role === 'admin'
                                  ? 'bg-[#1B2A4A] text-white'
                                  : item.role === 'coach'
                                  ? 'bg-[#2E6B4F]/10 text-[#2E6B4F]'
                                  : 'bg-[#255A8A]/10 text-[#255A8A]'
                              }`}
                            >
                              {item.role === 'admin' ? 'Admin' : item.role === 'coach' ? 'Koç' : 'Öğrenci'}
                            </span>
                            {item.field && (
                              <span className="text-[10px] font-mono font-bold text-[#1B2A4A] bg-[#F7F4EE] px-1.5 py-0.2 rounded border border-[#DFD9CC]">
                                {item.field}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                          isActive
                            ? 'bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20'
                            : isPending
                            ? 'bg-[#D97736]/15 text-[#D97736] border border-[#D97736]/30 animate-pulse'
                            : isRejected
                            ? 'bg-[#D9534F]/10 text-[#D9534F] border border-[#D9534F]/20'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isActive && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                        {isPending && <Clock className="w-3 h-3 shrink-0" />}
                        {isRejected && <XCircle className="w-3 h-3 shrink-0" />}
                        <span>{isActive ? 'Aktif' : isPending ? 'Bekliyor' : isRejected ? 'Reddedildi' : 'Donduruldu'}</span>
                      </span>
                    </div>

                    {/* Contact & Target info */}
                    <div className="bg-[#F7F4EE] rounded-2xl p-2.5 text-xs text-[#4A5B78] space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#255A8A] shrink-0" />
                        <span className="truncate">{item.email}</span>
                      </div>
                      {item.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#2E6B4F] shrink-0" />
                          <a href={`tel:${item.phone}`} className="hover:underline font-mono">
                            {item.phone}
                          </a>
                        </div>
                      )}
                      {item.role === 'student' && (item.target_university || item.target_department) && (
                        <div className="pt-1 border-t border-[#DFD9CC]/50 text-[11px] text-[#1B2A4A] font-semibold truncate">
                          Hedef: {item.target_university} - {item.target_department}
                        </div>
                      )}
                      {item.role === 'coach' && item.coaching_specialty && (
                        <div className="pt-1 border-t border-[#DFD9CC]/50 text-[11px] text-[#2E6B4F] font-semibold truncate">
                          Uzmanlık: {item.coaching_specialty}
                        </div>
                      )}
                      {item.role === 'student' && (
                        <div className="pt-1 border-t border-[#DFD9CC]/50 flex items-center justify-between text-[11px]">
                          <span className="text-[#4A5B78]">
                            Soru Kotası: <strong className="text-[#1B2A4A]">{questionLimitService.getUserLimit(item.id)}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingStudentQuota({
                                student: item,
                                limitVal: String(questionLimitService.getUserLimit(item.id)),
                              })
                            }
                            className="text-[#255A8A] font-bold hover:underline"
                          >
                            Düzenle
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action buttons on mobile */}
                    <div className="pt-1 flex items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(item.id)}
                            className="flex-1 min-h-[44px] py-2 px-4 rounded-xl bg-[#2E6B4F] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Onayla ve Aktif Et</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerRejectConfirmation(item)}
                            className="min-h-[44px] py-2 px-3.5 rounded-xl bg-white border border-[#D9534F]/30 text-[#D9534F] hover:bg-[#D9534F]/10 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Reddet
                          </button>
                        </>
                      ) : (
                        <>
                          {item.role === 'student' && (
                            <button
                              type="button"
                              onClick={() => setSelectedUserForCoachAssign(item)}
                              className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] border border-[#DFD9CC] text-[#1B2A4A] font-bold text-xs transition-colors"
                            >
                              Koç Ata
                            </button>
                          )}
                          {item.id !== currentAdmin?.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item.id, item.status || 'active')}
                              className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
                                isActive
                                  ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                                  : 'bg-white border-[#2E6B4F]/30 text-[#2E6B4F] hover:bg-[#2E6B4F]/10'
                              }`}
                            >
                              {isActive ? 'Dondur' : 'Aktif Et'}
                            </button>
                          )}
                          {item.id !== currentAdmin?.id && (
                            <button
                              type="button"
                              onClick={() => triggerDeleteConfirmation(item)}
                              className="min-h-[40px] px-3 rounded-xl text-[#D9534F] bg-[#D9534F]/10 hover:bg-[#D9534F]/20 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      )}

      {/* Confirmation Modal (Iframe-safe Dialog) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#DFD9CC] shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9534F]/10 text-[#D9534F] flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1B2A4A]">{confirmModal.title}</h3>
                <p className="text-xs text-[#7E8D9F] mt-0.5">{confirmModal.userName}</p>
              </div>
            </div>

            <p className="text-xs text-[#4A5B78] leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-[#4A5B78] bg-[#F7F4EE] hover:bg-[#EFEBE0] border border-[#DFD9CC] transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                id="btn-modal-confirm-action"
                onClick={handleConfirmAction}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#D9534F] hover:bg-[#D9534F]/90 shadow-xs transition-colors"
              >
                {confirmModal.actionType === 'delete' ? 'Evet, Sil' : 'Evet, Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Coach Modal */}
      {selectedUserForCoachAssign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#DFD9CC] shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1B2A4A]">Öğrenciye Koç Ata</h3>
                <p className="text-xs text-[#7E8D9F]">{selectedUserForCoachAssign.full_name}</p>
              </div>
            </div>

            <form onSubmit={handleAssignCoachModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
                  Koç / Eğitim Danışmanı Seçimi
                </label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
                >
                  {allCoaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForCoachAssign(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-[#4A5B78] bg-[#F7F4EE] hover:bg-[#EFEBE0] border border-[#DFD9CC]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 shadow-xs"
                >
                  Koçu Ata ve Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Direct User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#DFD9CC] shadow-2xl space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DFD9CC] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5 text-[#D97736]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B2A4A]">Yeni Kullanıcı Tanımla</h3>
                  <p className="text-xs text-[#7E8D9F]">Admin yetkisiyle anında onaylı hesap açın</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirectUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Örn: Elif Aksoy"
                    className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1">E-Posta *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="elif@karne.app"
                    className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Şifre</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Hesap Rolü</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['student', 'coach', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        newRole === r
                          ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                          : 'bg-[#F7F4EE] text-[#4A5B78] border-[#DFD9CC]'
                      }`}
                    >
                      {r === 'student' ? 'Öğrenci' : r === 'coach' ? 'Koç' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              {newRole === 'student' && (
                <div className="p-3 bg-[#F7F4EE] rounded-2xl border border-[#DFD9CC] space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1B2A4A] mb-1">Alan Seçimi</label>
                    <select
                      value={newField}
                      onChange={(e) => setNewField(e.target.value as any)}
                      className="w-full py-1.5 px-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
                    >
                      <option value="SAY">Sayısal (SAY)</option>
                      <option value="EA">Eşit Ağırlık (EA)</option>
                      <option value="SÖZ">Sözel (SÖZ)</option>
                      <option value="DİL">Yabancı Dil (DİL)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#1B2A4A] mb-1">Hedef Üniversite</label>
                      <input
                        type="text"
                        value={newTargetUniv}
                        onChange={(e) => setNewTargetUniv(e.target.value)}
                        placeholder="Örn: ODTÜ"
                        className="w-full py-1.5 px-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#1B2A4A] mb-1">Hedef Bölüm</label>
                      <input
                        type="text"
                        value={newTargetDept}
                        onChange={(e) => setNewTargetDept(e.target.value)}
                        placeholder="Örn: Bilgisayar Müh."
                        className="w-full py-1.5 px-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {newRole === 'coach' && (
                <div className="p-3 bg-[#F7F4EE] rounded-2xl border border-[#DFD9CC]">
                  <label className="block text-[11px] font-bold text-[#1B2A4A] mb-1">Koçluk Uzmanlık Alanı</label>
                  <input
                    type="text"
                    value={newCoachingSpecialty}
                    onChange={(e) => setNewCoachingSpecialty(e.target.value)}
                    placeholder="Örn: YKS Sayısal & EA Derece Koçluğu"
                    className="w-full py-1.5 px-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-[#4A5B78] bg-[#F7F4EE] hover:bg-[#EFEBE0] border border-[#DFD9CC]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 shadow-xs"
                >
                  Kullanıcıyı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Custom Quota Modal */}
      {editingStudentQuota && (
        <div
          id="modal-student-quota"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFD9CC]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center font-bold">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1B2A4A]">Öğrenci Soru Kotasını Özelleştir</h3>
                  <p className="text-xs text-[#7E8D9F]">{editingStudentQuota.student.full_name || editingStudentQuota.student.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudentQuota(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F7F4EE] flex items-center justify-center text-[#7E8D9F] hover:text-[#1B2A4A]"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#4A5B78] leading-relaxed">
                Bu öğrenciye genel varsayılan kotadan (<strong>{globalQuestionLimit} soru</strong>) farklı bir özel soru kapasitesi atayabilirsiniz.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1">
                  Maksimum Soru Sayısı:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={100000}
                    value={editingStudentQuota.limitVal}
                    onChange={(e) =>
                      setEditingStudentQuota({
                        ...editingStudentQuota,
                        limitVal: e.target.value,
                      })
                    }
                    className="flex-1 p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-sm font-bold text-[#1B2A4A] focus:outline-none"
                  />
                  <span className="text-xs font-bold text-[#7E8D9F]">Soru</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[250, 400, 500, 750, 1000, 1500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setEditingStudentQuota({
                        ...editingStudentQuota,
                        limitVal: String(preset),
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      Number(editingStudentQuota.limitVal) === preset
                        ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                        : 'bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border-[#DFD9CC]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#DFD9CC]">
              <button
                type="button"
                onClick={() => handleUpdateStudentCustomLimit(editingStudentQuota.student.id, null)}
                className="py-2.5 px-3 text-xs font-bold text-[#4A5B78] hover:text-[#C0392B] bg-[#F7F4EE] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Özel kotayı kaldırıp genel varsayılana döndür"
              >
                Varsayılana Sıfırla
              </button>

              <div className="flex-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudentQuota(null)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-[#4A5B78] hover:bg-[#F7F4EE] cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateStudentCustomLimit(
                      editingStudentQuota.student.id,
                      Number(editingStudentQuota.limitVal)
                    )
                  }
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 shadow-xs cursor-pointer"
                >
                  Kotayı Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
