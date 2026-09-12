import { cloudStorage } from './cloudStorage';
import { examsService } from './examsService';
import { studySessionsService } from './studySessionsService';
import { wrongQuestionsService } from './wrongQuestionsService';
import { usersService } from './usersService';
import { Exam, StudySession, WrongQuestion } from '../types';

export interface CustomGoal {
  id: string;
  title: string;
  category: 'deneme' | 'soru' | 'konu' | 'sure';
  targetValue: string;
  currentValue: string;
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
  tag: string;
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
  assigned_coach_id?: string;
  linkedAt: string;
  customGoals: CustomGoal[];
  notes: CoachNote[];
}

const STORAGE_KEY = 'karne_coach_students_v4';

class CoachService {
  private getStoredStudents(): CoachStudent[] {
    return cloudStorage.getItem<CoachStudent[]>(STORAGE_KEY, []);
  }

  private saveStudents(students: CoachStudent[]): void {
    cloudStorage.setItem<CoachStudent[]>(STORAGE_KEY, students);
  }

  // Check if a student is assigned to a specific coach
  public isStudentAssignedToCoach(
    studentUser: { assigned_coach_id?: string | null; coach_code?: string },
    coachId?: string,
    coachCode?: string
  ): boolean {
    if (!coachId && !coachCode) return false;
    if (coachId && studentUser.assigned_coach_id === coachId) return true;
    if (
      coachCode &&
      studentUser.coach_code &&
      studentUser.coach_code.trim().toUpperCase() === coachCode.trim().toUpperCase()
    ) {
      return true;
    }
    return false;
  }

