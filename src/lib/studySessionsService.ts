import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { StudySession, SessionSource, TimeLogEntry, TimeLogType } from '../types';
export type { StudySession, SessionSource, TimeLogEntry, TimeLogType };

const STORAGE_KEY = 'karne_study_sessions_cache';
const TIMELOGS_STORAGE_KEY = 'karne_time_logs_cache';
const TIMER_STORAGE_KEY = 'karne_active_timer_state';
const TARGET_STORAGE_KEY = 'karne_weekly_target_minutes';

export interface ActiveTimerState {
  mode: 'study' | 'break';
  subject: string;
  topic?: string;
  startTime: number; // timestamp in ms when this mode started
  elapsedSeconds: number; // accumulated if paused
  isPaused: boolean;
  pausedAt?: number;
  // Accumulated segments in this session run
  sessionSegments?: {
    type: 'study' | 'break';
    subject?: string;
    topic?: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }[];
}

export interface DayStudyData {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0: Pazar, 1: Pazartesi ... 6: Cumartesi
  totalMinutes: number;
  sessionCount: number;
  subjectBreakdown: Record<string, number>;
}

// Generate realistic mock study sessions across the last 12 weeks for Demir Yılmaz
function generateSeedSessions(): StudySession[] {
  const sessions: StudySession[] = [];
  const subjectsList = [
    { subject: 'Matematik', topics: ['Türev & İntegral', 'Fonksiyonlar', 'Trigonometri', 'Polinomlar', 'Olasılık'] },
    { subject: 'Fizik', topics: ['Elektrik ve Manyetizma', 'Dalga Mekaniği', 'Optik', 'Basit Harmonik Hareket', 'İtme ve Momentum'] },
    { subject: 'Kimya', topics: ['Organik Kimya', 'Kimyasal Denge', 'Gazlar', 'Sulu Çözelti Dengeleri', 'Elektrokimya'] },
    { subject: 'Biyoloji', topics: ['Fotosentez ve Kemosentez', 'Kalıtım', 'Bitki Biyolojisi', 'Hücresel Solunum', 'Genden Proteine'] },
    { subject: 'Türkçe', topics: ['Paragrafta Anlam', 'Cümlede Anlam', 'Sözcükte Yapı', 'Noktalama İşaretleri'] },
    { subject: 'Geometri', topics: ['Çemberde Açı ve Uzunluk', 'Katı Cisimler', 'Analitik Geometri', 'Üçgende Alan'] },
  ];

  const now = new Date();

  // Create entries for the last 84 days (12 weeks)
  for (let daysAgo = 83; daysAgo >= 0; daysAgo--) {
    const dayDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dayOfWeek = dayDate.getDay(); // 0 is Sunday

    // Sundays or random break days might have fewer or 0 sessions
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const sessionCount = (daysAgo % 7 === 0) ? 1 : isWeekend ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 4) + 1;

    for (let s = 0; s < sessionCount; s++) {
      const subjectObj = subjectsList[(daysAgo + s) % subjectsList.length];
      const topic = subjectObj.topics[s % subjectObj.topics.length];
      const duration = [40, 50, 60, 75, 90, 110, 45, 55][(daysAgo * 3 + s) % 8];

      const startTime = new Date(dayDate);
      startTime.setHours(10 + s * 2, (s * 17) % 60, 0, 0);

      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      sessions.push({
        id: `sess-${daysAgo}-${s}`,
        student_id: 'st-demo-001',
        subject: subjectObj.subject,
        topic: topic,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: duration,
        source: (daysAgo + s) % 3 === 0 ? 'timer' : 'manual',
        created_at: startTime.toISOString(),
      });
    }
  }

  return sessions.reverse(); // Newest first
}

