import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { coachingHubService } from '../lib/coachingHubService';
import { usersService, UserAccount } from '../lib/usersService';
import { coachService, CoachStudent } from '../lib/coachService';
import {
  CoachingMessage,
  CoachingAppointment,
  CoachingTask,
  TaskStatus,
} from '../types';
import {
  MessageSquare,
  Calendar,
  CheckSquare,
  Send,
  Image as ImageIcon,
  Clock,
  UserCheck,
  Video,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BookOpen,
  User,
  Users,
  Check,
  Award,
  KeyRound,
  ShieldCheck,
  Copy,
} from 'lucide-react';

export const CoachingHub: React.FC = () => {
  const { user, refreshCurrentUser } = useAuth();
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'chat' | 'appointments' | 'tasks'>('chat');
  const [loading, setLoading] = useState<boolean>(true);

  // Student perspective: Matched coach
  const [matchedCoach, setMatchedCoach] = useState<UserAccount | null>(null);
  const [inputCoachCode, setInputCoachCode] = useState<string>('');
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [matchingLoading, setMatchingLoading] = useState<boolean>(false);
  const [copiedCoachCode, setCopiedCoachCode] = useState<boolean>(false);

  // Coach perspective: Assigned students list
  const [assignedStudents, setAssignedStudents] = useState<CoachStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // 1. Chat State
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [newImageAttachment, setNewImageAttachment] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Genel');
  const [showAttachInput, setShowAttachInput] = useState<boolean>(false);

  // 2. Appointments State
  const [appointments, setAppointments] = useState<CoachingAppointment[]>([]);
  const [bookingModalApp, setBookingModalApp] = useState<CoachingAppointment | null>(null);
  const [bookingNote, setBookingNote] = useState<string>('');
  const [showNewSlotModal, setShowNewSlotModal] = useState<boolean>(false);
  const [newSlotDate, setNewSlotDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newSlotStart, setNewSlotStart] = useState<string>('18:00');
  const [newSlotEnd, setNewSlotEnd] = useState<string>('18:30');

  // 3. Tasks State
  const [tasks, setTasks] = useState<CoachingTask[]>([]);
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDesc, setNewTaskDesc] = useState<string>('');
  const [newTaskSubject, setNewTaskSubject] = useState<string>('Matematik');
  const [newTaskQuestions, setNewTaskQuestions] = useState<number>(30);
  const [newTaskBook, setNewTaskBook] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');

  // Determine current active studentId and coachId
  const activeStudentId = isCoach ? selectedStudentId : (user?.id || '');
  const activeCoachId = isCoach ? (user?.id || '') : (matchedCoach?.id || user?.assigned_coach_id || '');

  // Load perspective data
  const loadPerspectiveData = async () => {
    setLoading(true);
    try {
      if (isCoach) {
        // Coach only sees students who registered with their code or are assigned to them
        const coachStudents = await coachService.getStudents(
          user?.id,
          user?.coach_code,
          user?.role === 'admin'
        );
        setAssignedStudents(coachStudents);
        if (coachStudents.length > 0 && !selectedStudentId) {
          setSelectedStudentId(coachStudents[0].id);
        }
      } else {
        // Student only messages their assigned coach
        if (user?.assigned_coach_id) {
          const allCoaches = await usersService.getCoaches();
          const found = allCoaches.find((c) => c.id === user.assigned_coach_id);
          if (found) {
            setMatchedCoach(found);
          } else {
            // Fetch directly
            const allUsers = await usersService.getAllUsers();
            const coaches = allUsers.filter((u) => u.role === 'coach');
            const cFound = coaches.find((c) => c.id === user.assigned_coach_id);
            if (cFound) setMatchedCoach(cFound);
          }
        } else {
          setMatchedCoach(null);
        }
      }
    } catch (err) {
      console.error('Perspective load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerspectiveData();
  }, [user]);

  // Load chat, appointments, and tasks for the active pair
  const loadConversationData = async () => {
    if (!activeStudentId) {
      setMessages([]);
      setAppointments([]);
      setTasks([]);
      return;
    }

    try {
      const [fetchedMsgs, fetchedApps, fetchedTasks] = await Promise.all([
        coachingHubService.getMessages(activeStudentId, activeCoachId || undefined),
        coachingHubService.getAppointments(activeStudentId, activeCoachId || undefined),
        coachingHubService.getTasks(activeStudentId),
      ]);
      setMessages(fetchedMsgs);
      setAppointments(fetchedApps);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Conversation load error:', err);
    }
  };

  useEffect(() => {
    loadConversationData();
  }, [activeStudentId, activeCoachId]);

  // Student: Match with Coach by Code
  const handleMatchWithCoachCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoachCode.trim() || !user) return;

    setMatchingLoading(true);
    setMatchingError(null);
    try {
      const result = await usersService.assignCoachByCode(user.id, inputCoachCode.trim());
      await refreshCurrentUser();
      setMatchedCoach(result.coach);
      setInputCoachCode('');
    } catch (err: any) {
      setMatchingError(err.message || 'Eşleşme başarısız oldu.');
    } finally {
      setMatchingLoading(false);
    }
  };

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() && !newImageAttachment) return;
    if (!activeStudentId || !activeCoachId) return;

    try {
      const sent = await coachingHubService.sendMessage({
        sender_id: user?.id || 'usr-me',
        sender_name: user?.full_name || (isCoach ? 'Koç' : 'Öğrenci'),
        sender_role: isCoach ? 'coach' : 'student',
        receiver_id: isCoach ? activeStudentId : activeCoachId,
        student_id: activeStudentId,
        message_text: newMessageText.trim(),
        image_url: newImageAttachment || null,
        subject: selectedSubject,
      });

      setMessages((prev) => [...prev, sent]);
      setNewMessageText('');
      setNewImageAttachment('');
      setShowAttachInput(false);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  // Handle Book Appointment
  const handleBookAppointment = async () => {
    if (!bookingModalApp || !user) return;
    try {
      await coachingHubService.bookAppointment(
        bookingModalApp.id,
        user.id,
        user.full_name || 'Öğrenci',
        bookingNote
      );
      setBookingModalApp(null);
      setBookingNote('');
      await loadConversationData();
    } catch (err) {
      console.error('Book appointment error:', err);
    }
  };

  // Handle Cancel Appointment
  const handleCancelAppointment = async (appId: string) => {
    try {
      await coachingHubService.cancelAppointment(appId);
      await loadConversationData();
    } catch (err) {
      console.error('Cancel appointment error:', err);
    }
  };

  // Handle Create Appointment Slot (Coach)
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coachingHubService.createAppointmentSlot({
        coach_id: user?.id || 'coach-id',
        coach_name: user?.full_name || 'Eğitim Koçu',
        appointment_date: newSlotDate,
        start_time: newSlotStart,
        end_time: newSlotEnd,
        duration_minutes: 30,
        meeting_title: 'Birebir Haftalık Değerlendirme',
        meeting_link: 'https://meet.google.com/karne-yks',
        status: 'available',
        student_id: null,
        student_name: null,
      });
      setShowNewSlotModal(false);
      await loadConversationData();
    } catch (err) {
      console.error('Create slot error:', err);
    }
  };

  // Handle Create Task (Coach)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeStudentId) return;

    try {
      await coachingHubService.createTask({
        coach_id: user?.id || 'coach-id',
        coach_name: user?.full_name || 'Eğitim Koçu',
        student_id: activeStudentId,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        subject: newTaskSubject,
        target_question_count: newTaskQuestions,
        target_book: newTaskBook.trim() || undefined,
        due_date: newTaskDueDate,
        status: 'pending',
        priority: newTaskPriority,
      });

      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowNewTaskModal(false);
      await loadConversationData();
    } catch (err) {
      console.error('Create task error:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await coachingHubService.updateTaskStatus(taskId, status);
      await loadConversationData();
    } catch (err) {
      console.error('Update task status error:', err);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoachCode(true);
    setTimeout(() => setCopiedCoachCode(false), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div id="coaching-hub-view" className="space-y-6 max-w-6xl mx-auto apple-animate-in pb-12">
      {/* 1. Header Banner & Apple Navigation */}
      <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-black/[0.06] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
                Koçluk & Canlı Mesajlaşma
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#34C759]/10 text-[#34C759] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                <span>Yetkili Birebir Kanal</span>
              </span>
            </div>
            <p className="text-xs text-[#86868B] mt-1">
              {isCoach
                ? 'Yalnızca davet kodunuzla kayıt olan veya size atanan öğrencilerle mesajlaşma ve soru çözümü.'
                : 'Yalnızca davet koduyla eşleştiğiniz koçunuzla birebir canlı soru iletimi ve görüşme.'}
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls (Apple Segmented Style) */}
        <div className="apple-segmented-control p-1 self-start md:self-auto flex items-center gap-1">
          <button
            type="button"
            id="tab-btn-chat"
            onClick={() => setActiveTab('chat')}
            className={`py-2 px-3.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'apple-segmented-item-active text-[#1D1D1F]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Mesajlaşma ({messages.length})</span>
          </button>

          <button
            type="button"
            id="tab-btn-appointments"
            onClick={() => setActiveTab('appointments')}
            className={`py-2 px-3.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'appointments'
                ? 'apple-segmented-item-active text-[#1D1D1F]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#FF9500]" />
            <span>Görüşme Takvimi</span>
          </button>

          <button
            type="button"
            id="tab-btn-tasks"
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-3.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tasks'
                ? 'apple-segmented-item-active text-[#1D1D1F]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#34C759]" />
            <span>Ödev & Görevler ({tasks.filter((t) => t.status !== 'completed').length})</span>
          </button>
        </div>
      </div>

      {/* 2. CASE A: STUDENT WITHOUT MATCHED COACH -> MANDATORY CODE ENTRY */}
      {!isCoach && !user?.assigned_coach_id && (
        <div className="bento-card p-6 sm:p-8 bg-white border border-[#DFD9CC] rounded-[24px] shadow-xs max-w-xl mx-auto text-center space-y-5">
          <div className="w-14 h-14 rounded-3xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-[#1B2A4A]">
              Koç Davet Kodu ile Eşleşin
            </h2>
            <p className="text-xs text-[#7E8D9F] leading-relaxed max-w-md mx-auto">
              Gizlilik ve güvenlik kuralları gereği, koçluk mesajlaşması yalnızca kendi koçunuzun size ilettiği davet koduyla eşleştiğinizde aktifleşir. Bilgileriniz hiçbir yabancı koç tarafından görüntülenemez.
            </p>
          </div>

          <form onSubmit={handleMatchWithCoachCode} className="space-y-4 max-w-md mx-auto">
            <div className="text-left">
              <label className="text-xs font-bold text-[#1B2A4A] block mb-1.5">
                Koçunuzun Davet Kodu
              </label>
              <input
                type="text"
                value={inputCoachCode}
                onChange={(e) => setInputCoachCode(e.target.value.toUpperCase())}
                placeholder="Örn: SELIN-KOC veya YKS-KOC-XXXX"
                className="apple-input w-full py-3 px-4 text-sm font-mono tracking-wider text-center uppercase"
                required
              />
            </div>

            {matchingError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{matchingError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={matchingLoading || !inputCoachCode.trim()}
              className="apple-btn-primary w-full py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {matchingLoading ? (
                <span>Kod Doğrulanıyor...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kodu Doğrula ve Koçumla Eşleş</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-[#7E8D9F]">
            Koçunuzun kodunu henüz almadıysanız rehber öğretmeninizden talep ediniz.
          </p>
        </div>
      )}

      {/* 2. CASE B: STUDENT WITH MATCHED COACH -> BANNER OF ASSIGNED COACH */}
      {!isCoach && user?.assigned_coach_id && (
        <div className="p-4 sm:p-5 bg-white border border-[#DFD9CC] rounded-[22px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0071E3] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {matchedCoach ? getInitials(matchedCoach.full_name) : 'KO'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-[#1B2A4A]">
                  {matchedCoach ? matchedCoach.full_name : user.assigned_coach_name || 'Eğitim Koçunuz'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Eşleşmiş Koçunuz</span>
                </span>
              </div>
              <p className="text-xs text-[#7E8D9F] mt-0.5">
                {matchedCoach?.coaching_specialty || 'YKS Eğitim Koçu & Danışmanı'} • Yalnızca bu koçunuzla birebir iletişimdesiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#7E8D9F] bg-[#F5F5F7] px-3 py-1.5 rounded-xl border border-black/[0.04]">
            <KeyRound className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Koç Kodu: <strong>{matchedCoach?.coach_code || 'KAYITLI'}</strong></span>
          </div>
        </div>
      )}

      {/* 2. CASE C: COACH PERSPECTIVE -> STUDENT SELECTOR OR EMPTY INVITE CODE BANNER */}
      {isCoach && (
        <div className="p-5 bg-white border border-[#DFD9CC] rounded-[22px] shadow-xs space-y-4">
          {assignedStudents.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#1B2A4A]">
                  Henüz Davet Kodunuzla Kayıt Olan Öğrenci Yok
                </h3>
                <p className="text-xs text-[#7E8D9F] max-w-md mx-auto">
                  Gizlilik gereği yalnızca sizin kodunuzla kaydolan veya yönetim tarafından size atanan öğrenciler burada listelenir.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="px-4 py-2 bg-[#F5F5F7] rounded-xl font-mono text-xs font-bold text-[#0071E3] border border-black/[0.06]">
                  {user?.coach_code || 'SELIN-KOC'}
                </div>
                <button
                  type="button"
                  onClick={() => copyCode(user?.coach_code || 'SELIN-KOC')}
                  className="apple-btn-secondary py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCoachCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCoachCode ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0071E3]" />
                <span className="text-xs font-bold text-[#1B2A4A]">
                  Mesajlaşılacak Kayıtlı Öğrenciniz ({assignedStudents.length}):
                </span>
              </div>

              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="apple-input py-2 px-3.5 text-xs font-bold bg-white cursor-pointer"
              >
                {assignedStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.field}) • {st.targetDepartment || 'Bölüm'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 1: BİREBİR CANLI MESAJLAŞMA & SORU SORMA */}
      {activeTab === 'chat' && (!(!isCoach && !user?.assigned_coach_id)) && (
        <div className="bento-card bg-white rounded-[24px] border border-black/[0.06] shadow-xs overflow-hidden flex flex-col h-[650px]">
          {/* Chat Top Info Bar */}
          <div className="p-4 px-6 bg-[#F5F5F7] border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0071E3] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {isCoach
                  ? (assignedStudents.find((s) => s.id === selectedStudentId)?.name.substring(0, 2).toUpperCase() || 'ÖG')
                  : (matchedCoach ? getInitials(matchedCoach.full_name) : 'KO')}
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <span>
                    {isCoach
                      ? (assignedStudents.find((s) => s.id === selectedStudentId)?.name || 'Öğrenci Seçilmedi')
                      : (matchedCoach ? matchedCoach.full_name : user?.assigned_coach_name || 'Eğitim Koçunuz')}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#34C759]" title="Aktif" />
                </h3>
                <p className="text-[11px] text-[#86868B]">
                  {isCoach
                    ? 'Birebir Koçluk & Soru Çözüm Hattı'
                    : `${matchedCoach?.coaching_specialty || 'YKS Koçu'} • Birebir Soru Mesajlaşması`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#86868B]">
              <span className="hidden sm:inline">Ders / Konu:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="apple-input py-1.5 px-3 text-xs font-semibold cursor-pointer bg-white"
              >
                <option value="Genel">Genel / Rehberlik & Strateji</option>
                <option value="Matematik">Matematik</option>
                <option value="Geometri">Geometri</option>
                <option value="Fizik">Fizik</option>
                <option value="Kimya">Kimya</option>
                <option value="Biyoloji">Biyoloji</option>
                <option value="Türkçe">Türkçe / Paragraf</option>
                <option value="Sosyal">Sosyal Bilimler</option>
              </select>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 bg-white">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-[#86868B] px-1 font-medium">
                    <span className="font-semibold text-[#1D1D1F]">{msg.sender_name}</span>
                    <span>•</span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.subject && (
                      <span className="bg-[#F5F5F7] px-2 py-0.5 rounded-full text-[#1D1D1F] font-semibold border border-black/[0.04]">
                        {msg.subject}
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed shadow-xs space-y-2 ${
                      isMine
                        ? 'bg-[#0071E3] text-white rounded-br-xs'
                        : 'bg-[#F5F5F7] text-[#1D1D1F] border border-black/[0.04] rounded-bl-xs'
                    }`}
                  >
                    {msg.image_url && (
                      <div className="rounded-xl overflow-hidden border border-black/[0.08]">
                        <img
                          src={msg.image_url}
                          alt="Soru Görseli"
                          referrerPolicy="no-referrer"
                          className="w-full max-h-60 object-cover rounded-lg hover:scale-102 transition-transform cursor-pointer"
                          onClick={() => window.open(msg.image_url!, '_blank')}
                        />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message_text}</p>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && (
              <div className="text-center py-16 text-[#86868B]">
                <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[#1D1D1F]">
                  Henüz mesaj bulunmuyor. İlk mesajı yazarak sohbeti başlatın.
                </p>
                <p className="text-[11px] mt-1 max-w-sm mx-auto text-[#86868B]">
                  Çözemediğiniz soruların fotoğraf bağlantısını ekleyebilir, deneme sonuçlarınızı ve haftalık çalışma durumunuzu paylaşabilirsiniz.
                </p>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#F5F5F7] border-t border-black/[0.06] space-y-2">
            {showAttachInput && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-black/[0.08] shadow-2xs">
                <ImageIcon className="w-4 h-4 text-[#0071E3]" />
                <input
                  type="url"
                  placeholder="Soru görseli / ekran görüntüsü bağlantı linki (URL)..."
                  value={newImageAttachment}
                  onChange={(e) => setNewImageAttachment(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[#1D1D1F] outline-hidden placeholder-[#86868B]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachInput(false);
                    setNewImageAttachment('');
                  }}
                  className="text-xs text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-attach-question-img"
                onClick={() => setShowAttachInput(!showAttachInput)}
                className={`p-2.5 rounded-full border transition-colors cursor-pointer ${
                  showAttachInput || newImageAttachment
                    ? 'bg-[#0071E3] text-white border-[#0071E3]'
                    : 'bg-white text-[#86868B] border-black/[0.08] hover:text-[#1D1D1F]'
                }`}
                title="Soru Fotoğrafı Ekle"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                id="input-chat-message"
                placeholder={
                  isCoach
                    ? 'Öğrencinize mesajınızı veya çözüm tavsiyenizi yazın...'
                    : 'Koçunuza sorunuzu veya çalışma durumunuzu yazın...'
                }
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="apple-input flex-1 py-2.5 px-4 text-xs bg-white"
              />

              <button
                type="submit"
                id="btn-send-chat-msg"
                disabled={!newMessageText.trim() && !newImageAttachment}
                className="apple-btn-primary py-2.5 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>Gönder</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. TAB 2: HAFTALIK GÖRÜŞME TAKVİMİ (APPOINTMENTS) */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-black/[0.06] shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0071E3]" />
                <span>Birebir Koçluk Seansları</span>
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                {isCoach
                  ? 'Öğrencileriniz için tanımladığınız 30 dakikalık görüşme slotları.'
                  : 'Koçunuzla birebir haftalık planlama ve değerlendirme randevusu.'}
              </p>
            </div>

            {isCoach && (
              <button
                type="button"
                id="btn-create-slot"
                onClick={() => setShowNewSlotModal(true)}
                className="apple-btn-primary py-2 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Müsaitlik Saati Ekle</span>
              </button>
            )}
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {appointments.map((app) => {
              const isBookedByMe = app.status === 'booked' && app.student_id === user?.id;
              const isAvailable = app.status === 'available';

              return (
                <div
                  key={app.id}
                  className={`p-5 rounded-[22px] border transition-all flex flex-col justify-between ${
                    isBookedByMe
                      ? 'bg-[#0071E3]/5 border-[#0071E3] shadow-xs'
                      : 'bg-white border-black/[0.06] hover:border-black/[0.12]'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAvailable
                            ? 'bg-[#34C759]/10 text-[#34C759]'
                            : 'bg-[#FF9500]/10 text-[#FF9500]'
                        }`}
                      >
                        {isAvailable ? 'Boş Slot' : 'Dolu Randevu'}
                      </span>

                      <span className="text-[11px] font-semibold text-[#86868B] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{app.duration_minutes} Dk</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#1D1D1F]">{app.meeting_title}</h4>
                    <p className="text-[11px] text-[#86868B]">Koç: {app.coach_name}</p>

                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-[#1D1D1F]">
                        <span>Tarih:</span>
                        <span>{app.appointment_date}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold text-[#1D1D1F]">
                        <span>Saat:</span>
                        <span>
                          {app.start_time} - {app.end_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.04]">
                    {!isCoach && isAvailable && (
                      <button
                        type="button"
                        onClick={() => setBookingModalApp(app)}
                        className="apple-btn-primary w-full py-2 text-xs font-semibold rounded-full cursor-pointer"
                      >
                        Randevu Al
                      </button>
                    )}

                    {!isCoach && isBookedByMe && (
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(app.id)}
                        className="w-full py-2 text-xs font-semibold rounded-full text-rose-600 bg-rose-50 hover:bg-rose-100 cursor-pointer"
                      >
                        Randevuyu İptal Et
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {appointments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[24px] border border-black/[0.06] text-[#86868B]">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-[#0071E3]/40" />
              <p className="text-xs font-bold text-[#1D1D1F]">Henüz planlanmış randevu bulunmuyor.</p>
              <p className="text-[11px] mt-1">Koçunuz müsaitlik eklediğinde burada görüntülenecektir.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: ÖDEV & GÖREVLER (TASKS) */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-black/[0.06] shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#34C759]" />
                <span>Haftalık Ödevler & Görev Takibi</span>
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Koç tarafından atanan soru hedefleri, konu tamamlama ve deneme çözümleri.
              </p>
            </div>

            {isCoach && (
              <button
                type="button"
                onClick={() => setShowNewTaskModal(true)}
                className="apple-btn-primary py-2 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Ödev Ata</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed' || task.status === 'verified';

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-[22px] border transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-white border-black/[0.06]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3]">
                        {task.subject}
                      </span>
                      <span className="text-[11px] font-semibold text-[#86868B]">
                        Son: {task.due_date}
                      </span>
                    </div>

                    <h4
                      className={`text-sm font-bold ${
                        isCompleted ? 'line-through text-[#86868B]' : 'text-[#1D1D1F]'
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-[#86868B]">{task.description}</p>
                    )}

                    {task.target_question_count && (
                      <div className="text-xs font-semibold text-[#0071E3]">
                        Hedef: {task.target_question_count} Soru
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#86868B]">
                      {isCompleted ? '✓ Tamamlandı' : 'Bekliyor'}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateTaskStatus(task.id, isCompleted ? 'pending' : 'completed')
                      }
                      className={`py-1.5 px-3 rounded-full text-xs font-semibold cursor-pointer ${
                        isCompleted
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-[#34C759] text-white'
                      }`}
                    >
                      {isCompleted ? 'Geri Al' : 'Tamamla'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[24px] border border-black/[0.06] text-[#86868B]">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-[#34C759]/40" />
              <p className="text-xs font-bold text-[#1D1D1F]">Henüz atanmış ödev bulunmuyor.</p>
              <p className="text-[11px] mt-1">Koçunuz ödev atadığında burada listelenecektir.</p>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalApp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-black/[0.06] shadow-xl">
            <h3 className="text-sm font-bold text-[#1D1D1F]">Randevu Onayı</h3>
            <p className="text-xs text-[#86868B]">
              {bookingModalApp.appointment_date} günü saat {bookingModalApp.start_time} seansı için randevu alıyorsunuz.
            </p>

            <textarea
              rows={3}
              placeholder="Koçunuza iletmek istediğiniz özel bir not / soru konusu var mı?"
              value={bookingNote}
              onChange={(e) => setBookingNote(e.target.value)}
              className="apple-input w-full text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookingModalApp(null)}
                className="apple-btn-secondary py-2 px-4 text-xs font-semibold rounded-full cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleBookAppointment}
                className="apple-btn-primary py-2 px-4 text-xs font-semibold rounded-full cursor-pointer"
              >
                Onayla & Randevuyu Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Slot Modal (Coach) */}
      {showNewSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-black/[0.06] shadow-xl">
            <h3 className="text-sm font-bold text-[#1D1D1F]">Yeni Müsaitlik Saati Ekle</h3>
            <form onSubmit={handleCreateSlot} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Tarih</label>
                <input
                  type="date"
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  className="apple-input w-full text-xs font-semibold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Başlangıç</label>
                  <input
                    type="time"
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="apple-input w-full text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="apple-input w-full text-xs font-semibold"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSlotModal(false)}
                  className="apple-btn-secondary py-2 px-4 text-xs font-semibold rounded-full cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="apple-btn-primary py-2 px-4 text-xs font-semibold rounded-full cursor-pointer"
                >
                  Slotu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal (Coach) */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-black/[0.06] shadow-xl">
            <h3 className="text-sm font-bold text-[#1D1D1F]">Öğrenciye Ödev Ata</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Ödev Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: Limit & Süreklilik 60 Soru Çözümü"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="apple-input w-full text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Ders</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="apple-input w-full text-xs font-semibold cursor-pointer"
                  >
                    <option value="Matematik">Matematik</option>
                    <option value="Geometri">Geometri</option>
                    <option value="Fizik">Fizik</option>
                    <option value="Kimya">Kimya</option>
                    <option value="Biyoloji">Biyoloji</option>
                    <option value="Türkçe">Türkçe</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Soru Sayısı</label>
                  <input
                    type="number"
                    value={newTaskQuestions}
                    onChange={(e) => setNewTaskQuestions(Number(e.target.value))}
                    className="apple-input w-full text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Hedef Kitap / Fasikül</label>
                <input
                  type="text"
                  placeholder="Örn: Bilgi Sarmal AYT Fizik"
                  value={newTaskBook}
                  onChange={(e) => setNewTaskBook(e.target.value)}
                  className="apple-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Teslim Tarihi</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="apple-input w-full text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Öncelik</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="apple-input w-full text-xs font-semibold cursor-pointer"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Normal</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil 🔥</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Açıklama / Koç Talimatı</label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Süre tutarak çöz ve yanlışları kaydet..."
                  className="apple-input w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="apple-btn-secondary py-2 px-4 text-xs font-semibold rounded-full cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="apple-btn-primary py-2 px-4 text-xs font-semibold rounded-full cursor-pointer"
                >
                  Ödevi Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