  // Get only students assigned to the given coach (or all for admin)
  public async getStudents(
    coachId?: string,
    coachCode?: string,
    isAdmin: boolean = false
  ): Promise<CoachStudent[]> {
    const allUsers = await usersService.getAllUsers();
    const storedList = this.getStoredStudents();

    // Filter real student accounts
    const studentUsers = allUsers.filter((u) => u.role === 'student');

    // Filter by authorization: coach only sees students who registered with their code or are assigned to them
    const authorizedUsers = studentUsers.filter((stu) => {
      if (isAdmin) return true;
      if (!coachId && !coachCode) return false;

      // Check user record
      if (coachId && stu.assigned_coach_id === coachId) return true;
      if (
        coachCode &&
        stu.coach_code &&
        stu.coach_code.trim().toUpperCase() === coachCode.trim().toUpperCase()
      ) {
        return true;
      }

      // Check stored student metadata
      const stored = storedList.find((s) => s.id === stu.id);
      if (stored) {
        if (coachId && stored.assigned_coach_id === coachId) return true;
        if (
          coachCode &&
          stored.inviteCodeUsed &&
          stored.inviteCodeUsed.trim().toUpperCase() === coachCode.trim().toUpperCase()
        ) {
          return true;
        }
      }

      return false;
    });

    // Populate each student with their REAL metrics (no demo/mock numbers)
    const result: CoachStudent[] = await Promise.all(
      authorizedUsers.map(async (u) => {
        const stored = storedList.find((s) => s.id === u.id);

        // Fetch real exam data
        const exams = await examsService.getExams(u.id);
        const tytExams = exams.filter((e) => e.exam_type === 'TYT');
        const aytExams = exams.filter((e) => e.exam_type === 'AYT');

        const latestTyt = tytExams.length > 0 ? examsService.calculateTotalNet(tytExams[0]) : 0;
        const latestAyt = aytExams.length > 0 ? examsService.calculateTotalNet(aytExams[0]) : 0;

        // Fetch real study sessions for this week
        const sessions = await studySessionsService.getSessions(u.id);
        const weekStats = studySessionsService.getCurrentWeekStats(sessions);
        const completedHours = Number(((weekStats.totalMinutes || 0) / 60).toFixed(1));

        return {
          id: u.id,
          name: u.full_name || 'Kayıtlı Öğrenci',
          email: u.email,
          avatarColor: stored?.avatarColor || 'bg-[#255A8A]',
          field: (u.field as any) || stored?.field || 'SAY',
          targetUniversity: u.target_university || stored?.targetUniversity || '',
          targetDepartment: u.target_department || stored?.targetDepartment || '',
          targetRank: u.target_rank || stored?.targetRank || '',
          currentNetTYT: latestTyt,
          targetNetTYT: stored?.targetNetTYT || 0,
          currentNetAYT: latestAyt,
          targetNetAYT: stored?.targetNetAYT || 0,
          weeklyStudyGoalHours: stored?.weeklyStudyGoalHours || 25,
          weeklyStudyCompletedHours: completedHours,
          status: u.status === 'active' ? 'approved' : 'pending',
          inviteCodeUsed: u.coach_code || stored?.inviteCodeUsed || coachCode || '',
          assigned_coach_id: u.assigned_coach_id || coachId,
          linkedAt: u.created_at ? u.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          customGoals: stored?.customGoals || [],
          notes: stored?.notes || [],
        };
      })
    );

    return result;
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
    coach_code?: string;
    assigned_coach_id?: string;
  }): Promise<CoachStudent> {
    const list = this.getStoredStudents();
    const userEmail = (user.email || '').toLowerCase();
    const existing = list.find(
      (s) => s.id === user.id || (userEmail && s.email.toLowerCase() === userEmail)
    );

    if (existing) {
      existing.name = user.full_name || existing.name;
      existing.status = user.status === 'active' ? 'approved' : 'pending';
      if (user.field) existing.field = user.field;
      if (user.target_university) existing.targetUniversity = user.target_university;
      if (user.target_department) existing.targetDepartment = user.target_department;
      if (user.target_rank) existing.targetRank = user.target_rank;
      if (user.assigned_coach_id) existing.assigned_coach_id = user.assigned_coach_id;
      if (user.coach_code) existing.inviteCodeUsed = user.coach_code;
      this.saveStudents(list);
      return existing;
    }

    // Real net calculated from exams
    const exams = await examsService.getExams(user.id);
    const tytExams = exams.filter((e) => e.exam_type === 'TYT');
    const aytExams = exams.filter((e) => e.exam_type === 'AYT');
    const latestTyt = tytExams.length > 0 ? examsService.calculateTotalNet(tytExams[0]) : 0;
    const latestAyt = aytExams.length > 0 ? examsService.calculateTotalNet(aytExams[0]) : 0;

    const newStudent: CoachStudent = {
      id: user.id,
      name: user.full_name || 'Kayıtlı Öğrenci',
      email: user.email || `${user.id}@karne.app`,
      avatarColor: 'bg-[#255A8A]',
      field: user.field || 'SAY',
      targetUniversity: user.target_university || '',
      targetDepartment: user.target_department || '',
      targetRank: user.target_rank || '',
      currentNetTYT: latestTyt,
      targetNetTYT: 0,
      currentNetAYT: latestAyt,
      targetNetAYT: 0,
      weeklyStudyGoalHours: 25,
      weeklyStudyCompletedHours: 0,
      status: user.status === 'active' ? 'approved' : 'pending',
      inviteCodeUsed: user.coach_code || '',
      assigned_coach_id: user.assigned_coach_id,
      linkedAt: new Date().toISOString().split('T')[0],
      customGoals: [],
      notes: [],
    };

    list.unshift(newStudent);
    this.saveStudents(list);
    return newStudent;
  }

  public async getStudentById(
    studentId: string,
    coachId?: string,
    coachCode?: string,
    isAdmin: boolean = false
  ): Promise<CoachStudent | null> {
    const students = await this.getStudents(coachId, coachCode, isAdmin);
    return students.find((s) => s.id === studentId) || null;
  }

  public async approveStudent(studentId: string): Promise<void> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (student) {
      student.status = 'approved';
      this.saveStudents(list);
    }
  }

  public async rejectStudent(studentId: string): Promise<void> {
    const list = this.getStoredStudents().filter((s) => s.id !== studentId);
    this.saveStudents(list);
  }

  public async updateStudentTargets(
    studentId: string,
    updates: Partial<
      Pick<
        CoachStudent,
        | 'targetUniversity'
        | 'targetDepartment'
        | 'targetRank'
        | 'targetNetTYT'
        | 'targetNetAYT'
        | 'weeklyStudyGoalHours'
        | 'field'
      >
    >
  ): Promise<void> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (student) {
      Object.assign(student, updates);
      this.saveStudents(list);
    }
  }

  public async addCustomGoal(
    studentId: string,
    goal: {
      title: string;
      category: 'deneme' | 'soru' | 'konu' | 'sure';
      targetValue: string;
      deadline: string;
    }
  ): Promise<CustomGoal> {
    const list = this.getStoredStudents();
    let student = list.find((s) => s.id === studentId);
    if (!student) {
      student = {
        id: studentId,
        name: 'Öğrenci',
        email: '',
        avatarColor: 'bg-[#255A8A]',
        field: 'SAY',
        targetUniversity: '',
        targetDepartment: '',
        targetRank: '',
        currentNetTYT: 0,
        targetNetTYT: 0,
        currentNetAYT: 0,
        targetNetAYT: 0,
        weeklyStudyGoalHours: 25,
        weeklyStudyCompletedHours: 0,
        status: 'approved',
        inviteCodeUsed: '',
        linkedAt: new Date().toISOString().split('T')[0],
        customGoals: [],
        notes: [],
      };
      list.unshift(student);
    }

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

    if (!student.customGoals) student.customGoals = [];
    student.customGoals.unshift(newGoal);
    this.saveStudents(list);
    return newGoal;
  }

  public async toggleCustomGoal(studentId: string, goalId: string): Promise<void> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (student && student.customGoals) {
      const g = student.customGoals.find((item) => item.id === goalId);
      if (g) {
        g.completed = !g.completed;
        this.saveStudents(list);
      }
    }
  }

  public async deleteCustomGoal(studentId: string, goalId: string): Promise<void> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (student && student.customGoals) {
      student.customGoals = student.customGoals.filter((item) => item.id !== goalId);
      this.saveStudents(list);
    }
  }

  public async getStudentDetailedData(
    studentId: string,
    coachId?: string,
    coachCode?: string,
    isAdmin: boolean = false
  ): Promise<{
    exams: Exam[];
    studySessions: StudySession[];
    wrongQuestions: WrongQuestion[];
  }> {
    // Check authorization: Coach cannot view unassigned student
    if (!isAdmin && coachId) {
      const allUsers = await usersService.getAllUsers();
      const studentUser = allUsers.find((u) => u.id === studentId);
      const isAssigned =
        studentUser &&
        this.isStudentAssignedToCoach(studentUser, coachId, coachCode);

      if (!isAssigned) {
        return { exams: [], studySessions: [], wrongQuestions: [] };
      }
    }

    const [exams, studySessions, wrongQuestions] = await Promise.all([
      examsService.getExams(studentId),
      studySessionsService.getSessions(studentId),
      wrongQuestionsService.getQuestions(studentId),
    ]);

    return { exams, studySessions, wrongQuestions };
  }

  public async addStudentByInvite(
    inviteCode: string,
    name: string,
    field: 'SAY' | 'EA' | 'SÖZ' | 'DİL',
    targetDept: string,
    targetRank: string
  ): Promise<CoachStudent> {
    const list = this.getStoredStudents();
    const newStudent: CoachStudent = {
      id: `stu-${Date.now()}`,
      name,
      email: '',
      avatarColor: 'bg-[#0071E3]',
      field,
      targetUniversity: '',
      targetDepartment: targetDept,
      targetRank: targetRank,
      currentNetTYT: 0,
      targetNetTYT: 85,
      currentNetAYT: 0,
      targetNetAYT: 60,
      weeklyStudyGoalHours: 25,
      weeklyStudyCompletedHours: 0,
      status: 'approved',
      inviteCodeUsed: inviteCode,
      linkedAt: new Date().toISOString().split('T')[0],
      customGoals: [],
      notes: [],
    };
    list.unshift(newStudent);
    this.saveStudents(list);
    return newStudent;
  }

  public async getNotesForStudent(studentId: string, _email?: string): Promise<CoachNote[]> {
    const student = this.getStoredStudents().find((s) => s.id === studentId);
    return student?.notes || [];
  }

  public async addCoachNote(
    studentId: string,
    note: { title: string; content: string; tag: string }
  ): Promise<CoachNote> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    const newNote: CoachNote = {
      id: `cn-${Date.now()}`,
      title: note.title,
      content: note.content,
      tag: note.tag,
      date: new Date().toISOString().split('T')[0],
      author: 'Koç',
    };
    if (student) {
      if (!student.notes) student.notes = [];
      student.notes.unshift(newNote);
      this.saveStudents(list);
    }
    return newNote;
  }

  public async deleteCoachNote(studentId: string, noteId: string): Promise<void> {
    const list = this.getStoredStudents();
    const student = list.find((s) => s.id === studentId);
    if (student && student.notes) {
      student.notes = student.notes.filter((n) => n.id !== noteId);
      this.saveStudents(list);
    }
  }
}

export const coachService = new CoachService();