export const studySessionsService = {
  // Get all study sessions for a student
  async getSessions(studentId: string): Promise<StudySession[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('student_id', studentId)
          .order('start_time', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as StudySession[];
        }
      } catch (err) {
        console.warn('Supabase study_sessions fetch failed, using local cache:', err);
      }
    }

    // Local storage fallback
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as StudySession[];
        return list.filter((s) => !s.student_id || s.student_id === studentId);
      } catch {
        return [];
      }
    }

    return [];
  },

  // Add a new session
  async addSession(session: Omit<StudySession, 'id' | 'created_at'>): Promise<StudySession> {
    const newId = 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newRecord: StudySession = {
      ...session,
      id: newId,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('study_sessions')
          .insert([
            {
              student_id: session.student_id,
              subject: session.subject,
              topic: session.topic || null,
              start_time: session.start_time,
              end_time: session.end_time || null,
              duration_minutes: session.duration_minutes,
              source: session.source,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          return data as StudySession;
        }
      } catch (err) {
        console.warn('Supabase study_sessions insert error, saving locally:', err);
      }
    }

    // Update local cache
    const existing = await this.getSessions(session.student_id);
    const updated = [newRecord, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  // Delete session
  async deleteSession(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('study_sessions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete session failed:', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as StudySession[];
        const updated = list.filter((s) => s.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  },

  // Active Timer Persistence across tabs and reloads
  getActiveTimer(): ActiveTimerState | null {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as ActiveTimerState;
    } catch {
      return null;
    }
  },

  saveActiveTimer(state: ActiveTimerState | null): void {
    if (!state) {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } else {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    }
  },

  // Weekly target in minutes
  async getWeeklyTargetMinutes(studentId: string): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users_profile')
          .select('weekly_target_minutes')
          .eq('id', studentId)
          .single();

        if (!error && data?.weekly_target_minutes) {
          return data.weekly_target_minutes;
        }
      } catch (err) {
        console.warn('Failed to fetch weekly_target_minutes from Supabase:', err);
      }
    }

    const saved = localStorage.getItem(`${TARGET_STORAGE_KEY}_${studentId}`);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    return 1800; // 30 hours default
  },

  async setWeeklyTargetMinutes(studentId: string, minutes: number): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('users_profile')
          .update({ weekly_target_minutes: minutes })
          .eq('id', studentId);
      } catch (err) {
        console.warn('Failed to update weekly_target_minutes in Supabase:', err);
      }
    }

    localStorage.setItem(`${TARGET_STORAGE_KEY}_${studentId}`, minutes.toString());
  },

  // Compute Current Week's statistics (Monday 00:00 to Sunday 23:59)
  getCurrentWeekStats(sessions: StudySession[]): {
    totalMinutes: number;
    subjectMinutes: Record<string, number>;
    sessionsCount: number;
    chartData: { subject: string; minutes: number; hours: number; color: string }[];
  } {
    const now = new Date();
    // Find this week's Monday
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const monTime = monday.getTime();
    const sunTime = sunday.getTime();

    let totalMinutes = 0;
    const subjectMinutes: Record<string, number> = {};
    let sessionsCount = 0;

    for (const sess of sessions) {
      const t = new Date(sess.start_time).getTime();
      if (t >= monTime && t <= sunTime) {
        const mins = sess.duration_minutes || 0;
        totalMinutes += mins;
        sessionsCount++;
        subjectMinutes[sess.subject] = (subjectMinutes[sess.subject] || 0) + mins;
      }
    }

    const SUBJECT_COLORS: Record<string, string> = {
      Matematik: '#1B2A4A',
      Fizik: '#255A8A',
      Kimya: '#D97736',
      Biyoloji: '#2E6B4F',
      Türkçe: '#C0392B',
      Geometri: '#4A3E72',
      Tarih: '#8B5A2B',
      Coğrafya: '#3B7A57',
      Felsefe: '#6C757D',
      'Din Kültürü': '#5C6F84',
    };

    const chartData = Object.entries(subjectMinutes)
      .map(([subj, mins]) => ({
        subject: subj,
        minutes: mins,
        hours: Number((mins / 60).toFixed(1)),
        color: SUBJECT_COLORS[subj] || '#1B2A4A',
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return {
      totalMinutes,
      subjectMinutes,
      sessionsCount,
      chartData,
    };
  },

  // Compute 12-week daily contribution matrix for Heatmap
  getHeatmapData(sessions: StudySession[]): DayStudyData[] {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // 12 weeks = 84 days. Align so the last day is today, starting on a Monday 12 weeks ago
    const totalDays = 12 * 7;
    const days: DayStudyData[] = [];

    // Map sessions to YYYY-MM-DD
    const sessionsByDate: Record<string, { totalMinutes: number; count: number; subjects: Record<string, number> }> = {};

    for (const s of sessions) {
      const d = new Date(s.start_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!sessionsByDate[key]) {
        sessionsByDate[key] = { totalMinutes: 0, count: 0, subjects: {} };
      }
      sessionsByDate[key].totalMinutes += s.duration_minutes || 0;
      sessionsByDate[key].count += 1;
      sessionsByDate[key].subjects[s.subject] = (sessionsByDate[key].subjects[s.subject] || 0) + (s.duration_minutes || 0);
    }

    for (let i = totalDays - 1; i >= 0; i--) {
      const cur = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const entry = sessionsByDate[key] || { totalMinutes: 0, count: 0, subjects: {} };

      days.push({
        date: key,
        dayOfWeek: cur.getDay(), // 0 = Sunday
        totalMinutes: entry.totalMinutes,
        sessionCount: entry.count,
        subjectBreakdown: entry.subjects,
      });
    }

    return days;
  },

  // Generate realistic daily time logs (study & breaks)
  generateSeedTimeLogs(): TimeLogEntry[] {
    const logs: TimeLogEntry[] = [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Sample timetable for today:
    // 09:00 - 09:50 Matematik (50 dk)
    // 09:50 - 10:10 Kahve Molası (20 dk)
    // 10:10 - 11:00 Fizik (50 dk)
    // 11:00 - 11:15 Kısa Mola (15 dk)
    // 11:15 - 12:00 Geometri (45 dk)
    // 12:00 - 13:00 Öğle Yemeği & Dinlenme Molası (60 dk)
    // 13:00 - 14:15 Kimya (75 dk)
    // 14:15 - 14:35 Çay Molası (20 dk)
    // 14:35 - 15:30 Biyoloji (55 dk)

    const schedule = [
      { type: 'study' as const, subject: 'Matematik', topic: 'Türev & Ekstremum Noktalar', startH: 9, startM: 0, dur: 50 },
      { type: 'break' as const, note: 'Kahve & Zihin Dinlendirme', startH: 9, startM: 50, dur: 20 },
      { type: 'study' as const, subject: 'Fizik', topic: 'Elektrik & Manyetizma', startH: 10, startM: 10, dur: 50 },
      { type: 'break' as const, note: 'Kısa Yürüyüş & Su Molası', startH: 11, startM: 0, dur: 15 },
      { type: 'study' as const, subject: 'Geometri', topic: 'Çemberde Açı', startH: 11, startM: 15, dur: 45 },
      { type: 'break' as const, note: 'Öğle Yemeği & Dinlenme', startH: 12, startM: 0, dur: 60 },
      { type: 'study' as const, subject: 'Kimya', topic: 'Organik Kimya Giriş', startH: 13, startM: 0, dur: 75 },
      { type: 'break' as const, note: 'Hava Alma Molası', startH: 14, startM: 15, dur: 20 },
      { type: 'study' as const, subject: 'Biyoloji', topic: 'Fotosentez & Solunum', startH: 14, startM: 35, dur: 55 },
    ];

    schedule.forEach((item, idx) => {
      const st = new Date(now);
      st.setHours(item.startH, item.startM, 0, 0);
      const et = new Date(st.getTime() + item.dur * 60000);

      logs.push({
        id: `tlog-today-${idx}`,
        student_id: 'st-demo-001',
        type: item.type,
        subject: item.subject,
        topic: item.topic,
        start_time: st.toISOString(),
        end_time: et.toISOString(),
        duration_minutes: item.dur,
        note: item.note,
        created_at: st.toISOString(),
      });
    });

    return logs;
  },

  // Get daily study & break time logs
  async getTimeLogs(studentId: string, targetDateStr?: string): Promise<TimeLogEntry[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('time_logs')
          .select('*')
          .eq('student_id', studentId)
          .order('start_time', { ascending: true });

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          let list = data as TimeLogEntry[];
          if (targetDateStr) {
            list = list.filter((l) => l.start_time.startsWith(targetDateStr));
          }
          return list;
        }
      } catch (err) {
        console.warn('Failed to fetch time_logs from Supabase:', err);
      }
    }

    const saved = localStorage.getItem(TIMELOGS_STORAGE_KEY);
    let allLogs: TimeLogEntry[] = [];
    if (saved) {
      try {
        allLogs = JSON.parse(saved) as TimeLogEntry[];
      } catch {
        allLogs = [];
      }
    }

    if (targetDateStr) {
      return allLogs.filter((l) => l.start_time.startsWith(targetDateStr));
    }

    return allLogs;
  },

  // Add time log entry (study or break)
  async addTimeLog(entry: Omit<TimeLogEntry, 'id' | 'created_at'>): Promise<TimeLogEntry> {
    const newId = 'tlog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newRecord: TimeLogEntry = {
      ...entry,
      id: newId,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('time_logs')
          .insert([
            {
              student_id: entry.student_id,
              type: entry.type,
              subject: entry.subject || null,
              topic: entry.topic || null,
              start_time: entry.start_time,
              end_time: entry.end_time,
              duration_minutes: entry.duration_minutes,
              note: entry.note || null,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          return data as TimeLogEntry;
        }
      } catch (err) {
        console.warn('Failed to insert time log into Supabase:', err);
      }
    }

    const all = await this.getTimeLogs(entry.student_id);
    const updated = [...all, newRecord];
    localStorage.setItem(TIMELOGS_STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  // Delete time log entry
  async deleteTimeLog(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('time_logs').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete time log failed:', err);
      }
    }

    const saved = localStorage.getItem(TIMELOGS_STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as TimeLogEntry[];
        const updated = list.filter((l) => l.id !== id);
        localStorage.setItem(TIMELOGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  },
};
