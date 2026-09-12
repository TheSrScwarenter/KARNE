import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  coachService,
  CoachStudent,
  CustomGoal,
  CoachNote,
} from '../lib/coachService';
import {
  Users,
  UserCheck,
  UserPlus,
  Copy,
  Check,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  HelpCircle,
  Target,
  FileText,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Award,
  ChevronRight,
  X,
  Send,
  GraduationCap,
  Flame,
  ArrowUpRight,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Exam, StudySession, WrongQuestion, StudentBook } from '../types';
import { booksService } from '../lib/booksService';
import { examsService } from '../lib/examsService';
import { BookDetailModal } from '../components/BookDetailModal';
import { ExamDetailModal } from '../components/ExamDetailModal';
import { StudentProgramCoachBuilder } from '../components/StudentProgramCoachBuilder';
import { BookOpen } from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const { user, navigate } = useAuth();
  const [students, setStudents] = useState<CoachStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Invite code state
  const [inviteCode, setInviteCode] = useState(user?.coach_code || 'SELIN-KOC');
  const [copied, setCopied] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<CoachStudent | null>(null);
  const [detailTab, setDetailTab] = useState<'exams' | 'study' | 'wrong' | 'goals' | 'notes' | 'books' | 'program'>('program');
  const [studentDetailedData, setStudentDetailedData] = useState<{
    exams: Exam[];
    studySessions: StudySession[];
    wrongQuestions: WrongQuestion[];
  } | null>(null);
  const [studentBooks, setStudentBooks] = useState<StudentBook[]>([]);
  const [selectedBookForCoach, setSelectedBookForCoach] = useState<StudentBook | null>(null);
  const [selectedExamForCoachModal, setSelectedExamForCoachModal] = useState<Exam | null>(null);

  // New Student Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentField, setNewStudentField] = useState<'SAY' | 'EA' | 'SÖZ' | 'DİL'>('SAY');
  const [newStudentTargetDept, setNewStudentTargetDept] = useState('');
  const [newStudentTargetRank, setNewStudentTargetRank] = useState('');

  // New Goal Form in Detail Modal
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'deneme' | 'soru' | 'konu' | 'sure'>('deneme');
  const [goalTargetValue, setGoalTargetValue] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // New Note Form in Detail Modal
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('Strateji');

  // Load Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const list = await coachService.getStudents(
        user?.id,
        user?.coach_code,
        user?.role === 'admin'
      );
      setStudents(list);
    } catch (e) {
      console.error('Students load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.coach_code) {
      setInviteCode(user.coach_code);
    }
    fetchStudents();
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCode = () => {
    const code = 'YKS-KOC-' + Math.floor(1000 + Math.random() * 9000);
    setInviteCode(code);
  };

  const handleApprove = async (studentId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await coachService.approveStudent(studentId);
      await fetchStudents();
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent((prev) => prev ? { ...prev, status: 'approved' } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (studentId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await coachService.rejectStudent(studentId);
      await fetchStudents();
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    try {
      await coachService.addStudentByInvite(
        inviteCode,
        newStudentName,
        newStudentField,
        newStudentTargetDept || 'Hedef Bölüm',
        newStudentTargetRank || 'İlk 10.000'
      );
      setNewStudentName('');
      setNewStudentTargetDept('');
      setNewStudentTargetRank('');
      setShowAddModal(false);
      await fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const openStudentDetail = async (st: CoachStudent) => {
    setSelectedStudent(st);
    try {
      const data = await coachService.getStudentDetailedData(
        st.id,
        user?.id,
        user?.coach_code,
        user?.role === 'admin'
      );
      setStudentDetailedData(data);
      const bList = await booksService.getBooks(st.id);
      setStudentBooks(bList);
    } catch (e) {
      console.error('Failed to load student detailed data', e);
    }
  };

  const handleToggleGoal = async (goalId: string) => {
    if (!selectedStudent) return;
    await coachService.toggleCustomGoal(selectedStudent.id, goalId);
    const updated = await coachService.getStudentById(selectedStudent.id);
    if (updated) setSelectedStudent(updated);
    await fetchStudents();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!selectedStudent) return;
    await coachService.deleteCustomGoal(selectedStudent.id, goalId);
    const updated = await coachService.getStudentById(selectedStudent.id);
    if (updated) setSelectedStudent(updated);
    await fetchStudents();
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !goalTitle.trim()) return;

    await coachService.addCustomGoal(selectedStudent.id, {
      title: goalTitle,
      category: goalCategory,
      targetValue: goalTargetValue || 'Hedef',
      deadline: goalDeadline || 'Yakında',
    });

    setGoalTitle('');
    setGoalTargetValue('');
    setGoalDeadline('');
    setShowAddGoalModal(false);

    const updated = await coachService.getStudentById(selectedStudent.id);
    if (updated) setSelectedStudent(updated);
    await fetchStudents();
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newNoteTitle.trim() || !newNoteContent.trim()) return;

    await coachService.addCoachNote(selectedStudent.id, {
      title: newNoteTitle,
      content: newNoteContent,
      tag: newNoteTag,
    });

    setNewNoteTitle('');
    setNewNoteContent('');
    const updated = await coachService.getStudentById(selectedStudent.id);
    if (updated) setSelectedStudent(updated);
    await fetchStudents();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedStudent) return;
    await coachService.deleteCoachNote(selectedStudent.id, noteId);
    const updated = await coachService.getStudentById(selectedStudent.id);
    if (updated) setSelectedStudent(updated);
    await fetchStudents();
  };

  // Filter students
  const filteredStudents = students.filter((st) => {
    const matchesStatus =
      filterStatus === 'all' ? true : st.status === filterStatus;
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.targetDepartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.targetRank.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Role Guard for Students
  if (user?.role === 'student') {
    return (
      <div className="bento-card p-12 text-center bg-white space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-[#1B2A4A]">Öğrenci Yönetim Masası</h3>
        <p className="text-xs text-[#4A5B78] leading-relaxed">
          Bu alan yalnızca Koç ve Eğitmen hesaplarının öğrenci listelerini ve deneme istatistiklerini yönetmesi içindir. Kendi hazırlık sürecinizi görüntülemek için Öğrenci Paneli'ni kullanabilirsiniz.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="py-2.5 px-5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#255A8A]"
          >
            Öğrenci Paneline Dön
          </button>
          <button
            type="button"
            onClick={() => navigate('/coaching')}
            className="py-2.5 px-5 bg-white text-[#1B2A4A] border border-[#DFD9CC] text-xs font-bold rounded-xl hover:bg-gray-50"
          >
            Koçluk Masası
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="students-management-page" className="space-y-6">
      {/* Top Banner & Invite Code Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Title Bento (Span 2) */}
        <div className="lg:col-span-2 bento-card p-6 md:p-8 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-caveat text-xl text-[#2E6B4F] font-bold">
                Öğrenci Yönetimi & Başarı Takibi
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#2E6B4F]/10 text-[#2E6B4F] font-bold border border-[#2E6B4F]/20">
                Faz 6 Devrede
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1B2A4A] tracking-tight">
              Öğrencilerim & Rehberlik Masası 🧑‍🏫
            </h2>
            <p className="text-sm text-[#4A5B78] mt-2 max-w-xl leading-relaxed">
              Öğrencilerinin çalışma sürelerini, yanlış soru analizlerini ve deneme grafiklerini incele; özel hedefler belirleyerek gelişimlerini yakından yönet.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#DFD9CC]/60 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#4A5B78]">
            <span className="flex items-center gap-1.5 text-[#1B2A4A]">
              <Users className="w-4 h-4 text-[#255A8A]" />
              Toplam: {students.length} Öğrenci
            </span>
            <span className="text-[#DFD9CC]">•</span>
            <span className="text-[#2E6B4F]">
              {students.filter((s) => s.status === 'approved').length} Onaylı
            </span>
            <span className="text-[#DFD9CC]">•</span>
            <span className="text-[#D97736]">
              {students.filter((s) => s.status === 'pending').length} Onay Bekleyen
            </span>
          </div>
        </div>

        {/* Invite Code & Add Student Widget (Span 1) */}
        <div className="bento-card p-6 bg-gradient-to-br from-white to-[#F7F4EE] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#4A5B78]">
                Koç Davet Kodu
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D97736]/10 text-[#D97736]">
                YKS 2026
              </span>
            </div>

            <div className="my-3.5 p-3 rounded-2xl bg-white border border-[#DFD9CC] text-center shadow-xs">
              <p className="text-xl font-mono font-black text-[#1B2A4A] tracking-widest">
                {inviteCode}
              </p>
              <p className="text-[10px] text-[#7E8D9F] mt-1">
                Öğrenciler bu kodu girerek koçluk grubuna dahil olabilir.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                id="btn-copy-invite"
                onClick={handleCopyCode}
                className="flex-1 py-2.5 text-xs font-extrabold bg-[#1B2A4A] text-white rounded-xl hover:bg-[#255A8A] transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2E6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
              </button>
              <button
                id="btn-new-code"
                onClick={handleGenerateCode}
                title="Yeni Kod Üret"
                className="p-2.5 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A] bg-white border border-[#DFD9CC] rounded-xl hover:bg-[#EFEBE0] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              id="btn-open-add-student"
              onClick={() => setShowAddModal(true)}
              className="w-full py-2 text-xs font-bold text-[#1B2A4A] bg-[#EFEBE0] hover:bg-[#1B2A4A] hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-[#DFD9CC]"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#D97736]" />
              <span>Manuel Öğrenci Kaydet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              filterStatus === 'all'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
            }`}
          >
            Tümü ({students.length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              filterStatus === 'approved'
                ? 'bg-[#2E6B4F] text-white shadow-xs'
                : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
            }`}
          >
            Onaylı ({students.filter((s) => s.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              filterStatus === 'pending'
                ? 'bg-[#D97736] text-white shadow-xs'
                : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
            }`}
          >
            Beklemede ({students.filter((s) => s.status === 'pending').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Öğrenci adı veya hedef ara..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
          />
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bento-card p-12 text-center bg-white">
          <Users className="w-12 h-12 text-[#DFD9CC] mx-auto mb-3" />
          <h4 className="text-base font-bold text-[#1B2A4A]">Öğrenci Bulunamadı</h4>
          <p className="text-xs text-[#4A5B78] mt-1 max-w-sm mx-auto">
            Arama kriterlerinize uygun öğrenci yok veya henüz davet kodunuzla katılan öğrenci bulunmuyor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((st) => {
            const completedGoals = st.customGoals.filter((g) => g.completed).length;
            const totalGoals = st.customGoals.length;
            const goalPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

            return (
              <div
                key={st.id}
                id={`student-card-${st.id}`}
                className="bento-card p-5.5 bg-white flex flex-col justify-between hover:border-[#1B2A4A] transition-all group"
              >
                <div>
                  {/* Top Profile Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl ${st.avatarColor} text-white font-extrabold text-base flex items-center justify-center shadow-xs`}
                      >
                        {st.name ? st.name.charAt(0).toUpperCase() : 'Ö'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-[#1B2A4A] group-hover:text-[#255A8A] transition-colors">
                            {st.name}
                          </h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#1B2A4A]/5 text-[#1B2A4A] border border-[#1B2A4A]/10">
                            {st.field}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4A5B78] font-medium truncate max-w-[170px]">
                          {st.targetDepartment}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        st.status === 'approved'
                          ? 'bg-[#2E6B4F]/10 text-[#2E6B4F] border-[#2E6B4F]/20'
                          : 'bg-[#D97736]/10 text-[#D97736] border-[#D97736]/20'
                      }`}
                    >
                      {st.status === 'approved' ? 'Onaylı' : 'Onay Bekliyor'}
                    </span>
                  </div>

                  {/* Target & Rank Pill */}
                  <div className="mt-4 p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC]/80 flex items-center justify-between text-xs">
                    <span className="text-[#4A5B78] text-[11px] flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#255A8A]" />
                      <span>Hedef Sıralama:</span>
                    </span>
                    <span className="font-extrabold text-[#1B2A4A]">{st.targetRank}</span>
                  </div>

                  {/* Net Progress Bars */}
                  <div className="mt-4 space-y-2.5">
                    {/* TYT Net Progress */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span className="text-[#4A5B78]">TYT Net İlerlemesi:</span>
                        <span className="font-extrabold text-[#1B2A4A]">
                          {st.currentNetTYT} <span className="text-[#7E8D9F] font-normal">/ {st.targetNetTYT}</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#EFEBE0] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#255A8A] h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round((st.currentNetTYT / st.targetNetTYT) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* AYT Net Progress */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span className="text-[#4A5B78]">AYT Net İlerlemesi:</span>
                        <span className="font-extrabold text-[#1B2A4A]">
                          {st.currentNetAYT} <span className="text-[#7E8D9F] font-normal">/ {st.targetNetAYT}</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#EFEBE0] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#2E6B4F] h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round((st.currentNetAYT / st.targetNetAYT) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Goals & Hours Badges */}
                  <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-[#DFD9CC]/60">
                    <div className="p-2 rounded-lg bg-[#F7F4EE] text-center">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Haftalık Çalışma</p>
                      <p className="text-xs font-black text-[#1B2A4A] mt-0.5">
                        {st.weeklyStudyCompletedHours}s / {st.weeklyStudyGoalHours}s
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F7F4EE] text-center">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Hedef Başarısı</p>
                      <p className="text-xs font-black text-[#D97736] mt-0.5">
                        %{goalPercent} ({completedGoals}/{totalGoals})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3.5 border-t border-[#DFD9CC]/80 flex items-center justify-between gap-2">
                  {st.status === 'pending' ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        onClick={(e) => handleApprove(st.id, e)}
                        className="flex-1 py-2 text-xs font-extrabold bg-[#2E6B4F] hover:bg-[#255A8A] text-white rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Onayla</span>
                      </button>
                      <button
                        onClick={(e) => handleReject(st.id, e)}
                        className="px-3 py-2 text-xs font-bold text-[#C0392B] bg-[#C0392B]/10 hover:bg-[#C0392B]/20 rounded-xl transition-colors"
                      >
                        Reddet
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          openStudentDetail(st);
                          setDetailTab('program');
                        }}
                        className="flex-1 py-2 text-xs font-extrabold bg-[#1B2A4A] hover:bg-[#255A8A] text-white rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                        title="Öğrencinin haftalık ders programını yap / düzenle"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#D97736]" />
                        <span>Haftalık Program</span>
                      </button>
                      <button
                        onClick={() => openStudentDetail(st)}
                        className="p-2 text-[#4A5B78] hover:text-[#1B2A4A] bg-[#EFEBE0] hover:bg-[#DFD9CC] rounded-xl transition-colors"
                        title="Tüm Detayları Gör"
                      >
                        <ArrowUpRight className="w-4 h-4 text-[#255A8A]" />
                      </button>
                      <button
                        onClick={() => {
                          openStudentDetail(st);
                          setDetailTab('notes');
                        }}
                        className="p-2 text-[#4A5B78] hover:text-[#1B2A4A] bg-[#EFEBE0] hover:bg-[#DFD9CC] rounded-xl transition-colors"
                        title="Koç Notu Ekle"
                      >
                        <FileText className="w-4 h-4 text-[#D97736]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED STUDENT INSPECTION MODAL */}
      {/* ========================================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#F7F4EE] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#DFD9CC] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-white border-b border-[#DFD9CC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl ${selectedStudent.avatarColor} text-white font-black text-xl flex items-center justify-center shadow-xs`}
                >
                  {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'Ö'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#1B2A4A]">
                      {selectedStudent.name}
                    </h3>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-[#1B2A4A]/10 text-[#1B2A4A]">
                      {selectedStudent.field}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        selectedStudent.status === 'approved'
                          ? 'bg-[#2E6B4F]/10 text-[#2E6B4F]'
                          : 'bg-[#D97736]/10 text-[#D97736]'
                      }`}
                    >
                      {selectedStudent.status === 'approved' ? 'Onaylı Öğrenci' : 'Beklemede'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5B78] mt-0.5">
                    {selectedStudent.targetUniversity} • {selectedStudent.targetDepartment} ({selectedStudent.targetRank})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-[#7E8D9F] hover:text-[#1B2A4A] rounded-xl hover:bg-[#EFEBE0] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Selector */}
            <div className="px-5 sm:px-6 bg-[#EFEBE0]/60 border-b border-[#DFD9CC] flex items-center gap-2 overflow-x-auto py-2.5 text-xs font-extrabold">
              <button
                onClick={() => setDetailTab('program')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  detailTab === 'program'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:bg-white/80'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#D97736]" />
                <span>Haftalık Ders Programı</span>
              </button>

              <button
                onClick={() => setDetailTab('exams')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  detailTab === 'exams'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:bg-white/80'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#D97736]" />
                <span>Deneme Grafikleri & Netler</span>
              </button>

              <button
                onClick={() => setDetailTab('study')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  detailTab === 'study'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:bg-white/80'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#255A8A]" />
                <span>Anlık Çalışma Logu</span>
              </button>

              <button
                onClick={() => setDetailTab('wrong')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  detailTab === 'wrong'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:bg-white/80'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#C0392B]" />
                <span>Hatalı Soru Teşhisi</span>
              </button>

              <button
                onClick={() => setDetailTab('goals')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  detailTab === 'goals'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:bg-white/80'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-[#2E6B4F]" />
                <span>Özel Hedefler & Başarı</span>
              </button>

              <button
                onClick={() => setDetailTab('notes')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  detailTab === 'notes'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:bg-white/80'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#D97736]" />
                <span>Koçluk Notları ({selectedStudent.notes.length})</span>
              </button>

              <button
                onClick={() => setDetailTab('books')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  detailTab === 'books'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:bg-white/80'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#D97736]" />
                <span>Kitap & Kaynak Takibi ({studentBooks.length})</span>
              </button>
            </div>

            {/* Modal Body with Tab Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* ========================================================= */}
              {/* TAB 1: DENEME GRAFİKLERİ & TAM DETAYLI ANALİZ */}
              {/* ========================================================= */}
              {detailTab === 'exams' && (
                <div className="space-y-5">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-[#DFD9CC] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-[#7E8D9F] font-bold">Mevcut TYT Neti</p>
                        <span className="text-[10px] font-bold text-[#255A8A] bg-[#255A8A]/10 px-2 py-0.5 rounded-full">
                          Hedef {selectedStudent.targetNetTYT}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-[#1B2A4A] mt-1.5">{selectedStudent.currentNetTYT}</p>
                      <div className="w-full bg-[#EFEBE0] h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-[#255A8A] h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round((selectedStudent.currentNetTYT / selectedStudent.targetNetTYT) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#DFD9CC] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-[#7E8D9F] font-bold">Mevcut AYT Neti</p>
                        <span className="text-[10px] font-bold text-[#2E6B4F] bg-[#2E6B4F]/10 px-2 py-0.5 rounded-full">
                          Hedef {selectedStudent.targetNetAYT}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-[#2E6B4F] mt-1.5">{selectedStudent.currentNetAYT}</p>
                      <div className="w-full bg-[#EFEBE0] h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-[#2E6B4F] h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round((selectedStudent.currentNetAYT / selectedStudent.targetNetAYT) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#DFD9CC] shadow-2xs">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Kayıtlı Deneme Sayısı</p>
                      <p className="text-2xl font-black text-[#1B2A4A] mt-1.5">
                        {studentDetailedData?.exams.length || 0} Adet
                      </p>
                      <p className="text-[10px] text-[#7E8D9F] mt-1">Koçluk portföyünde aktif</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#DFD9CC] shadow-2xs">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Hedeflenen Sıralama</p>
                      <p className="text-2xl font-black text-[#D97736] mt-1.5">{selectedStudent.targetRank}</p>
                      <p className="text-[10px] text-[#2E6B4F] mt-1 font-bold">Net Trendi Yükselişte ↗</p>
                    </div>
                  </div>

                  {/* Net Evolution Chart */}
                  <div className="p-5 rounded-2xl bg-white border border-[#DFD9CC]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#1B2A4A]">Deneme Net İlerleme Eğrisi</h4>
                        <p className="text-[11px] text-[#4A5B78]">Öğrencinin kronolojik TYT ve AYT net değişimi</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-[#255A8A]">
                          <span className="w-3 h-3 rounded-full bg-[#255A8A]" /> TYT Net
                        </span>
                        <span className="flex items-center gap-1.5 text-[#2E6B4F]">
                          <span className="w-3 h-3 rounded-full bg-[#2E6B4F]" /> AYT Net
                        </span>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={
                            studentDetailedData?.exams && studentDetailedData.exams.length > 0
                              ? [...studentDetailedData.exams]
                                  .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
                                  .map((ex, idx) => ({
                                    name: ex.exam_name.length > 14 ? ex.exam_name.substring(0, 12) + '...' : ex.exam_name,
                                    TYT: ex.exam_type === 'TYT' ? examsService.calculateTotalNet(ex) : undefined,
                                    AYT: ex.exam_type === 'AYT' ? examsService.calculateTotalNet(ex) : undefined,
                                  }))
                              : [
                                  { name: '1. Deneme', TYT: 72.5, AYT: 38.0 },
                                  { name: '2. Deneme', TYT: 75.0, AYT: 42.5 },
                                  { name: '3. Deneme', TYT: 79.25, AYT: 45.0 },
                                  { name: '4. Deneme', TYT: 81.0, AYT: 48.25 },
                                  { name: '5. Deneme', TYT: selectedStudent.currentNetTYT, AYT: selectedStudent.currentNetAYT },
                                ]
                          }
                          margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#DFD9CC" vertical={false} />
                          <XAxis dataKey="name" stroke="#7E8D9F" fontSize={11} />
                          <YAxis domain={[20, 120]} stroke="#7E8D9F" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1B2A4A',
                              borderColor: '#1B2A4A',
                              color: '#F7F4EE',
                              borderRadius: '12px',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="TYT"
                            stroke="#255A8A"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#255A8A' }}
                            connectNulls
                          />
                          <Line
                            type="monotone"
                            dataKey="AYT"
                            stroke="#2E6B4F"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#2E6B4F' }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Subject Breakdown Performance Matrix */}
                  <div className="p-5 rounded-2xl bg-white border border-[#DFD9CC]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#1B2A4A]">Ders Bazlı Net & Başarı Analizi</h4>
                        <p className="text-[11px] text-[#4A5B78]">Öğrencinin branş bazındaki ortalama doğruları, yanlışları ve netleri</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#255A8A]/10 text-[#255A8A]">
                        Koçluk Metrikleri
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { name: 'Türkçe', correct: 34, wrong: 4, blank: 2, net: 33.0, max: 40, status: 'Güçlü', color: '#255A8A' },
                        { name: 'Temel Matematik', correct: 30, wrong: 3, blank: 7, net: 29.25, max: 40, status: 'İyi Gidiyor', color: '#2E6B4F' },
                        { name: 'Fen Bilimleri (TYT)', correct: 16, wrong: 3, blank: 1, net: 15.25, max: 20, status: 'İyi', color: '#D97736' },
                        { name: 'Sosyal Bilimler', correct: 17, wrong: 2, blank: 1, net: 16.5, max: 20, status: 'Güçlü', color: '#8E44AD' },
                        { name: 'AYT Matematik', correct: 28, wrong: 4, blank: 8, net: 27.0, max: 40, status: 'Gelişmeli', color: '#255A8A' },
                        { name: 'AYT Fizik', correct: 10, wrong: 3, blank: 1, net: 9.25, max: 14, status: 'Kritik Dikkat', color: '#C0392B' },
                        { name: 'AYT Kimya', correct: 11, wrong: 2, blank: 0, net: 10.5, max: 13, status: 'İyi', color: '#2E6B4F' },
                        { name: 'AYT Biyoloji', correct: 11, wrong: 1, blank: 1, net: 10.75, max: 13, status: 'Güçlü', color: '#2E6B4F' },
                      ].map((sub, sIdx) => {
                        const percent = Math.round((sub.net / sub.max) * 100);
                        return (
                          <div key={sIdx} className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC]/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#1B2A4A]">{sub.name}</span>
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                  sub.status === 'Güçlü'
                                    ? 'bg-[#2E6B4F]/15 text-[#2E6B4F]'
                                    : sub.status === 'Kritik Dikkat'
                                    ? 'bg-[#C0392B]/15 text-[#C0392B]'
                                    : 'bg-[#255A8A]/15 text-[#255A8A]'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="text-[11px] text-[#7E8D9F]">
                                D: <strong className="text-[#2E6B4F]">{sub.correct}</strong> • Y: <strong className="text-[#C0392B]">{sub.wrong}</strong> • B: {sub.blank}
                              </span>
                              <span className="font-black text-[#1B2A4A]">{sub.net} Net</span>
                            </div>
                            <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-[#DFD9CC]/50">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: sub.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Complete Exam List with Full Inspection Button */}
                  <div className="p-5 rounded-2xl bg-white border border-[#DFD9CC]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#1B2A4A]">Kayıtlı Denemeler & Soru Analizleri</h4>
                        <p className="text-[11px] text-[#4A5B78]">Her denemenin detaylı konu ve soru teşhisini koç gözüyle açıp inceleyin</p>
                      </div>
                      <span className="text-xs font-bold text-[#7E8D9F]">
                        {studentDetailedData?.exams.length || 0} Deneme
                      </span>
                    </div>

                    {studentDetailedData?.exams && studentDetailedData.exams.length > 0 ? (
                      <div className="space-y-3">
                        {studentDetailedData.exams.map((ex) => {
                          const totalNet = examsService.calculateTotalNet(ex);
                          return (
                            <div
                              key={ex.id}
                              className="p-4 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#1B2A4A] transition-all"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#1B2A4A] text-white">
                                    {ex.exam_type}
                                  </span>
                                  <h5 className="font-extrabold text-xs text-[#1B2A4A]">{ex.exam_name}</h5>
                                  <span className="text-[11px] text-[#7E8D9F]">
                                    ({new Date(ex.exam_date).toLocaleDateString('tr-TR')})
                                  </span>
                                </div>

                                {/* Subject pills */}
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                  {(ex.subject_results || []).map((sub, subIdx) => (
                                    <span
                                      key={subIdx}
                                      className="px-2 py-0.5 rounded-md bg-white border border-[#DFD9CC] text-[#1B2A4A] font-medium"
                                    >
                                      {sub.subject_name}: <strong className="text-[#255A8A]">{sub.net.toFixed(2)}N</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <p className="text-[10px] text-[#7E8D9F]">Toplam Net</p>
                                  <p className="text-base font-black text-[#2E6B4F]">{totalNet.toFixed(2)} Net</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedExamForCoachModal(ex)}
                                  className="py-2 px-3.5 bg-[#1B2A4A] hover:bg-[#255A8A] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#D97736]" />
                                  <span>Soruları & Detayları İncele</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-[#F7F4EE] rounded-xl border border-dashed border-[#DFD9CC]">
                        <Award className="w-8 h-8 text-[#7E8D9F] mx-auto mb-2 opacity-60" />
                        <p className="text-xs font-bold text-[#1B2A4A]">Öğrencinin sisteme girdiği deneme kaydı bulunuyor.</p>
                        <p className="text-[11px] text-[#7E8D9F] mt-1">Öğrenci deneme ekledikçe tüm soru ve konu ayrıntıları bu ekranda anlık olarak listelenecektir.</p>
                      </div>
                    )}
                  </div>

                  {/* Topic Weakness Diagnosis Radar */}
                  <div className="p-5 rounded-2xl bg-white border border-[#DFD9CC]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#1B2A4A]">Öğrencinin En Çok Puan Kaybettiği Konular</h4>
                        <p className="text-[11px] text-[#4A5B78]">Deneme ve soru bankası verilerine göre tespit edilen öncelikli eksikler</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#D97736]/15 text-[#D97736]">
                        Eksik Teşhisi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { topic: 'Trigonometri • Toplam-Fark & Denklemler', subject: 'Matematik', mistakes: 5, rec: 'Fasikül Tekrarı + 100 Soru' },
                        { topic: 'Kalıtım & Soyağaçları', subject: 'Biyoloji', mistakes: 4, rec: 'Kavram Haritası Çizimi' },
                        { topic: 'Optik • Kırılma ve Mercekler', subject: 'Fizik', mistakes: 4, rec: 'MEB Kazanım Testleri' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-[#255A8A] bg-[#255A8A]/10 px-2 py-0.5 rounded-md">
                              {item.subject}
                            </span>
                            <h5 className="font-extrabold text-xs text-[#1B2A4A] mt-2 leading-snug">{item.topic}</h5>
                            <p className="text-[11px] text-[#C0392B] font-bold mt-1">Toplam {item.mistakes} Soru Kaybı</p>
                            <p className="text-[10px] text-[#7E8D9F] mt-0.5">Tavsiye: {item.rec}</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!selectedStudent) return;
                              await coachService.addCustomGoal(selectedStudent.id, {
                                title: `${item.subject}: ${item.topic} Eksik Kapatma`,
                                category: 'konu',
                                targetValue: '100 Soru Çözümü',
                                deadline: 'Bu Hafta Sonu',
                              });
                              const updated = await coachService.getStudentById(selectedStudent.id);
                              if (updated) setSelectedStudent(updated);
                              setDetailTab('goals');
                            }}
                            className="mt-3 w-full py-1.5 px-2 bg-white hover:bg-[#1B2A4A] hover:text-white border border-[#DFD9CC] text-[#1B2A4A] text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3 text-[#D97736]" />
                            <span>Hedef Olarak Ekle</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: ANLIK ÇALIŞMA LOGU */}
              {/* ========================================================= */}
              {detailTab === 'study' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#DFD9CC] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#4A5B78]">Haftalık Toplam Çalışma Süresi</p>
                      <p className="text-2xl font-black text-[#1B2A4A] mt-0.5">
                        {selectedStudent.weeklyStudyCompletedHours} Saat{' '}
                        <span className="text-sm font-normal text-[#7E8D9F]">/ Hedef {selectedStudent.weeklyStudyGoalHours}s</span>
                      </p>
                    </div>
                    <div className="w-32 bg-[#EFEBE0] h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2E6B4F] h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((selectedStudent.weeklyStudyCompletedHours / selectedStudent.weeklyStudyGoalHours) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recent Sessions List */}
                  <div className="p-5 rounded-2xl bg-white border border-[#DFD9CC]">
                    <h4 className="font-extrabold text-sm text-[#1B2A4A] mb-3">Son Çalışma Oturumları</h4>
                    <div className="space-y-2">
                      {[
                        { subject: 'Biyoloji', topic: 'Kalıtım & Soyağacı', duration: 90, date: 'Bugün 14:00', type: 'Pomodoro (3 Blok)' },
                        { subject: 'Matematik', topic: 'Türev Uygulamaları', duration: 120, date: 'Bugün 10:30', type: 'Soru Çözümü' },
                        { subject: 'Fizik', topic: 'Optik ve Kırılma', duration: 75, date: 'Dün 18:00', type: 'Konu Tekrarı' },
                        { subject: 'Kimya', topic: 'Organik Kimyaya Giriş', duration: 60, date: 'Dün 15:30', type: 'Pomodoro (2 Blok)' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC]/70 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-[#255A8A]/10 text-[#255A8A] flex items-center justify-center font-bold">
                              {item.subject ? item.subject.charAt(0).toUpperCase() : 'D'}
                            </span>
                            <div>
                              <p className="font-bold text-[#1B2A4A]">{item.subject} • {item.topic}</p>
                              <p className="text-[10px] text-[#7E8D9F]">{item.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-[#2E6B4F]">{item.duration} dk</p>
                            <p className="text-[10px] text-[#7E8D9F]">{item.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: HATALI SORU TEŞHİSİ */}
              {/* ========================================================= */}
              {detailTab === 'wrong' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-[#DFD9CC] text-center">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Bilgi Eksikliği</p>
                      <p className="text-lg font-black text-[#C0392B] mt-0.5">5 Soru</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-[#DFD9CC] text-center">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Dikkatsizlik</p>
                      <p className="text-lg font-black text-[#D97736] mt-0.5">6 Soru</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-[#DFD9CC] text-center">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Kavram Yanılgısı</p>
                      <p className="text-lg font-black text-[#255A8A] mt-0.5">3 Soru</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#DFD9CC]">
                    <h4 className="font-extrabold text-sm text-[#1B2A4A] mb-3">Öğrencinin Kaydettiği Hatalı Sorular</h4>
                    <div className="space-y-3">
                      {[
                        {
                          subject: 'Biyoloji',
                          topic: 'Kalıtım ve Genetik',
                          error: 'Kavram Yanılgısı',
                          note: 'X kromozomuna bağlı aktarım ile otozomal çekinik aktarımı karıştırdım.',
                          tip: 'Soyağacı üzerinde genotipleri bireylerin üzerine açıkça yazarak ilerle.',
                        },
                        {
                          subject: 'Fizik',
                          topic: 'Optik ve Işık',
                          error: 'Dikkatsizlik',
                          note: 'Işığın çok yoğun ortamdan az yoğun ortama geçerken kırılma açısını ters düşündüm.',
                          tip: 'Snell yasasında ortam kırıcılık indisi ile hızın ters orantılı olduğunu hatırla.',
                        },
                        {
                          subject: 'Matematik',
                          topic: 'Türev Uygulamaları',
                          error: 'İşlem Hatası / Dikkatsizlik',
                          note: 'Ekstremum noktada türevin işaret değişim tablosunu aceleyle çizdim.',
                          tip: 'Kök tablosunda başkatsayının işaretini en sağdan vererek dikkatle doldur.',
                        },
                      ].map((q, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[#1B2A4A]">{q.subject}</span>
                              <span className="text-[#7E8D9F]">•</span>
                              <span className="text-[#4A5B78]">{q.topic}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C0392B]/10 text-[#C0392B]">
                              {q.error}
                            </span>
                          </div>
                          <p className="text-[#4A5B78] italic">"{q.note}"</p>
                          <div className="p-2 rounded-lg bg-white border border-[#DFD9CC]/60 flex items-start gap-1.5 text-[11px] text-[#2E6B4F]">
                            <Sparkles className="w-3.5 h-3.5 text-[#D97736] shrink-0 mt-0.5" />
                            <span><strong>Koç & AI Önerisi:</strong> {q.tip}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: ÖZEL HEDEFLER & BAŞARI TAKİBİ */}
              {/* ========================================================= */}
              {detailTab === 'goals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#1B2A4A]">Öğrenciye Özel Hedefler & Başarı Takibi</h4>
                      <p className="text-[11px] text-[#4A5B78]">Belirlenen hedefleri tamamlandıkça işaretle veya yeni hedef ekle.</p>
                    </div>
                    <button
                      onClick={() => setShowAddGoalModal(true)}
                      className="px-3.5 py-1.5 text-xs font-extrabold bg-[#1B2A4A] hover:bg-[#255A8A] text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D97736]" />
                      <span>Yeni Hedef Ekle</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedStudent.customGoals.length === 0 ? (
                      <p className="text-xs text-[#7E8D9F] text-center py-6">Henüz özel hedef tanımlanmamış.</p>
                    ) : (
                      selectedStudent.customGoals.map((g) => (
                        <div
                          key={g.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            g.completed
                              ? 'bg-[#2E6B4F]/5 border-[#2E6B4F]/20'
                              : 'bg-white border-[#DFD9CC]'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleGoal(g.id)}
                              className="mt-0.5 text-[#2E6B4F] hover:scale-110 transition-transform"
                            >
                              {g.completed ? (
                                <CheckCircle2 className="w-5 h-5 fill-[#2E6B4F] text-white" />
                              ) : (
                                <Circle className="w-5 h-5 text-[#DFD9CC] hover:text-[#2E6B4F]" />
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs font-bold ${
                                  g.completed ? 'line-through text-[#7E8D9F]' : 'text-[#1B2A4A]'
                                }`}
                              >
                                {g.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-[#7E8D9F]">
                                <span className="px-2 py-0.5 rounded-md bg-[#EFEBE0] font-bold text-[#1B2A4A]">
                                  {g.category.toUpperCase()}
                                </span>
                                <span>Hedef: {g.targetValue}</span>
                                <span>•</span>
                                <span>Termin: {g.deadline}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteGoal(g.id)}
                            className="p-1.5 text-[#7E8D9F] hover:text-[#C0392B] rounded-lg transition-colors"
                            title="Hedefi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: KOÇLUK NOTLARI */}
              {/* ========================================================= */}
              {detailTab === 'notes' && (
                <div className="space-y-4">
                  {/* New Note Composer */}
                  <form onSubmit={handleAddNoteSubmit} className="p-4 rounded-2xl bg-white border border-[#DFD9CC] space-y-3">
                    <h4 className="font-extrabold text-xs text-[#1B2A4A] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#D97736]" />
                      <span>{selectedStudent.name} İçin Yeni Koçluk Notu Yaz</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        placeholder="Not Başlığı (örn: TYT Net Artışı Stratejisi)..."
                        className="sm:col-span-2 px-3 py-2 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                        required
                      />
                      <select
                        value={newNoteTag}
                        onChange={(e) => setNewNoteTag(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                      >
                        <option value="Strateji">Strateji</option>
                        <option value="Motivasyon">Motivasyon</option>
                        <option value="Ders Dağılımı">Ders Dağılımı</option>
                        <option value="Deneme Değerlendirme">Deneme Değerlendirme</option>
                      </select>
                    </div>

                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Görüşme değerlendirmesi, haftalık tavsiyeler veya motivasyon mesajı..."
                      rows={3}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                      required
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-extrabold bg-[#1B2A4A] hover:bg-[#255A8A] text-white rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5 text-[#D97736]" />
                        <span>Notu Kaydet & Öğrenciye İlet</span>
                      </button>
                    </div>
                  </form>

                  {/* Notes Feed */}
                  <div className="space-y-3">
                    {selectedStudent.notes.length === 0 ? (
                      <p className="text-xs text-[#7E8D9F] text-center py-6">Henüz kayıtlı koçluk notu yok.</p>
                    ) : (
                      selectedStudent.notes.map((note) => (
                        <div key={note.id} className="p-4 rounded-2xl bg-white border border-[#DFD9CC] space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#1B2A4A]">{note.title}</span>
                              {note.tag && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E6B4F]/10 text-[#2E6B4F]">
                                  {note.tag}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#7E8D9F]">{note.date}</span>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-[#7E8D9F] hover:text-[#C0392B] p-1 rounded-lg"
                                title="Notu Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-[#4A5B78] leading-relaxed whitespace-pre-line">{note.content}</p>
                          <div className="text-[10px] font-medium text-[#7E8D9F]">Yazan: {note.author}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 6: ÖĞRENCİNİN KAYNAK VE KİTAP TAKİBİ */}
              {/* ========================================================= */}
              {detailTab === 'books' && (
                <div className="space-y-4">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#DFD9CC]">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Kayıtlı Kitap Sayısı</p>
                      <p className="text-xl font-black text-[#1B2A4A] mt-1">{studentBooks.length}</p>
                      <p className="text-[10px] text-[#255A8A] mt-0.5">Soru Bankası / Fasikül</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#DFD9CC]">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Aktif Çözülen</p>
                      <p className="text-xl font-black text-[#D97736] mt-1">
                        {studentBooks.filter((b) => b.status === 'in_progress').length}
                      </p>
                      <p className="text-[10px] text-[#D97736] mt-0.5">Masa Üstünde</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#DFD9CC]">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Tamamlanan Kitap</p>
                      <p className="text-xl font-black text-[#2E6B4F] mt-1">
                        {studentBooks.filter((b) => b.status === 'completed').length}
                      </p>
                      <p className="text-[10px] text-[#2E6B4F] mt-0.5">Kütüphanede Bitti</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#DFD9CC]">
                      <p className="text-[10px] text-[#7E8D9F] font-bold">Bitirilen Konu Oranı</p>
                      <p className="text-xl font-black text-[#1B2A4A] mt-1">
                        %{(() => {
                          let tot = 0;
                          let comp = 0;
                          studentBooks.forEach((b) => {
                            tot += b.total_topics_count || (b.topics?.length || 0);
                            comp += b.completed_topics_count || (b.topics?.filter((t) => t.status === 'completed').length || 0);
                          });
                          return tot === 0 ? 0 : Math.round((comp / tot) * 100);
                        })()}
                      </p>
                      <p className="text-[10px] text-[#2E6B4F] mt-0.5">Tüm Kitaplar Ortalaması</p>
                    </div>
                  </div>

                  {/* Student Books List */}
                  {studentBooks.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#DFD9CC] space-y-2">
                      <BookOpen className="w-8 h-8 text-[#7E8D9F] mx-auto opacity-70" />
                      <p className="text-xs font-bold text-[#1B2A4A]">Öğrencinin henüz kayıtlı kitabı bulunmuyor.</p>
                      <p className="text-[11px] text-[#4A5B78]">
                        Öğrenci elindeki kaynakları sisteme eklediğinde burada konu bazlı çözülme oranlarını görebilirsiniz.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentBooks.map((book) => {
                        const completion = book.completion_percentage ?? 0;
                        const completedCount = book.completed_topics_count ?? (book.topics?.filter((t) => t.status === 'completed').length || 0);
                        const totalCount = book.total_topics_count ?? (book.topics?.length || 0);
                        const isCompleted = book.status === 'completed' || completion === 100;

                        return (
                          <div
                            key={book.id}
                            onClick={() => setSelectedBookForCoach(book)}
                            className="p-4 rounded-2xl bg-white border border-[#DFD9CC] hover:border-[#1B2A4A] transition-all cursor-pointer shadow-2xs hover:shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
                                  {book.exam_type}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/20">
                                  {book.subject}
                                </span>
                                <span className="text-xs font-black text-[#1B2A4A]">
                                  {book.title}
                                </span>
                                <span className="text-xs text-[#7E8D9F]">({book.publisher})</span>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  isCompleted
                                    ? 'bg-[#2E6B4F]/10 text-[#2E6B4F]'
                                    : 'bg-[#D97736]/10 text-[#D97736]'
                                }`}
                              >
                                {isCompleted ? '✓ BİTTİ' : '⏳ ÇÖZÜLÜYOR'}
                              </span>
                            </div>

                            {book.student_notes && (
                              <p className="text-[11px] text-[#4A5B78] italic bg-[#F7F4EE] px-2.5 py-1 rounded-lg">
                                Öğrenci Notu: "{book.student_notes}"
                              </p>
                            )}

                            {/* Progress bar and details */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-[#4A5B78]">
                                  Konu İlerlemesi: <strong className="text-[#1B2A4A]">{completedCount}</strong>/{totalCount} Konu Tamamlandı
                                </span>
                                <span className="font-mono font-black text-[#1B2A4A]">
                                  %{completion}
                                </span>
                              </div>

                              <div className="w-full h-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${completion}%` }}
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isCompleted ? 'bg-[#2E6B4F]' : 'bg-[#255A8A]'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Click to inspect button */}
                            <div className="flex items-center justify-between pt-1 border-t border-[#DFD9CC]/60 text-[11px]">
                              <span className="text-[#255A8A] font-bold hover:underline flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Konuları & Tikleri Detaylı İncele</span>
                              </span>
                              {book.total_questions && (
                                <span className="text-[#7E8D9F] font-semibold">
                                  Toplam ~{book.total_questions} Soru
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 7: HAFTALIK DERS PROGRAMI OLUŞTURMA & YÖNETİM */}
              {/* ========================================================= */}
              {detailTab === 'program' && (
                <StudentProgramCoachBuilder
                  student={selectedStudent}
                  onProgramSaved={() => {
                    fetchStudents();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Book Inspection Modal for Coach */}
      {selectedBookForCoach && (
        <BookDetailModal
          book={selectedBookForCoach}
          isOpen={!!selectedBookForCoach}
          onClose={() => setSelectedBookForCoach(null)}
          onBookUpdated={(updated) => {
            setStudentBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            setSelectedBookForCoach(updated);
          }}
          onBookDeleted={(bId) => {
            setStudentBooks((prev) => prev.filter((b) => b.id !== bId));
            setSelectedBookForCoach(null);
          }}
          readOnly={false}
        />
      )}

      {/* ========================================================================= */}
      {/* ADD NEW GOAL SUB-MODAL */}
      {/* ========================================================================= */}
      {showAddGoalModal && selectedStudent && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F4EE] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DFD9CC] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-[#1B2A4A]">Yeni Başarı Hedefi Belirle</h3>
              <button onClick={() => setShowAddGoalModal(false)} className="p-1.5 text-[#7E8D9F] hover:text-[#1B2A4A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddGoalSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A5B78] mb-1">Hedef Başlığı</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="örn: TYT Fen 15+ Net, Haftalık 1.500 Soru..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A5B78] mb-1">Kategori</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="deneme">Deneme Neti</option>
                    <option value="soru">Soru Adedi</option>
                    <option value="konu">Konu Bitirme</option>
                    <option value="sure">Çalışma Süresi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4A5B78] mb-1">Hedef Değer</label>
                  <input
                    type="text"
                    value={goalTargetValue}
                    onChange={(e) => setGoalTargetValue(e.target.value)}
                    placeholder="örn: 30 Net / 1000 Soru"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A5B78] mb-1">Termin / Bitiş Tarihi</label>
                <input
                  type="text"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  placeholder="örn: 30 Ekim 2026 / Her Pazar"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-[#1B2A4A] text-white rounded-xl hover:bg-[#255A8A] transition-colors"
                >
                  Hedefi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL ENROLL STUDENT MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F4EE] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DFD9CC] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base text-[#1B2A4A] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#D97736]" />
                <span>Yeni Öğrenci Kaydet (Manuel / Davet)</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-[#7E8D9F] hover:text-[#1B2A4A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#4A5B78] mb-1">Öğrenci Adı Soyadı</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="örn: Demir Yılmaz"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#4A5B78] mb-1">YKS Alanı</label>
                  <select
                    value={newStudentField}
                    onChange={(e) => setNewStudentField(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="SAY">SAY (Sayısal)</option>
                    <option value="EA">EA (Eşit Ağırlık)</option>
                    <option value="SÖZ">SÖZ (Sözel)</option>
                    <option value="DİL">DİL (Yabancı Dil)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A5B78] mb-1">Hedef Sıralama</label>
                  <input
                    type="text"
                    value={newStudentTargetRank}
                    onChange={(e) => setNewStudentTargetRank(e.target.value)}
                    placeholder="örn: İlk 5.000"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A5B78] mb-1">Hedef Bölüm / Üniversite</label>
                <input
                  type="text"
                  value={newStudentTargetDept}
                  onChange={(e) => setNewStudentTargetDept(e.target.value)}
                  placeholder="örn: Hacettepe Tıp / Boğaziçi Bilgisayar"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-extrabold bg-[#1B2A4A] text-white rounded-xl hover:bg-[#255A8A] transition-colors shadow-xs"
                >
                  Öğrenciyi Gruba Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coach Exam Detail Inspection Modal */}
      {selectedExamForCoachModal && (
        <ExamDetailModal
          exam={selectedExamForCoachModal}
          onClose={() => setSelectedExamForCoachModal(null)}
          onDelete={async (id) => {
            try {
              await examsService.deleteExam(id);
              if (selectedStudent) {
                const refreshedData = await coachService.getStudentDetailedData(
                  selectedStudent.id,
                  user?.id,
                  user?.coach_code,
                  user?.role === 'admin'
                );
                setStudentDetailedData(refreshedData);
              }
              setSelectedExamForCoachModal(null);
            } catch (e) {
              console.error('Delete error', e);
            }
          }}
        />
      )}
    </div>
  );
};
