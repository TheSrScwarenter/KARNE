import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured, supabaseUrl } from '../../lib/supabase/client';
import { Activity, RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';

interface SystemHealthIndicatorProps {
  isCollapsed?: boolean;
}

export type ConnectionStatus = 'checking' | 'connected' | 'degraded' | 'disconnected' | 'unconfigured';

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({ isCollapsed = false }) => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const checkHealth = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      if (isMountedRef.current) {
        setStatus('unconfigured');
        setLatency(null);
        setLastChecked(new Date());
      }
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isMountedRef.current) {
        setStatus('disconnected');
        setLatency(null);
        setLastChecked(new Date());
      }
      return;
    }

    if (isMountedRef.current) {
      setIsPinging(true);
    }

    const startTime = performance.now();

    try {
      // Perform a lightweight Supabase query with timeout to measure real-time latency
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Lightweight head/limit query to verify database and API gateway
      const { error } = await supabase
        .from('system_users')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);

      if (!isMountedRef.current) return;

      if (error && error.message && error.message.includes('abort')) {
        setStatus('disconnected');
        setLatency(null);
      } else {
        setLatency(elapsed);
        if (elapsed > 700) {
          setStatus('degraded');
        } else {
          setStatus('connected');
        }
      }
      setLastChecked(new Date());
    } catch {
      if (!isMountedRef.current) return;
      setStatus('disconnected');
      setLatency(null);
      setLastChecked(new Date());
    } finally {
      if (isMountedRef.current) {
        setIsPinging(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    checkHealth();

    // Periodic ping every 30 seconds
    const interval = setInterval(() => {
      checkHealth();
    }, 30000);

    const handleOnline = () => checkHealth();
    const handleOffline = () => {
      setStatus('disconnected');
      setLatency(null);
    };
    const handleFocus = () => checkHealth();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkHealth]);

  // Color & badge helpers
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return {
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          text: 'text-emerald-700',
          label: 'Bağlı',
        };
      case 'degraded':
        return {
          dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
          badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
          text: 'text-amber-700',
          label: 'Yavaş Yanıt',
        };
      case 'disconnected':
        return {
          dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
          badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
          text: 'text-rose-700',
          label: 'Bağlantı Yok',
        };
      case 'unconfigured':
        return {
          dot: 'bg-slate-400',
          badge: 'bg-slate-50 text-slate-600 border-slate-200/60',
          text: 'text-slate-600',
          label: 'Yapılandırılmadı',
        };
      case 'checking':
      default:
        return {
          dot: 'bg-blue-400 animate-pulse',
          badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
          text: 'text-blue-700',
          label: 'Kontrol Ediliyor...',
        };
    }
  };

  const statusMeta = getStatusColor();

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return 'text-[#86868B]';
    if (ms < 150) return 'text-emerald-700';
    if (ms < 400) return 'text-sky-700';
    if (ms < 700) return 'text-amber-700';
    return 'text-rose-700';
  };

  const getLatencyLabel = (ms: number | null) => {
    if (ms === null) return '';
    if (ms < 150) return 'Mükemmel';
    if (ms < 400) return 'Normal';
    if (ms < 700) return 'Orta';
    return 'Yüksek';
  };

  // Extract host display (e.g. "abrrfeiyncyesaqdmxwx")
  const projectHost = supabaseUrl
    ? supabaseUrl.replace(/^https?:\/\//, '').split('.')[0]
    : 'supabase';

  // Tooltip content for collapsed mode
  const tooltipText = `Supabase: ${statusMeta.label}${
    latency !== null ? ` (${latency} ms)` : ''
  }${lastChecked ? ` • Son ping: ${lastChecked.toLocaleTimeString('tr-TR')}` : ''}`;

  if (isCollapsed) {
    return (
      <div className="relative flex justify-center py-2 px-1 group">
        <button
          type="button"
          onClick={checkHealth}
          disabled={isPinging}
          title={tooltipText}
          className="relative w-10 h-10 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] flex items-center justify-center border border-black/[0.06] transition-all cursor-pointer group-hover:scale-105"
        >
          <Activity
            className={`w-4 h-4 ${
              status === 'connected'
                ? 'text-emerald-600'
                : status === 'degraded'
                ? 'text-amber-600'
                : status === 'disconnected'
                ? 'text-rose-600'
                : 'text-[#86868B]'
            } ${isPinging ? 'animate-pulse' : ''}`}
          />
          {/* Pulsing indicator dot */}
          <span
            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${statusMeta.dot}`}
          />
        </button>

        {/* Hover Tooltip for Collapsed Sidebar */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-[#1D1D1F] text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
            <span>{tooltipText}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="system-health-indicator"
      className="mx-2.5 my-2 p-2.5 rounded-2xl bg-gradient-to-b from-[#F7F4EE] to-[#EFEBE0]/60 border border-[#DFD9CC] shadow-2xs"
    >
      {/* Header: Title + Ping Button */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-lg bg-[#1B2A4A] text-white flex items-center justify-center shrink-0 shadow-3xs">
            <Activity className="w-3 h-3 text-[#255A8A]" />
          </div>
          <span className="text-[11px] font-bold text-[#1B2A4A] tracking-tight truncate">
            Sistem Sağlığı
          </span>
        </div>

        <button
          type="button"
          onClick={checkHealth}
          disabled={isPinging}
          className="p-1 rounded-md text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-black/[0.05] transition-all cursor-pointer disabled:opacity-50"
          title="Gecikmeyi ve bağlantıyı anında test et"
          aria-label="Ping Yenile"
        >
          <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin text-[#1B2A4A]' : ''}`} />
        </button>
      </div>

      {/* Main Status & Latency Row */}
      <div className="flex items-center justify-between gap-2 px-1 py-1 rounded-xl bg-white/80 border border-[#DFD9CC]/60 shadow-3xs">
        {/* Left: Status with pulsing dot */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dot}`} />
          <span className={`text-[11px] font-extrabold truncate ${statusMeta.text}`}>
            {statusMeta.label}
          </span>
        </div>

        {/* Right: Real-time Latency (Ping) */}
        {latency !== null ? (
          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-[11px] font-mono font-bold ${getLatencyColor(latency)}`}>
              {latency} ms
            </span>
            <span className="text-[9px] font-medium text-[#7E8D9F]">
              ({getLatencyLabel(latency)})
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-[#7E8D9F] font-mono">
            {isPinging ? 'ölçülüyor...' : '--'}
          </span>
        )}
      </div>

      {/* Footer Details: Endpoint & Timestamp */}
      <div className="flex items-center justify-between text-[9px] text-[#7E8D9F] mt-1.5 px-0.5">
        <span className="truncate font-mono" title={`Supabase ID: ${projectHost}`}>
          cloud: {projectHost.substring(0, 8)}...
        </span>
        {lastChecked && (
          <span className="shrink-0 font-medium">
            {lastChecked.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};
