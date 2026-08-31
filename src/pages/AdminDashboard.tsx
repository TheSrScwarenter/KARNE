import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { usersService, UserAccount } from '../lib/usersService';
import { UserRole, AccountStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await usersService.getAllUsers();
      setUsers(all);
    } catch (e: any) {
      setActionErrorMsg('Kullanıcı listesi yüklenemedi: ' + (e.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();

    const handleSync = () => {
      loadUsers();
    };

    window.addEventListener('karne-cloud-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('karne-cloud-sync', handleSync);
      window.removeEventListener('storage', handleSync);
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

  const handleAssignCoach = async (e: React.FormEvent) => {
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
            setActiveTab('all');
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
            setActiveTab('all');
            setRoleFilter('coach');
            setStatusFilter('active');
          }}
          className="p-5 rounded-3xl bg-white border border-[#DFD9CC] shadow-xs cursor-pointer hover:bg-[#F7F4EE] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#7E8D9F]">Aktif YKS Koçları</span>
            <div className="w-8 h-8 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-[#1B2A4A]">{activeCoaches.length}</span>
          <p className="text-[11px] text-[#4A5B78] mt-1.5">Öğrenci takip yetkili koçlar</p>
        </div>

        {/* Total Users */}
        <div
          onClick={() => {
            setActiveTab('all');
            setRoleFilter('all');
            setStatusFilter('all');
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTab === 'all' && roleFilter === 'all' && statusFilter === 'all'
              ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-md scale-[1.01]'
              : 'bg-white text-[#1B2A4A] border-[#DFD9CC] hover:bg-[#F7F4EE]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-bold ${
                activeTab === 'all' && roleFilter === 'all' && statusFilter === 'all'
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
              activeTab === 'all' && roleFilter === 'all' && statusFilter === 'all'
                ? 'text-gray-300'
                : 'text-[#4A5B78]'
            }`}
          >
            Sistemdeki tüm kayıtlı kullanıcılar
          </p>
        </div>
      </div>

      {/* Main Table / Directory Section */}
      <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-xs overflow-hidden">
        {/* Navigation Tabs & Search Controls */}
        <div className="p-4 sm:p-6 border-b border-[#DFD9CC] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="tab-admin-pending"
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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
              onClick={() => setActiveTab('all')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'all'
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

            {activeTab === 'all' && (
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
                onClick={() => setActiveTab('all')}
                className="mt-2 text-xs font-bold text-[#255A8A] hover:underline"
              >
                Tüm Kullanıcıları Görüntüle ({users.length})
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                            <p className="text-[10px] font-mono text-[#7E8D9F]">
                              Alan: <strong className="text-[#1B2A4A]">{item.field}</strong>
                            </p>
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
        )}
      </div>

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

            <form onSubmit={handleAssignCoach} className="space-y-4">
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
    </div>
  );
};
