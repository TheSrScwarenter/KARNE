import React, { useState, useMemo } from 'react';
import {
  Users,
  Radio,
  Clock,
  BookOpen,
  Trophy,
  Medal,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface StudyPeer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  field: 'SAY' | 'EA' | 'SOZ' | 'DIL';
  subject: string;
  todayMinutes: number;
  isCurrentUser?: boolean;
  isStudying?: boolean;
}

const SAMPLE_PEERS: StudyPeer[] = [
  {
    id: 'peer-1',
    name: 'Zeynep B.',
    avatar: 'ZB',
    color: 'bg-emerald-600',
    field: 'SAY',
    subject: 'Matematik • İntegral',
    todayMinutes: 245,
    isStudying: true,
  },
  {
    id: 'peer-2',
    name: 'Kerem Y.',
    avatar: 'KY',
    color: 'bg-blue-600',
    field: 'SAY',
    subject: 'Fizik • Manyetizma',
    todayMinutes: 210,
    isStudying: true,
  },
  {
    id: 'peer-3',
    name: 'Cemre A.',
    avatar: 'CA',
    color: 'bg-indigo-600',
    field: 'EA',
    subject: 'Edebiyat • Şiir Bilgisi',
    todayMinutes: 185,
    isStudying: true,
  },
  {
    id: 'peer-4',
    name: 'Emre K.',
    avatar: 'EK',
    color: 'bg-amber-600',
    field: 'SAY',
    subject: 'Mola Veriyor',
    todayMinutes: 160,
    isStudying: false,
  },
  {
    id: 'peer-5',
    name: 'Berke D.',
    avatar: 'BD',
    color: 'bg-purple-600',
    field: 'EA',
    subject: 'Matematik • Problemler',
    todayMinutes: 130,
    isStudying: true,
  },
  {
    id: 'peer-6',
    name: 'Melis S.',
    avatar: 'MS',
    color: 'bg-rose-600',
    field: 'DIL',
    subject: 'İngilizce • YDT Paragraf',
    todayMinutes: 115,
    isStudying: true,
  },
  {
    id: 'peer-7',
    name: 'Oğuzhan T.',
    avatar: 'OT',
    color: 'bg-teal-600',
    field: 'SAY',
    subject: 'Mola Veriyor',
    todayMinutes: 90,
    isStudying: false,
  },
  {
    id: 'peer-8',
    name: 'Doğa N.',
    avatar: 'DN',
    color: 'bg-cyan-600',
    field: 'SOZ',
    subject: 'Tarih • Kurtuluş Savaşı',
    todayMinutes: 75,
    isStudying: true,
  },
  {
    id: 'peer-9',
    name: 'Ahmet Eren V.',
    avatar: 'AE',
    color: 'bg-emerald-700',
    field: 'SAY',
    subject: 'Mola Veriyor',
    todayMinutes: 55,
    isStudying: false,
  },
  {
    id: 'peer-10',
    name: 'Selin G.',
    avatar: 'SG',
    color: 'bg-orange-600',
    field: 'EA',
    subject: 'Coğrafya • İklim Tipleri',
    todayMinutes: 40,
    isStudying: true,
  },
];

interface LiveStudyTableProps {
  currentSubject?: string;
  currentDurationMinutes?: number;
  todayTotalMinutes?: number;
  isTimerRunning?: boolean;
  dark?: boolean;
}

