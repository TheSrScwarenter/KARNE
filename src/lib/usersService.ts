import { cloudStorage } from './cloudStorage';
import { UserProfile, UserRole, AccountStatus } from '../types';
import { coachService } from './coachService';
import { idbStorage } from './indexedDbStorage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

export interface UserAccount extends UserProfile {
  password?: string;
  phone?: string;
  field?: 'SAY' | 'EA' | 'SÖZ' | 'DİL';
  target_university?: string;
  target_department?: string;
  target_rank?: string;
  coaching_specialty?: string;
  assigned_coach_id?: string;
  approval_date?: string;
  notes_by_admin?: string;
}

const USERS_STORAGE_KEY = 'karne_system_users_v3';
const DELETED_USERS_STORAGE_KEY = 'karne_deleted_user_ids_v1';

// Cross-tab and cross-window real-time synchronization channel
let usersChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    usersChannel = new BroadcastChannel('karne_users_broadcast_channel');
  } catch (e) {
    console.warn('Users BroadcastChannel init skipped:', e);
  }
}

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-admin-001',
    role: 'admin',
    status: 'active',
    full_name: 'Sistem Yöneticisi',
    email: 'admin@karne.app',
    password: '190707',
    phone: '0850 300 20 26',
    created_at: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'usr-coach-001',
    role: 'coach',
    status: 'active',
    full_name: 'Selin Koçak (Eğitim Danışmanı)',
    email: 'koc@karne.app',
    password: '190707',
    phone: '0532 100 20 30',
    coaching_specialty: 'YKS Sayısal & Eşit Ağırlık Derece Koçluğu',
    coach_code: 'SELIN-KOC',
    created_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'usr-coach-002',
    role: 'coach',
    status: 'active',
    full_name: 'Ahmet Hoca (YKS Başkoç & Matematik)',
    email: 'ahmet@karne.app',
    password: '190707',
    phone: '0533 222 33 44',
    coaching_specialty: 'İleri Seviye Matematik & YKS Strateji Danışmanlığı',
    coach_code: 'AHMET-KOC',
    created_at: '2026-08-01T10:15:00.000Z',
  },
  {
    id: 'usr-coach-003',
    role: 'coach',
    status: 'active',
    full_name: 'Zeynep Danışman (Sözel & Dil Koçu)',
    email: 'zeynep@karne.app',
    password: '190707',
    phone: '0535 444 55 66',
    coaching_specialty: 'YKS Sözel, Dil & TYT Türkçe/Paragraf Koçluğu',
    coach_code: 'ZEYNEP-KOC',
    created_at: '2026-08-01T10:30:00.000Z',
  },
  {
    id: 'usr-coach-1788794170295',
    role: 'coach',
    status: 'active',
    full_name: 'deneme',
    email: 'koc2@karne.app',
    password: '190707',
    phone: '',
    field: 'SAY',
    created_at: '2026-09-07T15:16:10.295Z',
    approval_date: '2026-09-07T15:16:10.295Z',
    notes_by_admin: 'Manuel kayıt ile doğrudan aktifleştirildi.',
  },
  {
    id: 'usr-student-001',
    role: 'student',
    status: 'active',
    full_name: 'Demir Yılmaz',
    email: 'ogrenci@karne.app',
    password: '190707',
    phone: '0555 123 45 67',
    field: 'SAY',
    target_university: 'Hacettepe Üniversitesi',
    target_department: 'Tıp Fakültesi',
    target_rank: 'İlk 5.000',
    created_at: '2026-08-01T11:00:00.000Z',
  },
  {
    id: 'usr-student-burak-002',
    role: 'student',
    status: 'active',
    full_name: 'Burak Arslan',
    email: 'burak@yks2026.com',
    password: '190707',
    phone: '0544 987 65 43',
    field: 'SÖZ',
    target_university: 'Galatasaray Üniversitesi',
    target_department: 'İletişim & Medya',
    target_rank: 'İlk 1.500',
    created_at: '2026-08-20T14:30:00.000Z',
    approval_date: '2026-09-09T14:14:12.020Z',
    notes_by_admin: 'Admin tarafından onaylandı.',
  },
];

