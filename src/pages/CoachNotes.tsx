import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { coachService, CoachStudent, CoachNote } from '../lib/coachService';
import {
  FileText,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  Sparkles,
  Calendar,
  Tag,
  GraduationCap,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Clock,
  Compass,
} from 'lucide-react';

export const CoachNotes: React.FC = () => {
  const { user, navigate } = useAuth();
  const isStudent = user?.role === 'student';
  const isCoach = user?.role === 'coach';
  const isAdmin = user?.role === 'admin';

  // State for Coach / Admin
  const [students, setStudents] = useState<CoachStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState('Strateji');
  const [submitting, setSubmitting] = useState(false);

  // State for Student
  const [studentNotes, setStudentNotes] = useState<CoachNote[]>([]);
  const [studentRecord, setStudentRecord] = useState<CoachStudent | null>(null);

  // Shared Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const TAGS = [
    'Tümü',
    'Strateji',
    'Motivasyon',
    'Ders Dağılımı',
    'Deneme Değerlendirme',
    'Zaman Yönetimi',
    'Taktik',
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isStudent && user) {
        // Fetch notes for the logged-in student
        const notes = await coachService.getNotesForStudent(user.id, user.email);
        setStudentNotes(notes);
        const record = await coachService.getStudentById(user.id);
        setStudentRecord(record);
      } else {
        // Fetch all students for coach / admin
        const list = await coachService.getStudents();
        setStudents(list);
        if (list.length > 0 && !targetStudentId) {
          setTargetStudentId(list[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching coach notes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, user?.role]);

  // Coach action: add note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !noteTitle.trim() || !noteContent.trim()) return;

    setSubmitting(true);
    try {
      await coachService.addCoachNote(targetStudentId, {
        title: noteTitle,
        content: noteContent,
        tag: noteTag,
      });
      setNoteTitle('');
      setNoteContent('');
      await fetchData();
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Coach action: delete note
  const handleDeleteNote = async (studentId: string, noteId: string) => {
    if (confirm('Bu koçluk notunu silmek istediğinize emin misiniz?')) {
      try {
        await coachService.deleteCoachNote(studentId, noteId);
        await fetchData();
      } catch (err) {
        console.error('Failed to delete note', err);
      }
    }
  };

  // Prepare Coach's flattened notes
  const allCoachNotes: Array<CoachNote & { studentId: string; studentName: string; studentField: string }> = [];
  students.forEach((st) => {
    (st.notes || []).forEach((n) => {
      allCoachNotes.push({
        ...n,
        studentId: st.id,
        studentName: st.name,
        studentField: st.field,
      });
    });
  });

  // Filter for Coach view
  const filteredCoachNotes = allCoachNotes.filter((n) => {
    const matchesStudent = selectedStudentId === 'all' || n.studentId === selectedStudentId;
    const matchesTag = selectedTagFilter === 'all' || selectedTagFilter === 'Tümü' || n.tag === selectedTagFilter;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStudent && matchesTag && matchesSearch;
  });

  // Filter for Student view
  const filteredStudentNotes = studentNotes.filter((n) => {
    const matchesTag = selectedTagFilter === 'all' || selectedTagFilter === 'Tümü' || n.tag === selectedTagFilter;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  // ---------------------------------------------------------------------------
  // 1. STUDENT VIEW: "Koçumdan Notlar & Rehberlik Tavsiyeleri"
  // ---------------------------------------------------------------------------
  if (isStudent) {
    return (
      <div id="student-coach-notes-view" className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header Banner */}
        <div className="bento-card p-6 md:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-caveat text-xl text-[#2E6B4F] font-bold">
                Birebir Rehberlik & Gelişim Takibi
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#2E6B4F]/10 text-[#2E6B4F] font-bold border border-[#2E6B4F]/20">
                Öğrenci Paneli
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1B2A4A] tracking-tight">
              Koçumdan Notlar & Rehberlik Tavsiyeleri 📝
            </h2>
            <p className="text-sm text-[#4A5B78] mt-2 max-w-2xl leading-relaxed">
              Koçunuzun haftalık çalışma loglarınızı, deneme netlerinizi ve zayıf konularınızı inceleyerek hazırladığı strateji, turlama taktikleri ve motivasyon notları.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/coaching')}
              className="py-3 px-5 rounded-2xl bg-[#1B2A4A] hover:bg-[#255A8A] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-[#D97736]" />
              <span>Koçuma Soru Sor / Mesaj Yaz</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bento-card p-4 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Tag Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {TAGS.map((tag) => {
                const isActive = (tag === 'Tümü' && selectedTagFilter === 'all') || selectedTagFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTagFilter(tag === 'Tümü' ? 'all' : tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                      isActive
                        ? 'bg-[#1B2A4A] text-white shadow-xs'
                        : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Not başlığı veya içerikte ara..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>
        </div>

        {/* Notes Feed for Student */}
        {loading ? (
          <div className="bento-card p-12 text-center bg-white space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#1B2A4A] border-t-transparent animate-spin mx-auto"></div>
            <p className="text-xs text-[#7E8D9F]">Koçluk notları yükleniyor...</p>
          </div>
        ) : filteredStudentNotes.length === 0 ? (
          <div className="bento-card p-12 text-center bg-white space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F4EE] text-[#7E8D9F] flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#1B2A4A]">Henüz Koçluk Notu Eklenmedi</h4>
              <p className="text-xs text-[#4A5B78] max-w-md mx-auto leading-relaxed">
                Koçunuz haftalık deneme analizlerinizi ve çalışma sürelerinizi değerlendirdikten sonra buraya özel taktik ve strateji notları ekleyecektir.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/coaching')}
                className="py-2.5 px-5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs hover:bg-[#255A8A] transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-[#D97736]" />
                <span>Koçunla İletişime Geç</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/exams')}
                className="py-2.5 px-5 bg-white text-[#1B2A4A] border border-[#DFD9CC] text-xs font-bold rounded-xl inline-flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Clock className="w-4 h-4 text-[#255A8A]" />
                <span>Denemelerini Güncelle</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudentNotes.map((note) => (
              <div
                key={note.id}
                className="bento-card p-6 bg-white border border-[#DFD9CC] space-y-4 hover:border-[#1B2A4A] transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFD9CC]/60 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-base text-[#1B2A4A]">{note.title}</span>
                    {note.tag && (
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20">
                        {note.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#7E8D9F]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{note.date}</span>
                    <span>•</span>
                    <span className="font-bold text-[#255A8A]">{note.author || 'Rehberlik & Koç'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC]/70 text-xs md:text-sm text-[#1B2A4A] leading-relaxed whitespace-pre-line font-medium">
                  {note.content}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-[#7E8D9F] flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-[#D97736]" />
                    <span>Bu tavsiyeyi haftalık çalışma programına uygula</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/coaching')}
                    className="font-extrabold text-xs text-[#255A8A] hover:text-[#D97736] flex items-center gap-1.5 transition-colors"
                  >
                    <span>Koçuma Mesajla Yanıt Ver</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. COACH / ADMIN VIEW: "Koçluk ve Rehberlik Masası (Yaz & Yönet)"
  // ---------------------------------------------------------------------------
  return (
    <div id="coach-notes-management-page" className="space-y-6">
      {/* Top Banner */}
      <div className="bento-card p-6 md:p-8 bg-white flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-caveat text-xl text-[#2E6B4F] font-bold">
              Birebir Rehberlik & Strateji Akışı
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#2E6B4F]/10 text-[#2E6B4F] font-bold border border-[#2E6B4F]/20">
              Koç Yetkisi
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1B2A4A] tracking-tight">
            Koçluk ve Rehberlik Notları Masası 📝
          </h2>
          <p className="text-sm text-[#4A5B78] mt-2 max-w-2xl leading-relaxed">
            Öğrencilerine haftalık değerlendirmelerini ilet, ders dağılımı ve turlama taktiklerini paylaş. Notlar anında öğrencinin kişisel paneline yansır.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-[#DFD9CC]/60 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#4A5B78]">
          <span className="flex items-center gap-1.5 text-[#1B2A4A]">
            <FileText className="w-4 h-4 text-[#2E6B4F]" />
            Toplam: {allCoachNotes.length} Not Paylaşıldı
          </span>
          <span className="text-[#DFD9CC]">•</span>
          <span className="text-[#255A8A]">{students.length} Kayıtlı Öğrenci</span>
        </div>
      </div>

      {/* Main Grid: Composer & Notes Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (Span 1): New Note Composer */}
        <div className="bento-card p-6 bg-white flex flex-col justify-between h-fit">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-base text-[#1B2A4A]">Yeni Not Yaz</h3>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#4A5B78] mb-1">Hedef Öğrenci</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A] font-medium"
                  required
                >
                  {students.length === 0 && <option value="">Kayıtlı öğrenci yok</option>}
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.field} - {st.targetRank})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A5B78] mb-1">Not Başlığı</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="örn: TYT Net Sıçraması & Fen Analizi"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A5B78] mb-1">Kategori / Etiket</label>
                <select
                  value={noteTag}
                  onChange={(e) => setNoteTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
                >
                  <option value="Strateji">Strateji</option>
                  <option value="Motivasyon">Motivasyon</option>
                  <option value="Ders Dağılımı">Ders Dağılımı</option>
                  <option value="Deneme Değerlendirme">Deneme Değerlendirme</option>
                  <option value="Zaman Yönetimi">Zaman Yönetimi</option>
                  <option value="Taktik">Taktik</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A5B78] mb-1">Değerlendirme Notu</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Öğrencinin haftalık gelişimi, eksikleri ve motivasyon tavsiyesi..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A] leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || students.length === 0}
                className="w-full py-3 text-xs font-extrabold bg-[#1B2A4A] hover:bg-[#255A8A] text-white rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#D97736]" />
                <span>{submitting ? 'Kaydediliyor...' : 'Notu Kaydet & Öğrenciye İlet'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Col (Span 2): Filter Bar & Notes Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter and Search Bar */}
          <div className="bento-card p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedStudentId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                  selectedStudentId === 'all'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
                }`}
              >
                Tüm Öğrenciler ({allCoachNotes.length})
              </button>
              {students.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                    selectedStudentId === st.id
                      ? 'bg-[#255A8A] text-white shadow-xs'
                      : 'bg-[#F7F4EE] text-[#4A5B78] hover:bg-[#EFEBE0]'
                  }`}
                >
                  {st.name} ({st.notes?.length || 0})
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#7E8D9F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Notlarda ara..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>

          {/* Notes Feed */}
          {filteredCoachNotes.length === 0 ? (
            <div className="bento-card p-12 text-center bg-white">
              <FileText className="w-12 h-12 text-[#DFD9CC] mx-auto mb-3" />
              <h4 className="text-base font-bold text-[#1B2A4A]">Kayıtlı Not Bulunamadı</h4>
              <p className="text-xs text-[#4A5B78] mt-1 max-w-sm mx-auto">
                {students.length === 0
                  ? 'Henüz kayıtlı öğrenciniz yok. Öğrenciler Davet Kodu ile bağlandıktan sonra onlara not yazabilirsiniz.'
                  : 'Seçtiğiniz filtreye uygun koçluk notu yok. Sol taraftaki formdan hemen yeni bir not oluşturabilirsiniz.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredCoachNotes.map((note) => (
                <div
                  key={note.id}
                  className="bento-card p-5 bg-white border border-[#DFD9CC] space-y-3 hover:border-[#1B2A4A] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#1B2A4A]">{note.title}</span>
                        {note.tag && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20">
                            {note.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#4A5B78]">
                        <span className="font-bold text-[#255A8A] flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{note.studentName}</span>
                        </span>
                        <span className="text-[#DFD9CC]">•</span>
                        <span className="text-[11px] text-[#7E8D9F]">{note.date}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNote(note.studentId, note.id)}
                      className="p-1.5 text-[#7E8D9F] hover:text-[#C0392B] hover:bg-[#C0392B]/10 rounded-lg transition-colors"
                      title="Notu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC]/70 text-xs text-[#1B2A4A] leading-relaxed whitespace-pre-line font-medium">
                    {note.content}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#7E8D9F] pt-1">
                    <span>Yazan: {note.author}</span>
                    <button
                      onClick={() => navigate('/students')}
                      className="font-bold text-[#255A8A] hover:text-[#D97736] flex items-center gap-1 transition-colors"
                    >
                      <span>Öğrenci Profilini Aç</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
