import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { coachingHubService } from '../lib/coachingHubService';
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
  Filter,
  Sparkles,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

export const CoachingHub: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.role === 'student' ? user.id : 'st-demo-001';
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'chat' | 'appointments' | 'tasks'>('chat');
  const [loading, setLoading] = useState<boolean>(true);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedMsgs, fetchedApps, fetchedTasks] = await Promise.all([
        coachingHubService.getMessages(studentId),
        coachingHubService.getAppointments(studentId),
        coachingHubService.getTasks(studentId),
      ]);
      setMessages(fetchedMsgs);
      setAppointments(fetchedApps);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Failed to load coaching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() && !newImageAttachment) return;

    try {
      const sent = await coachingHubService.sendMessage({
        sender_id: user?.id || 'st-demo-001',
        sender_name: user?.full_name || 'Öğrenci',
        sender_role: (user?.role as 'student' | 'coach') || 'student',
        receiver_id: isCoach ? studentId : 'coach-001',
        student_id: studentId,
        message_text: newMessageText.trim(),
        image_url: newImageAttachment || null,
        subject: selectedSubject,
      });

      setMessages((prev) => [...prev, sent]);
      setNewMessageText('');
      setNewImageAttachment('');
      setShowAttachInput(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Handle Book Appointment
  const handleBookAppointment = async () => {
    if (!bookingModalApp) return;
    try {
      await coachingHubService.bookAppointment(
        bookingModalApp.id,
        user?.id || 'st-demo-001',
        user?.full_name || 'Ali Yılmaz',
        bookingNote
      );
      setBookingModalApp(null);
      setBookingNote('');
      await loadData();
    } catch (err) {
      console.error('Failed to book appointment:', err);
    }
  };

  // Handle Cancel Appointment
  const handleCancelAppointment = async (appId: string) => {
    try {
      await coachingHubService.cancelAppointment(appId);
      await loadData();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  // Handle Create Appointment Slot (Coach)
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coachingHubService.createAppointmentSlot({
        coach_id: user?.id || 'coach-001',
        coach_name: user?.full_name || 'Ahmet Hoca (Koç)',
        appointment_date: newSlotDate,
        start_time: newSlotStart,
        end_time: newSlotEnd,
        duration_minutes: 30,
        meeting_title: 'Haftalık Koçluk Değerlendirmesi',
        meeting_link: 'https://meet.google.com/karne-yks-koc',
        status: 'available',
      });
      setShowNewSlotModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create slot:', err);
    }
  };

  // Handle Toggle Task Status
  const handleToggleTaskStatus = async (task: CoachingTask) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    try {
      const updated = await coachingHubService.updateTaskStatus(task.id, nextStatus);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Handle Create Task (Coach)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await coachingHubService.createTask({
        coach_id: user?.id || 'coach-001',
        coach_name: user?.full_name || 'Ahmet Hoca (Koç)',
        student_id: studentId,
        student_name: 'Ali Yılmaz',
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || null,
        subject: newTaskSubject,
        target_question_count: newTaskQuestions,
        target_book_title: newTaskBook.trim() || null,
        due_date: newTaskDueDate,
        priority: newTaskPriority,
        status: 'pending',
      });
      setShowNewTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskBook('');
      await loadData();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  return (
    <div id="coaching-hub-view" className="space-y-6 max-w-6xl mx-auto animate-in fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DFD9CC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white flex items-center justify-center shadow-sm shrink-0">
            <UserCheck className="w-7 h-7 text-[#D97736]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#1B2A4A] tracking-tight">
                Koçluk & Öğrenci İletişim Merkezi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#2E6B4F]/15 text-[#2E6B4F] border border-[#2E6B4F]/25 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2E6B4F] animate-pulse" />
                <span>Canlı Bağlantı</span>
              </span>
            </div>
            <p className="text-xs text-[#4A5B78] mt-1">
              Birebir soru sorma sohbeti, haftalık görüşme randevu takvimi ve koç ödev takip paneli.
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#F7F4EE] rounded-2xl border border-[#DFD9CC] self-start md:self-auto">
          <button
            type="button"
            id="tab-btn-chat"
            onClick={() => setActiveTab('chat')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#4A5B78] hover:text-[#1B2A4A]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#D97736]" />
            <span>Mesajlaşma & Soru ({messages.length})</span>
          </button>

          <button
            type="button"
            id="tab-btn-appointments"
            onClick={() => setActiveTab('appointments')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'appointments'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#4A5B78] hover:text-[#1B2A4A]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#255A8A]" />
            <span>Görüşme Takvimi</span>
          </button>

          <button
            type="button"
            id="tab-btn-tasks"
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#4A5B78] hover:text-[#1B2A4A]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#2E6B4F]" />
            <span>Ödev & Görevler ({tasks.filter((t) => t.status !== 'completed').length})</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: BİREBİR CANLI MESAJLAŞMA & SORU SORMA */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-xs overflow-hidden flex flex-col h-[650px]">
          {/* Chat Top Info Bar */}
          <div className="p-4 px-6 bg-[#F7F4EE] border-b border-[#DFD9CC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center font-black text-sm">
                AH
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1B2A4A] flex items-center gap-1.5">
                  <span>Ahmet Hoca (YKS Başkoçu)</span>
                  <span className="w-2 h-2 rounded-full bg-[#2E6B4F]" />
                </h3>
                <p className="text-[11px] text-[#7E8D9F]">Ortalama Yanıt Süresi: ~15 Dakika</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#4A5B78]">
              <span className="hidden sm:inline">Ders Seçimi:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white border border-[#DFD9CC] rounded-xl px-2.5 py-1 text-xs font-bold text-[#1B2A4A] focus:outline-hidden"
              >
                <option value="Genel">Genel / Rehberlik</option>
                <option value="Matematik">Matematik</option>
                <option value="Geometri">Geometri</option>
                <option value="Fizik">Fizik</option>
                <option value="Kimya">Kimya</option>
                <option value="Biyoloji">Biyoloji</option>
                <option value="Türkçe">Türkçe / Paragraf</option>
              </select>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FAF8F5]">
            {messages.map((msg) => {
              const isMine =
                (user?.role === 'coach' && msg.sender_role === 'coach') ||
                (user?.role !== 'coach' && msg.sender_role === 'student');

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-[#7E8D9F] px-1 font-semibold">
                    <span>{msg.sender_name}</span>
                    <span>•</span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.subject && (
                      <span className="bg-[#DFD9CC]/50 px-1.5 py-0.2 rounded text-[#1B2A4A] font-bold">
                        {msg.subject}
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed shadow-2xs space-y-2 ${
                      isMine
                        ? 'bg-[#1B2A4A] text-white rounded-br-xs'
                        : 'bg-white text-[#1B2A4A] border border-[#DFD9CC] rounded-bl-xs'
                    }`}
                  >
                    {msg.image_url && (
                      <div className="rounded-xl overflow-hidden border border-white/20">
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
              <div className="text-center py-12 text-[#7E8D9F]">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-[#1B2A4A]">Henüz mesajlaşma başlatılmadı.</p>
                <p className="text-[11px]">Koçunuza takıldığınız soruları ve notlarınızı buradan yazabilirsiniz.</p>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#DFD9CC] space-y-2">
            {showAttachInput && (
              <div className="flex items-center gap-2 p-2 bg-[#F7F4EE] rounded-xl border border-[#DFD9CC]">
                <ImageIcon className="w-4 h-4 text-[#D97736]" />
                <input
                  type="url"
                  placeholder="Soru görseli / ekran görüntüsü bağlantı linki (URL)..."
                  value={newImageAttachment}
                  onChange={(e) => setNewImageAttachment(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[#1B2A4A] outline-hidden placeholder-[#7E8D9F]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachInput(false);
                    setNewImageAttachment('');
                  }}
                  className="text-xs text-[#7E8D9F] hover:text-[#1B2A4A]"
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
                className={`p-2.5 rounded-xl border transition-colors ${
                  showAttachInput || newImageAttachment
                    ? 'bg-[#D97736] text-white border-[#D97736]'
                    : 'bg-[#F7F4EE] text-[#4A5B78] border-[#DFD9CC] hover:bg-[#EFEBE0]'
                }`}
                title="Soru Fotoğrafı Ekle"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                id="input-chat-message"
                placeholder="Koçunuza mesaj yazın veya sorunuzun püf noktasını sorun..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs text-[#1B2A4A] placeholder-[#7E8D9F] focus:outline-hidden focus:border-[#1B2A4A]"
              />

              <button
                type="submit"
                id="btn-send-chat-msg"
                disabled={!newMessageText.trim() && !newImageAttachment}
                className="py-2.5 px-4 rounded-xl bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>Gönder</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. TAB 2: HAFTALIK GÖRÜŞME TAKVİMİ (APPOINTMENTS) */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#DFD9CC]">
            <div>
              <h2 className="text-base font-extrabold text-[#1B2A4A] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#255A8A]" />
                <span>Haftalık Birebir Koçluk Seansları</span>
              </h2>
              <p className="text-xs text-[#7E8D9F] mt-0.5">
                Koçunuzun müsait olduğu 30 dakikalık canlı Google Meet / Zoom değerlendirme slotları.
              </p>
            </div>

            {isCoach && (
              <button
                type="button"
                id="btn-create-slot"
                onClick={() => setShowNewSlotModal(true)}
                className="py-2 px-3.5 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#1B2A4A]/90"
              >
                <Plus className="w-4 h-4 text-[#D97736]" />
                <span>Yeni Müsaitlik Saati Ekle</span>
              </button>
            )}
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {appointments.map((app) => {
              const isBookedByMe = app.status === 'booked' && app.student_id === studentId;
              const isAvailable = app.status === 'available';

              return (
                <div
                  key={app.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    isBookedByMe
                      ? 'bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white border-[#1B2A4A] shadow-sm'
                      : isAvailable
                      ? 'bg-white border-[#DFD9CC] shadow-xs hover:border-[#255A8A]'
                      : 'bg-[#F7F4EE] border-[#DFD9CC] opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isBookedByMe
                            ? 'bg-[#D97736] text-white'
                            : isAvailable
                            ? 'bg-[#2E6B4F]/15 text-[#2E6B4F] border border-[#2E6B4F]/30'
                            : 'bg-[#7E8D9F]/20 text-[#7E8D9F]'
                        }`}
                      >
                        {isBookedByMe ? 'Randevun Ayrıldı' : isAvailable ? 'Müsait Slot' : 'Dolu'}
                      </span>
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isBookedByMe ? 'text-gray-200' : 'text-[#7E8D9F]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{app.duration_minutes} Dk</span>
                      </span>
                    </div>

                    <div>
                      <h3
                        className={`text-sm font-extrabold ${
                          isBookedByMe ? 'text-white' : 'text-[#1B2A4A]'
                        }`}
                      >
                        {app.meeting_title}
                      </h3>
                      <p
                        className={`text-xs font-bold mt-1 ${
                          isBookedByMe ? 'text-[#D97736]' : 'text-[#255A8A]'
                        }`}
                      >
                        📅 {app.appointment_date} • ⏰ {app.start_time} - {app.end_time}
                      </p>
                    </div>

                    {app.student_note && (
                      <p
                        className={`text-[11px] p-2.5 rounded-xl ${
                          isBookedByMe
                            ? 'bg-white/10 text-gray-200'
                            : 'bg-[#F7F4EE] text-[#4A5B78]'
                        }`}
                      >
                        <strong>Not:</strong> {app.student_note}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between gap-2">
                    {isBookedByMe && (
                      <>
                        {app.meeting_link && (
                          <a
                            href={app.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="py-1.5 px-3 rounded-xl bg-white text-[#1B2A4A] text-xs font-bold flex items-center gap-1 hover:bg-gray-100 transition-colors shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5 text-[#2E6B4F]" />
                            <span>Görüşmeye Katıl</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(app.id)}
                          className="py-1.5 px-2.5 text-xs text-red-200 hover:text-white font-bold"
                        >
                          İptal Et
                        </button>
                      </>
                    )}

                    {isAvailable && (
                      <button
                        type="button"
                        id={`btn-book-${app.id}`}
                        onClick={() => setBookingModalApp(app)}
                        className="w-full py-2 px-3 rounded-xl bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#D97736]" />
                        <span>Bu Saati Rezerve Et</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {appointments.length === 0 && (
            <div className="p-8 text-center bg-[#FAF8F5] rounded-3xl border border-dashed border-[#DFD9CC] space-y-3">
              <Calendar className="w-10 h-10 text-[#7E8D9F] mx-auto opacity-50" />
              <p className="text-xs font-bold text-[#1B2A4A]">Henüz planlanmış veya müsait koçluk seansı bulunmuyor.</p>
              <p className="text-[11px] text-[#7E8D9F] max-w-md mx-auto">
                {isCoach
                  ? 'Öğrencilerinizin rezervasyon yapabilmesi için yeni müsaitlik saatleri ekleyebilirsiniz.'
                  : 'Koçunuz müsaitlik saatlerini açtığında buradan 15-30 dakikalık değerlendirme seansı rezerve edebilirsiniz.'}
              </p>
              {isCoach && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewSlotModal(true)}
                    className="py-2 px-4 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-[#D97736]" />
                    <span>Müsaitlik Saati Ekle</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 3: ÖDEV & GÖREV ATAMA SİSTEMİ (TASKS) */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#DFD9CC]">
            <div>
              <h2 className="text-base font-extrabold text-[#1B2A4A] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#2E6B4F]" />
                <span>Koçun Tanımladığı Haftalık Hedef ve Ödevler</span>
              </h2>
              <p className="text-xs text-[#7E8D9F] mt-0.5">
                Teslim tarihli soru hedefleri, fasikül ödevleri ve tarama testleri.
              </p>
            </div>

            {isCoach && (
              <button
                type="button"
                id="btn-new-task-modal"
                onClick={() => setShowNewTaskModal(true)}
                className="py-2 px-3.5 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#1B2A4A]/90"
              >
                <Plus className="w-4 h-4 text-[#D97736]" />
                <span>Öğrenciye Yeni Ödev Ata</span>
              </button>
            )}
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed' || task.status === 'verified';

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-[#F7F4EE]/60 border-[#DFD9CC] opacity-80'
                      : 'bg-white border-[#DFD9CC] shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      id={`btn-check-task-${task.id}`}
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-[#2E6B4F] border-[#2E6B4F] text-white'
                          : 'border-[#DFD9CC] hover:border-[#2E6B4F] text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm font-extrabold ${
                            isCompleted
                              ? 'line-through text-[#7E8D9F]'
                              : 'text-[#1B2A4A]'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#1B2A4A]/10 text-[#1B2A4A]">
                          {task.subject}
                        </span>
                        {task.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#C0392B]/15 text-[#C0392B]">
                            Acil
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#4A5B78] mt-1">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#7E8D9F] mt-2">
                        {task.target_book_title && (
                          <span className="flex items-center gap-1 text-[#255A8A] font-semibold">
                            <BookOpen className="w-3.5 h-3.5" />
                            {task.target_book_title}
                          </span>
                        )}
                        {task.target_question_count && (
                          <span className="font-semibold text-[#1B2A4A]">
                            🎯 Hedef: {task.target_question_count} Soru
                          </span>
                        )}
                        <span>📅 Son Tarih: {task.due_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-[#2E6B4F]/15 text-[#2E6B4F] border border-[#2E6B4F]/30'
                          : 'bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90'
                      }`}
                    >
                      {isCompleted ? '✓ Tamamlandı' : 'Tamamlandı Olarak İşaretle'}
                    </button>
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="p-8 text-center bg-[#F7F4EE] rounded-3xl border border-[#DFD9CC]">
                <CheckSquare className="w-10 h-10 text-[#7E8D9F] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-[#1B2A4A]">Şu an atanmış aktif ödev bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL: BOOK APPOINTMENT */}
      {bookingModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#DFD9CC] shadow-xl p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setBookingModalApp(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#7E8D9F] hover:bg-[#F7F4EE]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#1B2A4A] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#255A8A]" />
              <span>Koçluk Seansı Rezerve Et</span>
            </h3>

            <p className="text-xs text-[#7E8D9F] mt-1">
              {bookingModalApp.appointment_date} saat {bookingModalApp.start_time} - {bookingModalApp.end_time} arasındaki görüşme.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#1B2A4A] block mb-1">
                  Koça İletmek İstediğin Özel Not / Konu Başlığı
                </label>
                <textarea
                  rows={3}
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  placeholder="Örn: Bu hafta TYT Türkçe netlerimi ve Geometri çalışma sıklığımı değerlendirmek istiyorum..."
                  className="w-full p-3 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs text-[#1B2A4A] outline-hidden focus:border-[#1B2A4A]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModalApp(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#DFD9CC] text-xs font-bold text-[#4A5B78] hover:bg-[#F7F4EE]"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  id="btn-confirm-appointment"
                  onClick={handleBookAppointment}
                  className="flex-1 py-2.5 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold hover:bg-[#1B2A4A]/90 shadow-xs"
                >
                  Randevuyu Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: CREATE APPOINTMENT SLOT (COACH) */}
      {showNewSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#DFD9CC] shadow-xl p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setShowNewSlotModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#7E8D9F] hover:bg-[#F7F4EE]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#1B2A4A]">Yeni Müsaitlik Saati Ekle</h3>
            <form onSubmit={handleCreateSlot} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Tarih</label>
                <input
                  type="date"
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Başlangıç</label>
                  <input
                    type="time"
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold hover:bg-[#1B2A4A]/90 shadow-xs"
                >
                  Slotu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: CREATE TASK (COACH) */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#DFD9CC] shadow-xl p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setShowNewTaskModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#7E8D9F] hover:bg-[#F7F4EE]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#1B2A4A]">Öğrenciye Yeni Görev / Ödev Tanımla</h3>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Ödev Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: 3D Geometri Çemberde Açı 3 Test"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs text-[#1B2A4A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Ders</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold"
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
                  <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Soru Sayısı</label>
                  <input
                    type="number"
                    value={newTaskQuestions}
                    onChange={(e) => setNewTaskQuestions(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Hedef Kitap / Fasikül</label>
                <input
                  type="text"
                  placeholder="Örn: Bilgi Sarmal AYT Fizik"
                  value={newTaskBook}
                  onChange={(e) => setNewTaskBook(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Teslim Tarihi</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Öncelik</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Normal</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil 🔥</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1B2A4A] block mb-1">Açıklama / Koç Talimatı</label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Süre tutarak çöz ve yanlışları kaydet..."
                  className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold hover:bg-[#1B2A4A]/90 shadow-xs"
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
