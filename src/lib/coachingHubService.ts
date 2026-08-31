import { cloudStorage } from './cloudStorage';
import {
  CoachingMessage,
  CoachingAppointment,
  CoachingTask,
  TaskStatus,
  AppointmentStatus,
} from '../types';

const MESSAGES_STORAGE_KEY = 'karne_coaching_messages_v1';
const APPOINTMENTS_STORAGE_KEY = 'karne_coaching_appointments_v1';
const TASKS_STORAGE_KEY = 'karne_coaching_tasks_v1';

class CoachingHubService {
  // ---------------------------------------------------------------------------
  // 1. MESSAGING & QUESTION SOLVING
  // ---------------------------------------------------------------------------
  public async getMessages(studentId: string): Promise<CoachingMessage[]> {
    const list = cloudStorage.getItem<CoachingMessage[]>(MESSAGES_STORAGE_KEY, []);
    return list
      .filter((m) => m.student_id === studentId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public async sendMessage(message: Omit<CoachingMessage, 'id' | 'created_at' | 'is_read'>): Promise<CoachingMessage> {
    const list = cloudStorage.getItem<CoachingMessage[]>(MESSAGES_STORAGE_KEY, []);
    const newMsg: CoachingMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    list.push(newMsg);
    cloudStorage.setItem(MESSAGES_STORAGE_KEY, list);
    return newMsg;
  }

  public async markMessagesAsRead(studentId: string, currentUserId: string): Promise<void> {
    const list = cloudStorage.getItem<CoachingMessage[]>(MESSAGES_STORAGE_KEY, []);
    const updated = list.map((m) => {
      if (m.student_id === studentId && m.receiver_id === currentUserId) {
        return { ...m, is_read: true };
      }
      return m;
    });
    cloudStorage.setItem(MESSAGES_STORAGE_KEY, updated);
  }

  // ---------------------------------------------------------------------------
  // 2. APPOINTMENTS & CALENDAR
  // ---------------------------------------------------------------------------
  public async getAppointments(studentId?: string, coachId?: string): Promise<CoachingAppointment[]> {
    const list = cloudStorage.getItem<CoachingAppointment[]>(APPOINTMENTS_STORAGE_KEY, []);
    return list.sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.start_time}`).getTime();
      const dateB = new Date(`${b.appointment_date}T${b.start_time}`).getTime();
      return dateA - dateB;
    });
  }

  public async bookAppointment(appointmentId: string, studentId: string, studentName: string, note?: string): Promise<CoachingAppointment> {
    const list = cloudStorage.getItem<CoachingAppointment[]>(APPOINTMENTS_STORAGE_KEY, []);
    const idx = list.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new Error('Randevu bulunamadı.');

    list[idx] = {
      ...list[idx],
      student_id: studentId,
      student_name: studentName,
      status: 'booked',
      student_note: note || list[idx].student_note,
      updated_at: new Date().toISOString(),
    };
    cloudStorage.setItem(APPOINTMENTS_STORAGE_KEY, list);
    return list[idx];
  }

  public async cancelAppointment(appointmentId: string): Promise<void> {
    const list = cloudStorage.getItem<CoachingAppointment[]>(APPOINTMENTS_STORAGE_KEY, []);
    const idx = list.findIndex((a) => a.id === appointmentId);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        student_id: null,
        student_name: null,
        status: 'available',
        student_note: null,
        updated_at: new Date().toISOString(),
      };
      cloudStorage.setItem(APPOINTMENTS_STORAGE_KEY, list);
    }
  }

  public async createAppointmentSlot(appointment: Omit<CoachingAppointment, 'id' | 'created_at' | 'updated_at'>): Promise<CoachingAppointment> {
    const list = cloudStorage.getItem<CoachingAppointment[]>(APPOINTMENTS_STORAGE_KEY, []);
    const newApp: CoachingAppointment = {
      ...appointment,
      id: `app-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newApp);
    cloudStorage.setItem(APPOINTMENTS_STORAGE_KEY, list);
    return newApp;
  }

  // ---------------------------------------------------------------------------
  // 3. TASKS & HOMEWORK ASSIGNMENTS
  // ---------------------------------------------------------------------------
  public async getTasks(studentId: string): Promise<CoachingTask[]> {
    const list = cloudStorage.getItem<CoachingTask[]>(TASKS_STORAGE_KEY, []);
    return list
      .filter((t) => t.student_id === studentId)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }

  public async updateTaskStatus(taskId: string, status: TaskStatus, notes?: string): Promise<CoachingTask> {
    const list = cloudStorage.getItem<CoachingTask[]>(TASKS_STORAGE_KEY, []);
    const idx = list.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('Görev bulunamadı.');

    list[idx] = {
      ...list[idx],
      status,
      completion_notes: notes !== undefined ? notes : list[idx].completion_notes,
      completed_at: status === 'completed' || status === 'verified' ? new Date().toISOString() : list[idx].completed_at,
      updated_at: new Date().toISOString(),
    };
    cloudStorage.setItem(TASKS_STORAGE_KEY, list);
    return list[idx];
  }

  public async createTask(task: Omit<CoachingTask, 'id' | 'created_at' | 'updated_at'>): Promise<CoachingTask> {
    const list = cloudStorage.getItem<CoachingTask[]>(TASKS_STORAGE_KEY, []);
    const newTask: CoachingTask = {
      ...task,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newTask);
    cloudStorage.setItem(TASKS_STORAGE_KEY, list);
    return newTask;
  }
}

export const coachingHubService = new CoachingHubService();
