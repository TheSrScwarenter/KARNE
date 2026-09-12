/**
 * XP & Gamification Settings Service
 * Manages study minute XP multipliers, streak bonuses, session bonuses, and student XP resets.
 */

export interface XPSettings {
  xpPerStudyMinute: number;
  xpPerStreakDay: number;
  sessionCompletionBonus: number;
  goalCompletionBonus: number;
  levelUpBaseXP: number;
  rulesDescription: string;
  updatedAt: string;
}

const XP_SETTINGS_STORAGE_KEY = 'studii_system_xp_settings_v1';
const XP_RESET_RECORDS_KEY = 'studii_students_xp_reset_records_v1';

export const DEFAULT_XP_SETTINGS: XPSettings = {
  xpPerStudyMinute: 2,
  xpPerStreakDay: 25,
  sessionCompletionBonus: 50,
  goalCompletionBonus: 100,
  levelUpBaseXP: 400,
  rulesDescription:
    'Odak oturumunda her çalışma dakikası için 2 XP kazanılır. 7+ gün seri günlerinde günlük ekstra 25 XP bonus ve oturum hedefini tamamlama halinde +100 XP eklenir.',
  updatedAt: new Date().toISOString(),
};

class XPSettingsService {
  public getXPSettings(): XPSettings {
    try {
      const raw = localStorage.getItem(XP_SETTINGS_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_XP_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {}
    return DEFAULT_XP_SETTINGS;
  }

  public async fetchXPSettings(): Promise<XPSettings> {
    try {
      const res = await fetch('/api/system-xp-settings');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const merged = { ...DEFAULT_XP_SETTINGS, ...data };
          localStorage.setItem(XP_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('studii-xp-settings-updated', { detail: merged }));
          }
          return merged;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch XP settings from server:', err);
    }
    return this.getXPSettings();
  }

  public async updateXPSettings(updates: Partial<XPSettings>): Promise<XPSettings> {
    const current = this.getXPSettings();
    const updated: XPSettings = {
      ...current,
      ...updates,
      xpPerStudyMinute: Math.max(1, Math.min(50, Number(updates.xpPerStudyMinute) || current.xpPerStudyMinute)),
      xpPerStreakDay: Math.max(0, Math.min(500, Number(updates.xpPerStreakDay) ?? current.xpPerStreakDay)),
      sessionCompletionBonus: Math.max(0, Math.min(1000, Number(updates.sessionCompletionBonus) ?? current.sessionCompletionBonus)),
      goalCompletionBonus: Math.max(0, Math.min(2000, Number(updates.goalCompletionBonus) ?? current.goalCompletionBonus)),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(XP_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studii-xp-settings-updated', { detail: updated }));
    }

    try {
      await fetch('/api/system-xp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.warn('Failed to post XP settings to server:', err);
    }

    return updated;
  }

  public getResetRecords(): Record<string, { resetAt: string; previousXP?: number }> {
    try {
      const raw = localStorage.getItem(XP_RESET_RECORDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }

  public isStudentXPReset(studentId: string): boolean {
    const records = this.getResetRecords();
    return Boolean(records[studentId] || records['ALL_STUDENTS']);
  }

  public async resetStudentXP(studentId: string, currentTotalXP?: number): Promise<void> {
    // 1. Clear local focus bonus XP
    try {
      localStorage.removeItem(`user_focus_bonus_xp_${studentId}`);
      localStorage.removeItem(`karne_user_badges_overrides_v1_${studentId}`);
    } catch {}

    // 2. Mark reset in records
    const records = this.getResetRecords();
    records[studentId] = {
      resetAt: new Date().toISOString(),
      previousXP: currentTotalXP,
    };
    localStorage.setItem(XP_RESET_RECORDS_KEY, JSON.stringify(records));

    // 3. Notify server
    try {
      await fetch('/api/system-xp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStudentId: studentId, resetAll: false }),
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('studii-xp-reset-occurred', { detail: { studentId } })
      );
    }
  }

  public async resetAllStudentsXP(studentIds: string[] = []): Promise<void> {
    // 1. Clear local keys for known students
    studentIds.forEach((id) => {
      try {
        localStorage.removeItem(`user_focus_bonus_xp_${id}`);
        localStorage.removeItem(`karne_user_badges_overrides_v1_${id}`);
      } catch {}
    });

    const records = this.getResetRecords();
    records['ALL_STUDENTS'] = { resetAt: new Date().toISOString() };
    localStorage.setItem(XP_RESET_RECORDS_KEY, JSON.stringify(records));

    try {
      await fetch('/api/system-xp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetAll: true }),
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('studii-xp-reset-occurred', { detail: { resetAll: true } })
      );
    }
  }
}

export const xpSettingsService = new XPSettingsService();