class UsersService {
  private inMemoryCache: UserAccount[] | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  public getDeletedTombstones(): Set<string> {
    const set = new Set<string>();
    if (typeof window === 'undefined') return set;
    try {
      const raw = localStorage.getItem(DELETED_USERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => {
            if (id && typeof id === 'string') set.add(id.trim().toLowerCase());
          });
        }
      }
    } catch {}
    return set;
  }

  public addDeletedTombstone(id: string, email?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getDeletedTombstones();
      if (id) current.add(id.trim().toLowerCase());
      if (email) current.add(email.trim().toLowerCase());
      const arr = Array.from(current);
      localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(arr));
      idbStorage.setItem(DELETED_USERS_STORAGE_KEY, arr).catch(() => {});
    } catch {}
  }

  public removeDeletedTombstone(id: string, email?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getDeletedTombstones();
      if (id) current.delete(id.trim().toLowerCase());
      if (email) current.delete(email.trim().toLowerCase());
      const arr = Array.from(current);
      localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(arr));
      idbStorage.setItem(DELETED_USERS_STORAGE_KEY, arr).catch(() => {});
    } catch {}
  }

  constructor() {
    this.initAsync();
    // Listen for real-time broadcasts from other tabs or actions
    if (typeof window !== 'undefined') {
      if (usersChannel) {
        usersChannel.onmessage = (ev) => {
          if (ev.data?.type === 'USERS_UPDATED') {
            this.invalidateCacheAndReload().catch(() => {});
          }
        };
      }
      // Also listen for native storage changes
      window.addEventListener('storage', (e) => {
        if (e.key === USERS_STORAGE_KEY) {
          this.invalidateCacheAndReload().catch(() => {});
        }
      });
    }
  }

  public async invalidateCacheAndReload(): Promise<UserAccount[]> {
    this.inMemoryCache = null;
    this.isInitialized = false;
    this.initPromise = null;
    await this.initAsync();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('karne-users-updated', {
          detail: { count: (this.inMemoryCache || []).length },
        })
      );
    }
    return this.getStoredUsers();
  }

  public async initAsync(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const idbUsers = await idbStorage.getItem<UserAccount[]>(USERS_STORAGE_KEY);
        const localUsers = cloudStorage.getItem<UserAccount[]>(USERS_STORAGE_KEY, DEFAULT_USERS);

        // Merge users from all sources
        const mergedMap = new Map<string, UserAccount>();

        const tombstones = this.getDeletedTombstones();
        const isTombstoned = (u: any) => {
          if (!u) return true;
          const idKey = u.id ? String(u.id).trim().toLowerCase() : '';
          const emailKey = u.email ? String(u.email).trim().toLowerCase() : '';
          return (idKey && tombstones.has(idKey)) || (emailKey && tombstones.has(emailKey));
        };

        const mergeUserIntoMap = (u: UserAccount) => {
          if (!u || (!u.email && !u.id)) return;
          if (isTombstoned(u)) return;
          const key = (u.email ? u.email.trim().toLowerCase() : u.id);
          const existing = mergedMap.get(key);
          if (!existing) {
            mergedMap.set(key, { ...u });
          } else {
            // Determine resolved status: Never downgrade an active/approved user back to pending!
            let resolvedStatus = u.status || existing.status || 'pending';
            if (existing.status === 'active' || u.status === 'active') {
              if (u.status === 'rejected' || u.status === 'suspended') {
                resolvedStatus = u.status;
              } else if (existing.status === 'rejected' || existing.status === 'suspended') {
                resolvedStatus = u.approval_date ? 'active' : existing.status;
              } else {
                resolvedStatus = 'active';
              }
            } else if (existing.status === 'rejected' || u.status === 'rejected') {
              resolvedStatus = 'rejected';
            } else if (existing.status === 'suspended' || u.status === 'suspended') {
              resolvedStatus = 'suspended';
            }

            mergedMap.set(key, {
              ...existing,
              ...u,
              status: resolvedStatus,
              approval_date: u.approval_date || existing.approval_date || (resolvedStatus === 'active' ? new Date().toISOString() : undefined),
              password: u.password || existing.password || '190707',
              phone: u.phone || existing.phone || '',
              field: u.field || existing.field || 'SAY',
              target_university: u.target_university || existing.target_university || '',
              target_department: u.target_department || existing.target_department || '',
              target_rank: u.target_rank || existing.target_rank || null,
              coaching_specialty: u.coaching_specialty || existing.coaching_specialty || '',
              coach_code: u.coach_code || existing.coach_code || null,
              assigned_coach_id: u.assigned_coach_id || existing.assigned_coach_id || null,
              assigned_coach_name: u.assigned_coach_name || existing.assigned_coach_name || null,
              notes_by_admin: u.notes_by_admin || existing.notes_by_admin || null,
            });
          }
        };

        // 1. Add known default & registered users
        DEFAULT_USERS.forEach(mergeUserIntoMap);

        // 2. Add local storage users
        (localUsers || []).forEach(mergeUserIntoMap);

        // 3. Add IndexedDB persistent users
        if (idbUsers && Array.isArray(idbUsers)) {
          idbUsers.forEach(mergeUserIntoMap);
        }

        // 4. Fetch users from server persistent storage (/api/system-users)
        try {
          const res = await fetch('/api/system-users');
          if (res.ok) {
            const json = await res.json();
            if (json && Array.isArray(json.users)) {
              json.users.forEach(mergeUserIntoMap);
            }
          }
        } catch (serverErr) {
          // Server fetch optional (e.g. static preview)
        }

        // 5. Fetch cloud users from Supabase if configured
        if (isSupabaseConfigured()) {
          try {
            const { data: suUsers, error } = await supabase.from('system_users').select('*');
            if (!error && suUsers && Array.isArray(suUsers)) {
              suUsers.forEach(mergeUserIntoMap);
            }
          } catch (supaErr) {
            console.warn('Supabase system_users sync skipped:', supaErr);
          }
        }

        const mergedList = Array.from(mergedMap.values());
        this.inMemoryCache = mergedList;
        this.isInitialized = true;

        // Sync back to local & indexedDB
        cloudStorage.setItem<UserAccount[]>(USERS_STORAGE_KEY, mergedList);
        await idbStorage.setItem(USERS_STORAGE_KEY, mergedList);

        // Background sync to server & supabase to ensure consistency across dev and published
        this.syncBatchToCloud(mergedList);
      } catch (e) {
        console.warn('UsersService initAsync error:', e);
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private getStoredUsers(): UserAccount[] {
    const tombstones = this.getDeletedTombstones();
    const isTombstoned = (u: any) => {
      if (!u) return true;
      const idKey = u.id ? String(u.id).trim().toLowerCase() : '';
      const emailKey = u.email ? String(u.email).trim().toLowerCase() : '';
      return (idKey && tombstones.has(idKey)) || (emailKey && tombstones.has(emailKey));
    };

    if (this.inMemoryCache && this.inMemoryCache.length > 0) {
      return this.inMemoryCache.filter((u) => !isTombstoned(u));
    }
    const list = cloudStorage.getItem<UserAccount[]>(USERS_STORAGE_KEY, DEFAULT_USERS);
    const filtered = (list || []).filter((u) => !isTombstoned(u));
    this.inMemoryCache = filtered;
    return filtered;
  }

  private saveUsers(users: UserAccount[]): void {
    this.inMemoryCache = users;
    // 1. Local storage
    cloudStorage.setItem<UserAccount[]>(USERS_STORAGE_KEY, users);
    // 2. Guaranteed persistent IndexedDB backup
    idbStorage.setItem(USERS_STORAGE_KEY, users).catch((err) => {
      console.warn('IndexedDB users backup error:', err);
    });
    // 3. Dispatch window events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('karne-users-updated', { detail: { count: users.length } }));
    }
    // 4. Broadcast across tabs and windows
    if (usersChannel) {
      try {
        usersChannel.postMessage({ type: 'USERS_UPDATED', timestamp: Date.now() });
      } catch {}
    }
  }

  public async getAllUsers(forceRefresh = false): Promise<UserAccount[]> {
    if (!this.isInitialized || forceRefresh || this.initPromise) {
      if (forceRefresh) {
        this.inMemoryCache = null;
        this.isInitialized = false;
        this.initPromise = null;
      }
      await this.initAsync();
    }
    return this.getStoredUsers();
  }

  public async getCoaches(): Promise<UserAccount[]> {
    const list = await this.getAllUsers();
    return list.filter((u) => u.role === 'coach' && u.status === 'active');
  }

  public async getCoachByCode(code: string): Promise<UserAccount | null> {
    if (!code || !code.trim()) return null;
    const normalized = code.trim().toUpperCase();
    const list = await this.getAllUsers();
    
    // Search in coaches by coach_code, id, email, or name
    const coach = list.find((u) => {
      if (u.role !== 'coach') return false;
      if (u.coach_code && u.coach_code.toUpperCase() === normalized) return true;
      if (u.id.toUpperCase() === normalized) return true;
      if (u.email && u.email.toUpperCase() === normalized) return true;
      if (normalized.includes('SELIN') && u.full_name?.toLowerCase().includes('selin')) return true;
      if (normalized.includes('AHMET') && u.full_name?.toLowerCase().includes('ahmet')) return true;
      if (normalized.includes('ZEYNEP') && u.full_name?.toLowerCase().includes('zeynep')) return true;
      return false;
    });

    return coach || null;
  }

  public async getUserById(id: string): Promise<UserAccount | null> {
    const list = await this.getAllUsers();
    let found = list.find((u) => u.id === id);

    // If not found in local cache, do live Supabase lookup
    if (!found && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('system_users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data && !error) {
          found = data as UserAccount;
          const currentList = this.getStoredUsers();
          if (!currentList.some((u) => u.id === found!.id)) {
            currentList.unshift(found);
            this.saveUsers(currentList);
          }
        }
      } catch (e) {
        console.warn('Live Supabase lookup error for id:', id, e);
      }
    }

    return found || null;
  }

  public async getUserByEmail(email: string): Promise<UserAccount | null> {
    const normalized = email.trim().toLowerCase();
    const list = await this.getAllUsers();
    
    // Exact match or known aliases
    let found = list.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      if (uEmail === normalized) return true;
      if (normalized === 'admin@karne.com' && uEmail === 'admin@karne.app') return true;
      if (normalized === 'selin@karne.app' && uEmail === 'koc@karne.app') return true;
      if (normalized === 'ahmet@karne.com' && uEmail === 'ahmet@karne.app') return true;
      if (normalized === 'demir@karne.app' && uEmail === 'ogrenci@karne.app') return true;
      return false;
    });

    // If not found in local cache, do live Supabase lookup so users created on other devices (mobile) appear immediately on desktop
    if (!found && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('system_users')
          .select('*')
          .ilike('email', normalized)
          .maybeSingle();
        if (data && !error) {
          found = data as UserAccount;
          const currentList = this.getStoredUsers();
          if (!currentList.some((u) => u.id === found!.id)) {
            currentList.unshift(found);
            this.saveUsers(currentList);
          }
        }
      } catch (e) {
        console.warn('Live Supabase lookup error for email:', normalized, e);
      }
    }

    return found || null;
  }

  public async registerUser(data: {
    email: string;
    password?: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    field?: 'SAY' | 'EA' | 'SÖZ' | 'DİL';
    target_university?: string;
    target_department?: string;
    coaching_specialty?: string;
    coach_code?: string;
    autoActivate?: boolean;
  }): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const existing = await this.getUserByEmail(data.email);
    if (existing) {
      throw new Error('Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır.');
    }

    const isAutoActive = Boolean(data.autoActivate); // Default to false (pending admin approval) for public signups

    // If student provided a coach code, try to match with a registered coach
    let assignedCoachId: string | undefined = undefined;
    let assignedCoachName: string | undefined = undefined;

    if (data.role === 'student' && data.coach_code?.trim()) {
      const matchedCoach = await this.getCoachByCode(data.coach_code);
      if (matchedCoach) {
        assignedCoachId = matchedCoach.id;
        assignedCoachName = matchedCoach.full_name || 'Eğitim Danışmanı';
      }
    }

    const newUser: UserAccount = {
      id: `usr-${data.role}-${Date.now()}`,
      role: data.role,
      status: isAutoActive ? 'active' : 'pending',
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password || '123456',
      phone: data.phone || '',
      field: data.field || 'SAY',
      target_university: data.target_university || '',
      target_department: data.target_department || '',
      coaching_specialty: data.coaching_specialty || '',
      coach_code: data.coach_code?.trim() || undefined,
      assigned_coach_id: assignedCoachId,
      assigned_coach_name: assignedCoachName,
      created_at: new Date().toISOString(),
      approval_date: isAutoActive ? new Date().toISOString() : undefined,
      notes_by_admin: isAutoActive ? 'Yönetici tarafından doğrudan aktifleştirildi.' : 'Yeni kayıt başvurusu (Yönetici Onayı Bekliyor)',
    };

    list.unshift(newUser);
    this.saveUsers(list);
    await this.syncUserToSupabase(newUser);

    if (newUser.role === 'student' && newUser.status === 'active') {
      try {
        await coachService.syncStudentFromUser(newUser);
      } catch (e) {
        console.warn('Coach student sync error on register:', e);
      }
    }

    return newUser;
  }

  private async syncUserToCloud(user: UserAccount): Promise<void> {
    // 1. Sync to server persistent endpoint
    try {
      await fetch('/api/system-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch {}

    // 2. Sync to Supabase
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('system_users').upsert([user]);
        if (error) {
          console.warn('Supabase system_users sync note:', error.message);
        }
      } catch (e) {
        console.warn('Supabase sync call exception:', e);
      }
    }
  }

  private async syncBatchToCloud(users: UserAccount[]): Promise<void> {
    if (!users || users.length === 0) return;

    // 1. Sync to server
    try {
      await fetch('/api/system-users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });
    } catch {}

    // 2. Sync to Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('system_users').upsert(users);
      } catch (e) {
        console.warn('Supabase batch sync note:', e);
      }
    }
  }

  private async deleteUserFromCloud(userId: string, email?: string): Promise<void> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    // 1. Delete from server
    try {
      await fetch(`/api/system-users/${userId}${query}`, {
        method: 'DELETE',
      });
    } catch {}

    // 2. Delete from Supabase
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('system_users').delete().eq('id', userId);
        if (error) {
          console.warn('Supabase system_users delete error:', error.message);
        }
        if (email) {
          await supabase.from('system_users').delete().eq('email', email);
        }
      } catch (e) {
        console.warn('Supabase delete exception:', e);
      }
    }
  }

  private async syncUserToSupabase(user: UserAccount): Promise<void> {
    await this.syncUserToCloud(user);
  }

  private async deleteUserFromSupabase(userId: string, email?: string): Promise<void> {
    await this.deleteUserFromCloud(userId, email);
  }

  public async approveUser(userId: string, coachId?: string): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const user = list.find((u) => u.id === userId);
    if (!user) throw new Error('Kullanıcı bulunamadı');

    user.status = 'active';
    user.approval_date = new Date().toISOString();
    if (coachId) {
      user.assigned_coach_id = coachId;
    }
    this.saveUsers(list);
    await this.syncUserToCloud(user);

    if (user.role === 'student') {
      try {
        await coachService.syncStudentFromUser(user);
      } catch (e) {
        console.warn('Coach student sync error on approve:', e);
      }
    }

    return user;
  }

  public async rejectUser(userId: string, reason?: string): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const user = list.find((u) => u.id === userId);
    if (!user) throw new Error('Kullanıcı bulunamadı');

    user.status = 'rejected';
    if (reason) {
      user.notes_by_admin = reason;
    }
    this.saveUsers(list);
    await this.syncUserToCloud(user);
    return user;
  }

  public async updateUserStatus(userId: string, status: AccountStatus): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const user = list.find((u) => u.id === userId);
    if (!user) throw new Error('Kullanıcı bulunamadı');

    user.status = status;
    if (status === 'active' && !user.approval_date) {
      user.approval_date = new Date().toISOString();
    }
    this.saveUsers(list);
    await this.syncUserToCloud(user);
    return user;
  }

  public async updateUserProfile(userId: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const user = list.find((u) => u.id === userId);
    if (!user) throw new Error('Kullanıcı bulunamadı');

    Object.assign(user, updates);
    this.saveUsers(list);
    await this.syncUserToCloud(user);
    return user;
  }

  public async updateUser(userId: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    return this.updateUserProfile(userId, updates);
  }

  public async deleteUser(userId: string): Promise<void> {
    const list = this.getStoredUsers();
    const target = list.find((u) => u.id === userId);
    const targetEmail = target?.email?.trim().toLowerCase();

    // 1. Add to permanent tombstone list
    this.addDeletedTombstone(userId, targetEmail);

    // 2. Filter out of local and in-memory list
    const filtered = list.filter(
      (u) => u.id !== userId && (!targetEmail || u.email?.trim().toLowerCase() !== targetEmail)
    );
    this.saveUsers(filtered);

    // 3. Immediately invalidate active auth session if the deleted user is currently logged in
    if (typeof window !== 'undefined') {
      try {
        const authRaw = localStorage.getItem('karne_auth_user');
        if (authRaw) {
          const authUser = JSON.parse(authRaw);
          if (authUser?.id === userId || (targetEmail && authUser?.email?.trim().toLowerCase() === targetEmail)) {
            localStorage.removeItem('karne_auth_user');
            localStorage.removeItem('karne_active_role');
            sessionStorage.removeItem('karne_auth_user');
          }
        }
      } catch {}
    }

    // 4. Delete from server and Supabase
    await this.deleteUserFromCloud(userId, targetEmail);
  }

  public async assignCoachToStudent(studentId: string, coachId: string): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const student = list.find((u) => u.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    const coach = list.find((u) => u.id === coachId);
    student.assigned_coach_id = coachId;
    if (coach) {
      student.assigned_coach_name = coach.full_name || 'Eğitim Koçu';
    }
    this.saveUsers(list);
    await this.syncUserToCloud(student);
    return student;
  }

  public async assignCoachByCode(studentId: string, coachCode: string): Promise<{ success: boolean; coach: UserAccount }> {
    if (!coachCode || !coachCode.trim()) {
      throw new Error('Lütfen geçerli bir koçluk kodu giriniz.');
    }
    const coach = await this.getCoachByCode(coachCode.trim());
    if (!coach) {
      throw new Error('Girilen koçluk koduyla eşleşen bir koç bulunamadı. Lütfen koçunuzun kodunu kontrol ediniz.');
    }
    await this.assignCoachToStudent(studentId, coach.id);
    return { success: true, coach };
  }

  public async createDirectUser(userObj: Omit<UserAccount, 'id' | 'created_at'>): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const newUser: UserAccount = {
      ...userObj,
      id: `usr-${userObj.role}-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newUser);
    this.saveUsers(list);
    await this.syncUserToCloud(newUser);

    if (newUser.role === 'student' && newUser.status === 'active') {
      try {
        await coachService.syncStudentFromUser(newUser);
      } catch (e) {
        console.warn('Coach student sync error on create:', e);
      }
    }

    return newUser;
  }
}

export const usersService = new UsersService();
