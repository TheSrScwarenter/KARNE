import React, { useState, useEffect } from 'react';
import { adminSystemService, SystemAnnouncement } from '../../lib/adminSystemService';
import { Bell, AlertTriangle, CheckCircle2, AlertOctagon, X, Sparkles } from 'lucide-react';

const DISMISSED_KEY_PREFIX = 'studii_dismissed_ann_';

export const SystemAnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(() => {
    return adminSystemService.getAnnouncement();
  });
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Initial fetch from server
    adminSystemService.fetchAnnouncement().then((ann) => {
      if (ann) {
        setAnnouncement(ann);
        checkDismissed(ann.id);
      }
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SystemAnnouncement>;
      if (customEvent.detail) {
        setAnnouncement(customEvent.detail);
        checkDismissed(customEvent.detail.id);
      }
    };

    window.addEventListener('studii-announcement-updated', handleUpdate);
    return () => {
      window.removeEventListener('studii-announcement-updated', handleUpdate);
    };
  }, []);

  const checkDismissed = (annId: string) => {
    try {
      const dismissed = sessionStorage.getItem(`${DISMISSED_KEY_PREFIX}${annId}`);
      setIsDismissed(dismissed === 'true');
    } catch {
      setIsDismissed(false);
    }
  };

  const handleDismiss = () => {
    if (!announcement) return;
    try {
      sessionStorage.setItem(`${DISMISSED_KEY_PREFIX}${announcement.id}`, 'true');
    } catch {}
    setIsDismissed(true);
  };

  if (!announcement || !announcement.isActive || isDismissed) {
    return null;
  }

  // Type styling
  const typeConfig = {
    info: {
      bg: 'bg-[#0071E3]/10 border-[#0071E3]/20 text-[#0071E3]',
      cardBg: 'bg-white',
      badgeBg: 'bg-[#0071E3] text-white',
      icon: Bell,
      indicator: 'bg-[#0071E3]',
    },
    warning: {
      bg: 'bg-[#D97736]/10 border-[#D97736]/25 text-[#D97736]',
      cardBg: 'bg-white',
      badgeBg: 'bg-[#D97736] text-white',
      icon: AlertTriangle,
      indicator: 'bg-[#D97736]',
    },
    success: {
      bg: 'bg-[#2E6B4F]/10 border-[#2E6B4F]/25 text-[#2E6B4F]',
      cardBg: 'bg-white',
      badgeBg: 'bg-[#2E6B4F] text-white',
      icon: CheckCircle2,
      indicator: 'bg-[#2E6B4F]',
    },
    alert: {
      bg: 'bg-[#D9534F]/10 border-[#D9534F]/25 text-[#D9534F]',
      cardBg: 'bg-white',
      badgeBg: 'bg-[#D9534F] text-white',
      icon: AlertOctagon,
      indicator: 'bg-[#D9534F]',
    },
  }[announcement.type || 'info'];

  const IconComp = typeConfig.icon;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 pt-3 sm:pt-4">
      <div
        id="system-announcement-banner"
        className={`relative overflow-hidden rounded-2xl border p-3 sm:p-4 shadow-xs flex items-start sm:items-center justify-between gap-3 ${typeConfig.bg} ${typeConfig.cardBg} transition-all`}
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${typeConfig.bg}`}
          >
            <IconComp className="w-4 h-4" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${typeConfig.badgeBg}`}>
                Duyuru
              </span>
              {announcement.title && (
                <h4 className="text-xs sm:text-sm font-black text-[#1B2A4A] tracking-tight truncate">
                  {announcement.title}
                </h4>
              )}
            </div>
            <p className="text-xs text-[#4A5B78] leading-relaxed line-clamp-2 sm:line-clamp-1 font-medium">
              {announcement.message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          title="Duyuruyu kapat"
          className="text-[#7E8D9F] hover:text-[#1B2A4A] p-1.5 rounded-lg hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