export const LiveStudyTable: React.FC<LiveStudyTableProps> = ({
  currentSubject = 'Matematik',
  todayTotalMinutes = 0,
  isTimerRunning = false,
  dark = false,
}) => {
  const { user } = useAuth();
  const [filterField, setFilterField] = useState<'all' | 'SAY' | 'EA' | 'SOZ' | 'DIL'>('all');

  const userField = (user?.field as 'SAY' | 'EA' | 'SOZ' | 'DIL') || 'SAY';
  const userName = user?.full_name?.trim() || 'Sen';
  const userInitials = userName
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Combine currentUser with sample peers and sort descending by todayMinutes
  const leaderboard = useMemo(() => {
    const currentUserPeer: StudyPeer = {
      id: 'current-user-seat',
      name: userName,
      avatar: userInitials,
      color: 'bg-[#0071E3]',
      field: userField,
      subject: isTimerRunning
        ? `${currentSubject} • Aktif Odak`
        : `${currentSubject} • Beklemede`,
      todayMinutes: Math.max(0, todayTotalMinutes),
      isCurrentUser: true,
      isStudying: !!isTimerRunning,
    };

    const combined = [...SAMPLE_PEERS, currentUserPeer];

    // Filter if requested
    const filtered =
      filterField === 'all'
        ? combined
        : combined.filter((p) => p.field === filterField);

    // Sort descending: highest study time today at the top
    return filtered.sort((a, b) => b.todayMinutes - a.todayMinutes);
  }, [user, userField, userName, userInitials, currentSubject, todayTotalMinutes, isTimerRunning, filterField]);

  const formatDuration = (mins: number) => {
    if (mins <= 0) return '0 dk';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} dk`;
    if (m === 0) return `${h} sa`;
    return `${h} sa ${m} dk`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shadow-2xs border border-amber-300">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs shadow-2xs border border-slate-300">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-900/15 text-amber-900 flex items-center justify-center font-black text-xs shadow-2xs border border-amber-900/30">
          🥉
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 text-[#7E8D9F] dark:text-white/60 flex items-center justify-center font-bold text-xs">
        {rank}
      </span>
    );
  };

  return (
    <div
      id="live-study-table"
      className={`rounded-3xl p-4 sm:p-6 transition-colors border ${
        dark
          ? 'bg-[#161617]/95 border-white/10 text-white'
          : 'bg-white border-[#DFD9CC] text-[#1B2A4A]'
      } shadow-xs`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 mb-4 border-current/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-[#2E6B4F]/15 text-[#2E6B4F] flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#2E6B4F] rounded-full border-2 border-white dark:border-black animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black tracking-tight">
                Canlı "Birlikte Çalışıyoruz" Odak Masası
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#2E6B4F]/15 text-[#2E6B4F]">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Canlı Liderlik Sıralaması</span>
              </span>
            </div>
            <p className="text-xs opacity-70 mt-0.5">
              Bugünkü toplam odak süresi kronometrenizle doğrudan entegredir. En fazla çalışan öğrenciden en aza doğru sıralanır.
            </p>
          </div>
        </div>

        {/* Field Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F7F4EE] dark:bg-white/5 p-1 rounded-xl border border-[#DFD9CC] dark:border-white/10 text-xs self-start sm:self-center">
          {(['all', 'SAY', 'EA', 'SOZ', 'DIL'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterField(f)}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                filterField === f
                  ? 'bg-[#1B2A4A] text-white shadow-xs'
                  : 'text-[#4A5B78] dark:text-white/70 hover:text-[#1B2A4A]'
              }`}
            >
              {f === 'all' ? 'Tümü' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table (Compact & Scrollable) */}
      <div className="rounded-2xl border border-[#DFD9CC] dark:border-white/10 overflow-hidden bg-[#FAF8F5]/50 dark:bg-white/[0.02]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-[#EFEBE0]/70 dark:bg-white/5 text-[11px] font-black uppercase text-[#7E8D9F] dark:text-white/60 border-b border-[#DFD9CC] dark:border-white/10">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4 sm:col-span-5">Öğrenci</div>
          <div className="col-span-4 sm:col-span-3">Ders / Konu</div>
          <div className="col-span-3 text-right">Bugünkü Süre</div>
        </div>

        {/* Scrollable Rows */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-[#DFD9CC]/60 dark:divide-white/5 pr-0.5">
          {leaderboard.map((peer, idx) => {
            const rank = idx + 1;
            const isMe = !!peer.isCurrentUser;

            return (
              <div
                key={peer.id}
                className={`grid grid-cols-12 gap-2 px-3.5 py-2.5 items-center transition-colors text-xs ${
                  isMe
                    ? 'bg-[#255A8A]/10 dark:bg-[#255A8A]/20 font-bold border-l-4 border-l-[#0071E3]'
                    : 'hover:bg-white/60 dark:hover:bg-white/[0.03]'
                }`}
              >
                {/* Rank Badge */}
                <div className="col-span-1 flex items-center justify-center">
                  {getRankBadge(rank)}
                </div>

                {/* Student Info */}
                <div className="col-span-4 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-black shrink-0 ${peer.color}`}
                  >
                    {peer.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-[#1B2A4A] dark:text-white truncate">
                        {peer.name}
                      </span>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase bg-[#0071E3] text-white">
                          Sen
                        </span>
                      )}
                      <span className="px-1 py-0.2 rounded-md text-[9px] font-extrabold bg-[#DFD9CC]/60 dark:bg-white/10 text-[#4A5B78] dark:text-white/70">
                        {peer.field}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject / Topic */}
                <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      peer.isStudying
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-gray-400 dark:bg-gray-500'
                    }`}
                  />
                  <span className="text-[11px] text-[#4A5B78] dark:text-white/75 truncate">
                    {peer.subject}
                  </span>
                </div>

                {/* Today's Study Time (Green if actively studying, Black if not actively studying) */}
                <div className="col-span-3 text-right">
                  <span
                    className={`font-black text-xs ${
                      peer.isStudying
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-black dark:text-white'
                    }`}
                  >
                    {formatDuration(peer.todayMinutes)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
