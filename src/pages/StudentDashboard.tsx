import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HelpCircle,
  Clock,
  BarChart3,
  CalendarDays,
  Users,
  ArrowRight,
  Target,
  Sparkles,
  BookOpen,
  Flame,
  Trophy,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { examsService } from '../lib/examsService';
import { studySessionsService } from '../lib/studySessionsService';
import { wrongQuestionsService } from '../lib/wrongQuestionsService';
import { booksService } from '../lib/booksService';
import { programService } from '../lib/programService';
import { badgesService } from '../lib/badgesService';
import { Exam, StudySession, WrongQuestion, StudentBook, StudyProgram, StreakInfo, UserBadge } from '../types';
import { DashboardExamTrendChart } from '../components/DashboardExamTrendChart';
import { YksCountdownWidget } from '../components/YksCountdownWidget';

export const StudentDashboard: React.FC = () => {
  const { user, navigate } = useAuth();
  const studentId = user?.id || 'st-demo-001';

  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [books, setBooks] = useState<StudentBook[]>([]);
  const [activeProgram, setActiveProgram] = useState<StudyProgram | null>(null);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [unlockedBadges, setUnlockedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [fetchedExams, fetchedSessions, fetchedWQ, fetchedBooks, fetchedProg, fetchedStreak, fetchedBadges] = await Promise.all([
          examsService.getExams(studentId),
          studySessionsService.getSessions(studentId),
          wrongQuestionsService.getQuestions(studentId),
          booksService.getBooks(studentId),
          programService.getActiveProgram(studentId),
          badgesService.calculateStreak(studentId),
          badgesService.getUserBadges(studentId),
        ]);
        setExams(fetchedExams);
        setSessions(fetchedSessions);
        setWrongQuestions(fetchedWQ);
        setBooks(fetchedBooks);
        setActiveProgram(fetchedProg);
        setStreak(fetchedStreak);
        setUnlockedBadges(fetchedBadges.filter(b => b.is_unlocked));
      } catch (err) {
        console.error('Failed to load dashboard dynamic data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [studentId]);

  // Calculate today's study minutes
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMinutes = sessions
    .filter((s) => s.created_at?.startsWith(todayStr) || s.duration_minutes)
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const todayHoursStr =
    todayMinutes > 0
      ? `${Math.floor(todayMinutes / 60)}s ${todayMinutes % 60}d`
      : '0d';

  // Latest exam net
  const latestExam = exams[0];
  const latestExamNet = latestExam ? examsService.calculateTotalNet(latestExam) : null;

  const moduleCards = [
    {
      id: 'module-books',
      phase: 'Kitaplar',
      title: 'Kaynak & Soru Bankası',
      icon: BookOpen,
      iconColor: 'text-[#0071E3]',
      iconBg: 'bg-[#0071E3]/10',
      description: 'TYT ve AYT soru bankalarını ekleyin, müfredat konularını otomatik yükleyip çözdükçe ilerleme çemberinizi tamamlayın.',
      featureTag: 'Konu Çizelgesi • İlerleme Takibi',
      stats: books.length > 0 ? `${books.length} Aktif Kaynak` : '0 Kaynak',
      path: '/books',
      actionText: books.length > 0 ? 'İncele' : 'Kitap Ekle',
    },
    {
      id: 'module-wrong-questions',
      phase: 'Analiz',
      title: 'Yanlış Soru Bankası',
      icon: HelpCircle,
      iconColor: 'text-[#FF3B30]',
      iconBg: 'bg-[#FF3B30]/10',
      description: 'Hatalı soruların fotoğrafını kaydedin, 5 farklı hata türüyle kategorize edin ve zayıf noktalarınızı görün.',
      featureTag: 'Görsel Arşiv • Hata Teşhisi',
      stats: wrongQuestions.length > 0 ? `${wrongQuestions.length} Soru Kayıtlı` : 'Havuz Boş',
      path: '/wrong-questions',
      actionText: wrongQuestions.length > 0 ? 'İncele' : 'Soru Ekle',
    },
    {
      id: 'module-study-log',
      phase: 'Kronometre',
      title: 'Çalışma Günlüğü & Odak',
      icon: Clock,
      iconColor: 'text-[#5856D6]',
      iconBg: 'bg-[#5856D6]/10',
      description: 'Ders ve konu bazlı canlı süre sayacı, haftalık ısı haritası ve süreklilik takibi.',
      featureTag: 'Canlı Sayaç • Isı Haritası',
      stats: sessions.length > 0 ? `${sessions.length} Oturum` : '0 Oturum',
      path: '/study-log',
      actionText: 'Sayacı Başlat',
    },
    {
      id: 'module-exams',
      phase: 'Denemeler',
      title: 'Deneme & Net Analizi',
      icon: BarChart3,
      iconColor: 'text-[#34C759]',
      iconBg: 'bg-[#34C759]/10',
      description: 'TYT ve AYT deneme netlerinizi kaydedin, Recharts trend eğrileriyle gelişiminizi izleyin.',
      featureTag: 'Net Formülleri • Trend Eğrileri',
      stats: latestExamNet !== null ? `Son Net: ${latestExamNet}` : '0 Deneme',
      path: '/exams',
      actionText: exams.length > 0 ? 'Analize Git' : 'Deneme Ekle',
    },
    {
      id: 'module-program',
      phase: 'Program',
      title: 'Haftalık Çalışma Planı',
      icon: CalendarDays,
      iconColor: 'text-[#FF9500]',
      iconBg: 'bg-[#FF9500]/10',
      description: 'Zayıf konu analizlerine ve hedeflerinize uygun haftalık ders ve konu çalışma çizelgesi.',
      featureTag: 'Zaman Blokları • Görev Takvimi',
      stats: activeProgram ? `${activeProgram.items?.length || 0} Görev Planlandı` : 'Plan Bekleniyor',
      path: '/program',
      actionText: activeProgram ? 'Programı Gör' : 'Plan Oluştur',
    },
    {
      id: 'module-coach',
      phase: 'Koçluk',
      title: 'Koçluk & Soru Mesajları',
      icon: Users,
      iconColor: 'text-[#AF52DE]',
      iconBg: 'bg-[#AF52DE]/10',
      description: 'Yalnızca koçluk kodunuzla eşleştiğiniz koçunuzla birebir canlı mesajlaşma ve soru iletimi.',
      featureTag: 'Birebir İletişim • Soru Cevap',
      stats: 'Koçluk Aktif',
      path: '/coaching',
      actionText: 'Koçuma Mesaj Yaz',
    },
  ];

  return (
    <div id="student-dashboard" className="space-y-6">
      {/* Bento Grid Top Section: Welcome Banner & Countdown Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Welcome Bento Card (Span 3 cols) */}
        <div className="lg:col-span-3 bento-card p-6 md:p-8 flex flex-col justify-between relative overflow-hidden bg-white border border-black/[0.06]">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
                YKS 2026 Hazırlık Masası
              </span>
              <span className="text-xs font-medium text-[#86868B]">
                • Sistem Canlı
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1D1D1F] tracking-tight">
              Hoş geldin, {user?.full_name || 'Öğrenci'}
            </h2>
            <p className="text-sm text-[#86868B] mt-1.5 max-w-2xl leading-relaxed">
              Çalışmalarınızı, kaynaklarınızı, hatalı sorularınızı ve deneme netlerinizi kaydedin. Gelişiminizi Apple sadeliğinde takip edin.
            </p>
          </div>

          {/* Middle: Live Quick Insight Cards (Fills fullscreen space with vital student metrics) */}
          <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            {/* 1. Odak Süresi */}
            <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] flex flex-col justify-between transition-all hover:bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Bugünkü Odak</span>
                <Clock className="w-4 h-4 text-[#0071E3]" />
              </div>
              <div>
                <div className="text-lg font-black text-[#1D1D1F] tracking-tight">{todayHoursStr}</div>
                <div className="text-[11px] font-medium text-[#86868B] mt-0.5 truncate">
                  {todayMinutes >= 180 ? '🎯 Hedef Tamamlandı' : todayMinutes > 0 ? '⏳ Aktif Çalışma' : 'Henüz başlanmadı'}
                </div>
              </div>
            </div>

            {/* 2. Son Deneme */}
            <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] flex flex-col justify-between transition-all hover:bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Son Deneme</span>
                <TrendingUp className="w-4 h-4 text-[#34C759]" />
              </div>
              <div>
                <div className="text-lg font-black text-[#1D1D1F] tracking-tight">
                  {latestExamNet !== null ? `${latestExamNet} Net` : '0 Net'}
                </div>
                <div className="text-[11px] font-medium text-[#86868B] mt-0.5 truncate">
                  {exams.length > 0 ? `${exams.length} Deneme Kayıtlı` : 'Deneme Girilmedi'}
                </div>
              </div>
            </div>

            {/* 3. Yanlış Soru & Kaynak */}
            <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] flex flex-col justify-between transition-all hover:bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Hata Havuzu</span>
                <HelpCircle className="w-4 h-4 text-[#FF3B30]" />
              </div>
              <div>
                <div className="text-lg font-black text-[#1D1D1F] tracking-tight">
                  {wrongQuestions.length} Soru
                </div>
                <div className="text-[11px] font-medium text-[#86868B] mt-0.5 truncate">
                  {books.length} Kaynak Kitapta
                </div>
              </div>
            </div>

            {/* 4. Çalışma Serisi */}
            <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] flex flex-col justify-between transition-all hover:bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">İstikrar Serisi</span>
                <Flame className="w-4 h-4 text-[#FF9500]" />
              </div>
              <div>
                <div className="text-lg font-black text-[#1D1D1F] tracking-tight">
                  {streak?.current_streak || 0} Gün
                </div>
                <div className="text-[11px] font-medium text-[#86868B] mt-0.5 truncate">
                  {unlockedBadges.length} Rozet Açık
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-3.5 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-[#86868B] relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-[#1D1D1F] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
                {user?.full_name || 'Öğrenci'}
              </span>
              <span className="text-black/20">•</span>
              <span className="font-semibold text-[#0071E3]">
                Alan: {user?.field || 'SAY'}
              </span>
              <span className="text-black/20">•</span>
              <span>Hedef: {user?.target_department || 'YKS 2026 Hedef Bölüm'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F5F5F7] border border-black/[0.06] text-[#1D1D1F]">
                {user?.coach_name ? `Koç: ${user.coach_name}` : 'Bireysel Hazırlık'}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Bento Widget (Span 1 col) */}
        <div className="lg:col-span-1">
          <YksCountdownWidget />
        </div>
      </div>

      {/* Streak & Achievement Badges Card (Light Apple Style) */}
      <div className="bento-card p-4 sm:p-5 md:p-6 bg-white border border-black/[0.06] text-[#1D1D1F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-[#1D1D1F]">
                {streak?.current_streak || 0} Günlük Çalışma Serisi
              </h3>
              <span className="text-[11px] sm:text-xs bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20 px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                {streak?.is_studied_today ? 'Bugün Tamamlandı' : 'Bugün Bekleniyor'}
              </span>
            </div>
            <p className="text-xs text-[#86868B] mt-0.5 truncate sm:whitespace-normal">
              En uzun seri: <strong className="text-[#1D1D1F]">{streak?.longest_streak || 0} gün</strong> • Kazanılan rozetler: <strong className="text-[#0071E3]">{unlockedBadges.length} adet</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-view-profile-badges"
          onClick={() => navigate('/profile')}
          className="apple-btn-secondary py-2 px-3.5 sm:py-2.5 sm:px-4 text-xs font-semibold rounded-full shrink-0 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <Trophy className="w-3.5 h-3.5 text-[#FF9500] shrink-0" />
          <span>Rozetleri & Profili Gör</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
        </button>
      </div>

      {/* AI Radar & Coaching Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          id="card-cta-ai-predictor"
          onClick={() => navigate('/ai-analytics')}
          className="bento-card p-5 bg-white border border-black/[0.06] hover:border-[#0071E3] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors flex items-center gap-1.5">
                <span>YKS Sıralama & Eksik Konu Radarı</span>
                <span className="text-[10px] bg-[#0071E3]/10 text-[#0071E3] px-2 py-0.5 rounded-full font-semibold">AI</span>
              </h4>
              <p className="text-xs text-[#86868B] mt-0.5">
                ÖSYM yığılma simülatörü ve acil öncelikli konular
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#86868B] group-hover:text-[#0071E3] group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          id="card-cta-coaching-hub"
          onClick={() => navigate('/coaching')}
          className="bento-card p-5 bg-white border border-black/[0.06] hover:border-[#34C759] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#34C759] transition-colors flex items-center gap-1.5">
                <span>Koçluk & Canlı Soru Sohbeti</span>
                <span className="text-[10px] bg-[#34C759]/10 text-[#34C759] px-2 py-0.5 rounded-full font-semibold">Canlı</span>
              </h4>
              <p className="text-xs text-[#86868B] mt-0.5">
                Fotoğraflı soru paylaşımı, randevu takvimi ve görevler
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#86868B] group-hover:text-[#34C759] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Bento Metrics 4-Grid Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Günün Çalışması */}
        <div className="bento-card p-5 bg-white border border-black/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#86868B]">Günün Çalışması</p>
              <span className="w-7 h-7 rounded-full bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1D1D1F] mt-2">{todayHoursStr}</p>
          </div>
          <p className="text-xs text-[#86868B] mt-2">
            {todayMinutes > 0 ? 'Bugün çalışma kaydedildi' : 'Bugün henüz oturum yok'}
          </p>
        </div>

        {/* Metric 2: Yanlış Soru Havuzu */}
        <div className="bento-card p-5 bg-white border border-black/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#86868B]">Yanlış Soru Havuzu</p>
              <span className="w-7 h-7 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-bold text-[#FF3B30] mt-2">
              {wrongQuestions.length} Soru
            </p>
          </div>
          <p className="text-xs text-[#86868B] mt-2">
            {wrongQuestions.length > 0 ? 'Tekrar edilmeyi bekliyor' : 'Havuz tertemiz'}
          </p>
        </div>

        {/* Metric 3: Son Deneme Neti */}
        <div className="bento-card p-5 bg-white border border-black/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#86868B]">Son Deneme Neti</p>
              <span className="w-7 h-7 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-bold text-[#34C759] mt-2">
              {latestExamNet !== null ? `${latestExamNet} Net` : '-'}
            </p>
          </div>
          <p className="text-xs text-[#86868B] mt-2 truncate">
            {latestExam ? latestExam.exam_name : 'Henüz deneme girilmedi'}
          </p>
        </div>

        {/* Metric 4: Aktif Kaynaklar */}
        <div className="bento-card p-5 bg-white border border-black/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#86868B]">Kayıtlı Kaynaklar</p>
              <span className="w-7 h-7 rounded-full bg-[#AF52DE]/10 text-[#AF52DE] flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1D1D1F] mt-2">{books.length} Kitap</p>
          </div>
          <p className="text-xs text-[#86868B] mt-2">
            {books.length > 0 ? 'Soru bankası takibi aktif' : 'Henüz kitap eklenmedi'}
          </p>
        </div>
      </div>

      {/* Bento Grid Middle Section: Analytics Chart & Modules */}
      <div className="space-y-6">
        {/* Bento Analytics Chart Component */}
        <DashboardExamTrendChart
          exams={exams}
          onNavigateToExams={() => navigate('/exams')}
        />

        {/* Bento Module Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
                Çalışma Takip Modülleri
              </h3>
              <p className="text-xs text-[#86868B]">
                YKS 2026 hazırlık sürecinde ihtiyacınız olan tüm takip ve analiz araçları.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moduleCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  id={card.id}
                  className="bento-card p-6 flex flex-col justify-between group bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F5F5F7] text-[#86868B] border border-black/[0.04]">
                        {card.phase}
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-[#1D1D1F] mt-4 group-hover:text-[#0071E3] transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                      {card.description}
                    </p>

                    <div className="mt-4 flex items-center gap-1.5 text-xs text-[#0071E3] font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{card.featureTag}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1D1D1F]">
                      {card.stats}
                    </span>
                    <button
                      onClick={() => navigate(card.path)}
                      className="apple-btn-secondary px-3.5 py-1.5 text-xs font-medium rounded-full inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{card.actionText}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
