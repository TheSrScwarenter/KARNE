import { cloudStorage } from './cloudStorage';
import { examsService } from './examsService';
import { studySessionsService } from './studySessionsService';
import { wrongQuestionsService } from './wrongQuestionsService';
import { Exam, StudySession, WrongQuestion } from '../types';

export interface CustomGoal {
  id: string;
  title: string;
  category: 'deneme' | 'soru' | 'konu' | 'sure';
  targetValue: string;
  currentValue?: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

export interface CoachNote {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  tag?: string;
}

export interface CoachStudent {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  field: 'SAY' | 'EA' | 'SÖZ' | 'DİL';
  targetUniversity: string;
  targetDepartment: string;
  targetRank: string;
  currentNetTYT: number;
  targetNetTYT: number;
  currentNetAYT: number;
  targetNetAYT: number;
  weeklyStudyGoalHours: number;
  weeklyStudyCompletedHours: number;
  status: 'approved' | 'pending';
  inviteCodeUsed: string;
  linkedAt: string;
  customGoals: CustomGoal[];
  notes: CoachNote[];
}

const STORAGE_KEY = 'karne_coach_students_v1';

const DEFAULT_STUDENTS: CoachStudent[] = [];

class CoachService {
  private getStoredStudents(): CoachStudent[] {
    return cloudStorage.getItem<CoachStudent[]>(STORAGE_KEY, DEFAULT_STUDENTS);
  }

  private saveStudents(students: CoachStudent[]): void {
    cloudStorage.setItem<CoachStudent[]>(STORAGE_KEY, students);
  }

  public async getStudents(): Promise<CoachStudent[]> {
    return this.getStoredStudents();
  }

  public async syncStudentFromUser(user: {
    id: string;
    full_name?: string;
    email?: string;
    field?: 'SAY' | 'EA' | 'SÖZ' | 'DİL';
    target_university?: string;
    target_department?: string;
    target_rank?: string;
    status?: string;
  }): Promise<CoachStudent> {
    const list = this.getStoredStudents();
    const userEmail = (user.email || '').toLowerCase();
    const existing = list.find((s) => s.id === user.id || (userEmail && s.email.toLowerCase() === userEmail));
    if (existing) {
      existing.name = user.full_name || existing.name;
      existing.status = user.status === 'active' ? 'approved' : 'pending';
      if (user.field) existing.field = user.field;
      if (user.target_university) existing.targetUniversity = user.target_university;
      if (user.target_department) existing.targetDepartment = user.target_department;
      if (user.target_rank) existing.targetRank = user.target_rank;
      this.saveStudents(list);
      return existing;
    }

    const newStudent: CoachStudent = {
      id: user.id,
      name: user.full_name || 'Kayıtlı Öğrenci',
      email: user.email || `${user.id}@karne.app`,
      avatarColor: 'bg-[#255A8A]',
      field: user.field || 'SAY',
      targetUniversity: user.target_university || 'Hedef Üniversite',
      targetDepartment: user.target_department || 'Hedef Bölüm',
      targetRank: user.target_rank || 'İlk 10.000',
      currentNetTYT: 75.0,
      targetNetTYT: 95.0,
      currentNetAYT: 45.0,
      targetNetAYT: 70.0,
      weeklyStudyGoalHours: 30,
      weeklyStudyCompletedHours: 0,
      status: user.status === 'active' ? 'approved' : 'pending',
      inviteCodeUsed: 'ADMIN-SYNC',
      linkedAt: new Date().toISOString().split('T')[0],
      customGoals: [
        {
          id: `cg-${Date.now()}-1`,
          title: 'İlk TYT & AYT Deneme Analizini Tamamla',
          category: 'deneme',
          targetValue: '1 Deneme',
          currentValue: '0',
          deadline: 'Gelecek Hafta',
          completed: false,
          createdAt: new Date().toISOString().split('T')[0],
        },
      ],
      notes: [
        {
          id: `cn-${Date.now()}-1`,
          title: 'Sistem Kaydı Onaylandı',
          content: `${user.full_name || user.email} sisteme başarıyla katıldı ve koçluk takibine eklendi.`,
          date: new Date().toISOString().split('T')[0],
          author: 'Sistem Yöneticisi',
          tag: 'Kayıt',
        },
      ],
    };

    list.unshift(newStudent);
    this.saveStudents(list);
    return newStudent;
  }

  public async getStudentById(studentId: string): Promise<CoachStudent | null> {
    const list = this.getStoredStudents();
    return list.find((s) => s.id === studentId) || null;
  }

  public async approveStudent(studentId: string): Promise<CoachStudent> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    student.status = 'approved';
    this.saveStudents(list);
    return student;
  }

  public async rejectStudent(studentId: string): Promise<void> {
    const list = this.getStoredStudents().filter((s) => s.id !== studentId);
    this.saveStudents(list);
  }

