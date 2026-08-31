import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { coachService, CoachStudent } from '../lib/coachService';
import {
  Users,
  BrainCircuit,
  FileText,
  Copy,
  Check,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  UserCheck,
  Calendar,
  Clock,
  ArrowUpRight,
  GraduationCap,
} from 'lucide-react';

export const CoachDashboard: React.FC = () => {
  const { user, navigate } = useAuth();
  const [students, setStudents] = useState<CoachStudent[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('YKS-KOC-8429');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    coachService.getStudents().then(setStudents);
  }, []);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewCode = () => {
    const code = 'YKS-KOC-' + Math.floor(1000 + Math.random() * 9000);
    setInviteCode(code);
  };

  const approvedCount = students.filter((s) => s.status === 'approved').length;
  const pendingCount = students.filter((s) => s.status === 'pending').length;

  const coachModules = [
    {
      id: 'coach-mod-students',
      phase: 'FAZ 6',
      title: 'Öğrenci Yönetimi & Takip',
      icon: Users,
      iconColor: 'text-[#0071E3]',
      iconBg: 'bg-[#0071E3]/10',
      description: 'Öğrencilerle davet kodu üzerinden güvenli eşleşme, anlık çalışma logları, deneme grafikleri ve özel hedef takibi.',
      featureTag: 'Davet Kodu • Net Grafikleri • Başarı Takibi',
      stats: `${students.length} Kayıtlı Öğrenci`,
      path: '/students',
      actionText: 'Öğrencileri Yönet',
    },
    {
      id: 'coach-mod-advisor',
      phase: 'FAZ 5',
      title: 'Haftalık Program Masası',
      icon: Calendar,
      iconColor: 'text-[#FF9500]',
      iconBg: 'bg-[#FF9500]/10',
      description: 'Öğrencileriniz için haftalık ders dağılımı, çalışma saatleri, hedef soru sayıları ve koç yönergelerini doğrudan hazırlayın.',
      featureTag: 'Manuel Planlama • Haftalık Çizelge • Soru Hedefi',
      stats: 'Haftalık Program Hazırla',
      path: '/students',
      actionText: 'Öğrenci Seç & Program Yap',
    },
    {
      id: 'coach-mod-notes',
      phase: 'FAZ 6',
      title: 'Koçluk Notları ve Rehberlik',
      icon: FileText,
      iconColor: 'text-[#34C759]',
      iconBg: 'bg-[#34C759]/10',
      description: 'Her öğrenciye özel haftalık geri bildirim, motivasyon notu, ders dağılımı ve turlama taktikleri paylaşımı.',
      featureTag: 'Birebir Geri Bildirim • Strateji Akışı',
      stats: 'Tüm Notları İncele',
      path: '/coach-notes',
      actionText: 'Not Yaz & Oku',
    },
  ];

  return (
    <div id="coach-dashboard" className="space-y-6">
      {/* Bento Grid Top Section: Welcome Banner & Invite Code Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Welcome Bento Card (Span 3 cols) */}
        <div className="lg:col-span-3 bento-card p-6 md:p-8 flex flex-col justify-between relative overflow-hidden bg-white">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#0071E3] tracking-wide">
                Koçluk & Rehberlik Masası
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] font-semibold border border-[#34C759]/20">
                YKS 2026 Aktif
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1D1D1F] tracking-tight">
              Hoş geldiniz, {user?.full_name || 'Koç'}
            </h2>
            <p className="text-sm text-[#86868B] mt-2 max-w-2xl leading-relaxed">
              Öğrencilerinizin yanlış soru analizlerini, çalışma loglarını ve deneme netlerini inceleyebilir; hedef belirleyip rehberlik programları oluşturabilirsiniz.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-black/[0.06] flex flex-wrap items-center gap-4 text-xs font-medium text-[#86868B]">
            <span className="flex items-center gap-1.5 text-[#1D1D1F]">
              <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
              Aktif Oturum: Koç Hesabı
            </span>
            <span className="text-black/10">•</span>
            <span>Hedef: YKS 2026</span>
            <span className="text-black/10">•</span>
            <span className="text-[#0071E3]">{approvedCount} Onaylı Öğrenci</span>
          </div>
        </div>

        {/* Invite Code Generator Bento Widget (Span 1 col) */}
        <div className="lg:col-span-1 bento-card p-6 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                Öğrenci Davet Kodu
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3.5 p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] text-center">
              <p className="text-lg font-mono font-bold text-[#1D1D1F] tracking-wider">
                {inviteCode}
              </p>
              <p className="text-[10px] text-[#86868B] mt-0.5">
                Öğrenciler bu kodla bağlanır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              id="btn-copy-invite-code"
              onClick={copyInviteCode}
              className="flex-1 apple-btn-primary py-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
            <button
              id="btn-new-invite-code"
              onClick={generateNewCode}
              title="Yeni Kod Üret"
              className="apple-btn-secondary p-2 text-xs rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bento Metrics 4-Grid Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card p-5 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#86868B]">Kayıtlı Öğrenci</p>
            <span className="w-7 h-7 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#1D1D1F] mt-2">{students.length} Öğrenci</p>
          <p className="text-[11px] text-[#34C759] font-medium mt-1.5">
            {approvedCount} Onaylı, {pendingCount} Beklemede
          </p>
        </div>

        <div className="bento-card p-5 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#86868B]">İncelenen Denemeler</p>
            <span className="w-7 h-7 rounded-lg bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#0071E3] mt-2">12 Deneme</p>
          <p className="text-[11px] text-[#86868B] font-medium mt-1.5">
            Son 14 günde 6 analiz
          </p>
        </div>

        <div className="bento-card p-5 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#86868B]">Haftalık Programlar</p>
            <span className="w-7 h-7 rounded-lg bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#FF9500] mt-2">Aktif Plan</p>
          <p className="text-[11px] text-[#86868B] font-medium mt-1.5">
            Öğrenci danışmanı hazır
          </p>
        </div>

        <div className="bento-card p-5 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#86868B]">Özel Hedef Uyumu</p>
            <span className="w-7 h-7 rounded-lg bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#34C759] mt-2">%82 Başarı</p>
          <p className="text-[11px] text-[#34C759] font-medium mt-1.5">
            Gelişim ivmesi yüksek
          </p>
        </div>
      </div>

      {/* Bento Linked Students Overview Table */}
      <div className="bento-card p-6 md:p-7 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] tracking-tight">
              Bağlı Öğrenciler ve Takip Durumu
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5">
              Koçluk grubundaki öğrencilerin son netleri, hedefleri ve haftalık çalışma durumları.
            </p>
          </div>
          <button
            onClick={() => navigate('/students')}
            className="apple-btn-secondary text-xs font-medium inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer self-start sm:self-auto"
          >
            <span>Tüm Öğrencileri Yönet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] text-[#86868B] uppercase font-semibold text-[10px]">
                <th className="pb-3 pl-3">Öğrenci Adı</th>
                <th className="pb-3">Hedef</th>
                <th className="pb-3">Son TYT Neti</th>
                <th className="pb-3">Haftalık Çalışma</th>
                <th className="pb-3">Hedef Uyumu</th>
                <th className="pb-3">Durum</th>
                <th className="pb-3 pr-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] font-normal text-[#1D1D1F]">
              {students.map((st) => {
                const completedGoals = st.customGoals.filter((g) => g.completed).length;
                const totalGoals = st.customGoals.length;
                return (
                  <tr key={st.id} className="hover:bg-[#F5F5F7]/80 transition-colors">
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${st.avatarColor} text-white font-semibold flex items-center justify-center text-xs shadow-xs`}>
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold block text-[#1D1D1F]">{st.name}</span>
                          <span className="text-[10px] text-[#86868B]">{st.field}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-[#86868B]">{st.targetDepartment} ({st.targetRank})</td>
                    <td className="py-3.5 font-bold text-[#34C759]">{st.currentNetTYT} Net</td>
                    <td className="py-3.5 text-[#86868B]">
                      {st.weeklyStudyCompletedHours}s / {st.weeklyStudyGoalHours}s
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0071E3] bg-[#0071E3]/10 px-2.5 py-0.5 rounded-full text-[11px]">
                        {completedGoals}/{totalGoals} Hedef
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          st.status === 'approved'
                            ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'
                            : 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20'
                        }`}
                      >
                        {st.status === 'approved' ? 'Onaylı' : 'Beklemede'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-right">
                      <button
                        onClick={() => navigate('/students')}
                        className="apple-btn-secondary px-3 py-1 text-xs rounded-full cursor-pointer font-medium"
                      >
                        İncele
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bento Coach Tool Modules */}
      <div>
        <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight mb-4">
          Koçluk Araçları & Modülleri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coachModules.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                id={card.id}
                className="bento-card p-6 flex flex-col justify-between group bg-white hover:border-[#0071E3]/30 transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F5F7] text-[#86868B] border border-black/[0.06]">
                      {card.phase}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#1D1D1F] mt-3.5 group-hover:text-[#0071E3] transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-[#34C759] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF9500]" />
                    <span>{card.featureTag}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-black/[0.06] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1D1D1F]">
                    {card.stats}
                  </span>
                  <button
                    onClick={() => navigate(card.path)}
                    className="apple-btn-secondary inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer"
                  >
                    <span>{card.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
