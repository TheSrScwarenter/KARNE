import { cloudStorage } from './cloudStorage';
import { UserProfile, UserRole, AccountStatus } from '../types';
import { coachService } from './coachService';

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
    created_at: '2026-08-01T10:00:00.000Z',
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
    assigned_coach_id: 'usr-coach-001',
    created_at: '2026-08-01T11:00:00.000Z',
  },
  {
    id: 'usr-pending-002',
    role: 'student',
    status: 'pending',
    full_name: 'Burak Arslan',
    email: 'burak@yks2026.com',
    password: '190707',
    phone: '0544 987 65 43',
    field: 'SÖZ',
    target_university: 'Galatasaray Üniversitesi',
    target_department: 'İletişim & Medya',
    target_rank: 'İlk 1.500',
    created_at: '2026-08-20T14:30:00.000Z',
    notes_by_admin: 'Yeni kayıt başvurusu, admin onayı bekliyor.',
  },
];

class UsersService {
  private getStoredUsers(): UserAccount[] {
    const list = cloudStorage.getItem<UserAccount[]>(USERS_STORAGE_KEY, DEFAULT_USERS);
    // Ensure default accounts always have 190707 as password
    const defaultEmails = ['admin@karne.app', 'koc@karne.app', 'ogrenci@karne.app'];
    let changed = false;
    list.forEach((u) => {
      if (defaultEmails.includes(u.email.toLowerCase()) && u.password !== '190707') {
        u.password = '190707';
        changed = true;
      }
    });
    if (changed) {
      cloudStorage.setItem<UserAccount[]>(USERS_STORAGE_KEY, list);
    }
    return list;
  }

  private saveUsers(users: UserAccount[]): void {
    cloudStorage.setItem<UserAccount[]>(USERS_STORAGE_KEY, users);
  }

  public async getAllUsers(): Promise<UserAccount[]> {
    return this.getStoredUsers();
  }

  public async getUserById(id: string): Promise<UserAccount | null> {
    const list = this.getStoredUsers();
    return list.find((u) => u.id === id) || null;
  }

  public async getUserByEmail(email: string): Promise<UserAccount | null> {
    const normalized = email.trim().toLowerCase();
    const list = this.getStoredUsers();
    
    // Exact match or known aliases
    const found = list.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      if (uEmail === normalized) return true;
      if (normalized === 'admin@karne.com' && uEmail === 'admin@karne.app') return true;
      if (normalized === 'selin@karne.app' && uEmail === 'koc@karne.app') return true;
      if (normalized === 'demir@karne.app' && uEmail === 'ogrenci@karne.app') return true;
      return false;
    });

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
    autoActivate?: boolean;
  }): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const existing = await this.getUserByEmail(data.email);
    if (existing) {
      throw new Error('Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır.');
    }

    const isAutoActive = data.autoActivate !== false; // Default to active for seamless manual signup

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
      created_at: new Date().toISOString(),
      approval_date: isAutoActive ? new Date().toISOString() : undefined,
      notes_by_admin: isAutoActive ? 'Manuel kayıt ile doğrudan aktifleştirildi.' : 'Yeni kayıt başvurusu (Admin Onayı Bekliyor)',
    };

    list.unshift(newUser);
    this.saveUsers(list);

    if (newUser.role === 'student' && newUser.status === 'active') {
      try {
        await coachService.syncStudentFromUser(newUser);
      } catch (e) {
        console.warn('Coach student sync error on register:', e);
      }
    }

    return newUser;
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
    return user;
  }

  public async updateUserProfile(userId: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const user = list.find((u) => u.id === userId);
    if (!user) throw new Error('Kullanıcı bulunamadı');

    Object.assign(user, updates);
    this.saveUsers(list);
    return user;
  }

  public async deleteUser(userId: string): Promise<void> {
    const list = this.getStoredUsers().filter((u) => u.id !== userId);
    this.saveUsers(list);
  }

  public async assignCoachToStudent(studentId: string, coachId: string): Promise<UserAccount> {
    const list = this.getStoredUsers();
    const student = list.find((u) => u.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    student.assigned_coach_id = coachId;
    this.saveUsers(list);
    return student;
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