  public async addStudentByInvite(
    inviteCode: string,
    name: string,
    field: 'SAY' | 'EA' | 'SÖZ' | 'DİL' = 'SAY',
    targetDepartment: string = 'Mühendislik / Tıp',
    targetRank: string = 'İlk 10.000'
  ): Promise<CoachStudent> {
    const list = this.getStoredStudents();
    const newStudent: CoachStudent = {
      id: `st-${Date.now()}`,
      name: name.trim() || 'Yeni Öğrenci',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@ogrenci.com`,
      avatarColor: 'bg-[#255A8A]',
      field,
      targetUniversity: 'Hedef Üniversite',
      targetDepartment,
      targetRank,
      currentNetTYT: 65.0,
      targetNetTYT: 95.0,
      currentNetAYT: 35.0,
      targetNetAYT: 65.0,
      weeklyStudyGoalHours: 25,
      weeklyStudyCompletedHours: 0,
      status: 'approved',
      inviteCodeUsed: inviteCode,
      linkedAt: new Date().toISOString().split('T')[0],
      customGoals: [
        {
          id: `cg-${Date.now()}-1`,
          title: 'Temel Seviye TYT Deneme Analizi Yap',
          category: 'deneme',
          targetValue: '1 Deneme',
          currentValue: '0',
          deadline: 'Gelecek Hafta',
          completed: false,
          createdAt: new Date().toISOString().split('T')[0],
        },
      ],
      notes: [
        {
          id: `cn-${Date.now()}-1`,
          title: 'Koçluk Başlangıcı & İlk Değerlendirme',
          content: `${name} davet koduyla başarıyla eklendi. Hedef: ${targetDepartment} (${targetRank}).`,
          date: new Date().toISOString().split('T')[0],
          author: 'Koç',
          tag: 'Başlangıç',
        },
      ],
    };

    list.unshift(newStudent);
    this.saveStudents(list);
    return newStudent;
  }

  public async updateStudentTargets(
    studentId: string,
    updates: Partial<Pick<CoachStudent, 'targetUniversity' | 'targetDepartment' | 'targetRank' | 'targetNetTYT' | 'targetNetAYT' | 'weeklyStudyGoalHours' | 'field'>>
  ): Promise<CoachStudent> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    Object.assign(student, updates);
    this.saveStudents(list);
    return student;
  }

  public async addCustomGoal(
    studentId: string,
    goal: { title: string; category: 'deneme' | 'soru' | 'konu' | 'sure'; targetValue: string; deadline: string }
  ): Promise<CustomGoal> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    const newGoal: CustomGoal = {
      id: `cg-${Date.now()}`,
      title: goal.title,
      category: goal.category,
      targetValue: goal.targetValue,
      currentValue: 'Başlandı',
      deadline: goal.deadline,
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    student.customGoals.unshift(newGoal);
    this.saveStudents(list);
    return newGoal;
  }

  public async toggleCustomGoal(studentId: string, goalId: string): Promise<void> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    const g = student.customGoals.find((item) => item.id === goalId);
    if (g) {
      g.completed = !g.completed;
      this.saveStudents(list);
    }
  }

  public async deleteCustomGoal(studentId: string, goalId: string): Promise<void> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    student.customGoals = student.customGoals.filter((item) => item.id !== goalId);
    this.saveStudents(list);
  }

  public async addCoachNote(
    studentId: string,
    note: { title: string; content: string; tag?: string }
  ): Promise<CoachNote> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    const newNote: CoachNote = {
      id: `cn-${Date.now()}`,
      title: note.title,
      content: note.content,
      date: new Date().toISOString().split('T')[0],
      author: 'Koç & Rehberlik',
      tag: note.tag || 'Değerlendirme',
    };

    student.notes.unshift(newNote);
    this.saveStudents(list);
    return newNote;
  }

  public async deleteCoachNote(studentId: string, noteId: string): Promise<void> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    student.notes = student.notes.filter((item) => item.id !== noteId);
    this.saveStudents(list);
  }

  public async getNotesForStudent(studentId: string, email?: string): Promise<CoachNote[]> {
    const list = this.getStoredStudents();
    const userEmail = (email || '').toLowerCase();
    const student = list.find((s) => s.id === studentId || (userEmail && s.email.toLowerCase() === userEmail));
    return student ? student.notes || [] : [];
  }

  public async getStudentDetailedData(studentId: string): Promise<{
    exams: Exam[];
    studySessions: StudySession[];
    wrongQuestions: WrongQuestion[];
  }> {
    // Return student activity; if it's the active demo student, fetch from central service
    const [exams, studySessions, wrongQuestions] = await Promise.all([
      examsService.getExams(studentId),
      studySessionsService.getSessions(studentId),
      wrongQuestionsService.getQuestions(studentId),
    ]);

    return { exams, studySessions, wrongQuestions };
  }
}

export const coachService = new CoachService();
