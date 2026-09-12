/**
 * Admin System Management Service
 * Provides system broadcast announcements, registration policy, audit logs, and data exports.
 */

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isActive: boolean;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  target?: string;
  adminName: string;
  timestamp: string;
  details?: string;
}

const ANNOUNCEMENT_KEY = 'studii_system_announcement';
const POLICY_KEY = 'studii_registration_policy';
const AUDIT_LOGS_KEY = 'studii_admin_audit_logs';

const announcementChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('studii_announcement_channel')
    : null;

if (announcementChannel) {
  announcementChannel.onmessage = (event) => {
    if (event.data?.type === 'announcement_updated' && event.data.payload) {
      try {
        localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(event.data.payload));
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('studii-announcement-updated', { detail: event.data.payload })
        );
      }
    }
  };
}

export const adminSystemService = {
  getAnnouncement(): SystemAnnouncement | null {
    try {
      const stored = localStorage.getItem(ANNOUNCEMENT_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      id: 'default-announcement',
      title: 'studii YKS 2026 Platformuna Hoş Geldiniz',
      message: 'Haftalık programınızı ve yanlış soru bankanızı düzenli takip ederek hedefinize bir adım daha yaklaşın!',
      type: 'info',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  },

  async fetchAnnouncement(): Promise<SystemAnnouncement | null> {
    try {
      const res = await fetch('/api/system-announcement');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(data));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('studii-announcement-updated', { detail: data })
            );
          }
          return data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch announcement from server:', err);
    }
    return this.getAnnouncement();
  },

  async saveAnnouncement(announcement: SystemAnnouncement): Promise<void> {
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcement));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studii-announcement-updated', { detail: announcement }));
    }
    if (announcementChannel) {
      try {
        announcementChannel.postMessage({ type: 'announcement_updated', payload: announcement });
      } catch {}
    }

    try {
      await fetch('/api/system-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement),
      });
    } catch (err) {
      console.warn('Failed to save announcement to server:', err);
    }
  },

  async clearAnnouncement(): Promise<void> {
    const defaultAnn: SystemAnnouncement = {
      id: 'cleared',
      title: '',
      message: '',
      type: 'info',
      isActive: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(defaultAnn));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studii-announcement-updated', { detail: defaultAnn }));
    }
    if (announcementChannel) {
      try {
        announcementChannel.postMessage({ type: 'announcement_updated', payload: defaultAnn });
      } catch {}
    }

    try {
      await fetch('/api/system-announcement', { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to delete announcement from server:', err);
    }
  },

  getRequiresApproval(): boolean {
    try {
      const val = localStorage.getItem(POLICY_KEY);
      if (val !== null) return val === 'true';
    } catch {}
    return true; // Default to true: admin approval required
  },

  setRequiresApproval(required: boolean): void {
    localStorage.setItem(POLICY_KEY, String(required));
  },

  getAuditLogs(): AdminAuditLog[] {
    try {
      const stored = localStorage.getItem(AUDIT_LOGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      {
        id: 'log-1',
        action: 'Sistem Başlatıldı',
        adminName: 'Sistem Yöneticisi',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: 'studii YKS v0.8 BETA Yönetici Paneli hazırlandı.',
      },
    ];
  },

  addAuditLog(action: string, target?: string, details?: string, adminName = 'Yönetici'): void {
    try {
      const logs = this.getAuditLogs();
      const newLog: AdminAuditLog = {
        id: 'log-' + Date.now(),
        action,
        target,
        adminName,
        timestamp: new Date().toISOString(),
        details,
      };
      const updated = [newLog, ...logs].slice(0, 100);
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
    } catch {}
  },
};
